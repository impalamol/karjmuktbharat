-- =============================================================================
-- KARJMUKTBHARAT.COM : initial schema
-- Tables, RLS on EVERY table, indexes for 25 lakh+ users, realtime broadcast,
-- append-only audit log, private storage buckets.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_type as enum ('borrower', 'csr_partner', 'admin');
create type public.loan_type as enum ('education', 'home');
create type public.verification_status as enum ('draft', 'pending', 'verified', 'rejected');
create type public.txn_type as enum ('regular_credit', 'rescue_payout', 'mandate_debit');
create type public.txn_status as enum ('initiated', 'processing', 'success', 'failed', 'reversed');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  mobile          text unique check (mobile ~ '^\+91[6-9][0-9]{9}$'),
  full_name       text check (char_length(full_name) between 2 and 80),
  aadhaar_last4   char(4) check (aadhaar_last4 ~ '^[0-9]{4}$'),
  user_type       public.user_type not null default 'borrower',
  preferred_lang  text not null default 'en' check (preferred_lang in ('en', 'mr')),
  referral_code   text unique not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  referred_by     uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);

-- SECURITY DEFINER so policies can call it without recursive RLS on profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.user_type = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Pool rules (mirror of BLOCK_RULES in src/lib/calculations.ts)
-- ---------------------------------------------------------------------------
create table public.block_rules (
  loan_type             public.loan_type primary key,
  block_size            int    not null check (block_size > 0),
  borrower_pool         bigint not null check (borrower_pool >= 0),
  csr_pool              bigint not null check (csr_pool >= 0),
  rescue_share_of_csr   numeric(4, 3) not null check (rescue_share_of_csr between 0 and 1),
  avg_rescue_ticket     bigint not null check (avg_rescue_ticket > 0),
  updated_at            timestamptz not null default now()
);
insert into public.block_rules values
  ('education', 1000, 1500000, 8500000, 0.8, 300000, now()),
  ('home',      1000, 3000000, 7000000, 0.8, 500000, now());

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------
create table public.loans (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.profiles (id) on delete cascade,
  loan_type               public.loan_type not null,
  bank_name               text not null check (char_length(bank_name) between 2 and 80),
  -- AES-256-GCM ciphertext (base64 iv.ciphertext) produced ONLY inside an Edge Function.
  loan_account_encrypted  text not null,
  loan_account_last4      char(4) not null check (loan_account_last4 ~ '^[0-9A-Za-z]{4}$'),
  ifsc                    text not null check (ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  sanction_amount         bigint not null check (sanction_amount between 10000 and 500000000),
  outstanding             bigint not null check (outstanding >= 0),
  emi                     bigint not null check (emi > 0),
  interest_rate           numeric(5, 2) not null check (interest_rate between 0 and 40),
  is_auction_case         boolean not null default false,
  verification_status     public.verification_status not null default 'pending',
  rejection_reason        text,
  block_number            int,
  seat_number             int check (seat_number between 1 and 1000),
  verified_at             timestamptz,
  verified_by             uuid references public.profiles (id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (outstanding <= sanction_amount * 2)
);
-- One active loan of each type per user.
create unique index loans_user_type_uniq on public.loans (user_id, loan_type) where verification_status <> 'rejected';
create index loans_user_id_idx               on public.loans (user_id);
create index loans_loan_type_idx             on public.loans (loan_type);
create index loans_verification_status_idx   on public.loans (verification_status);
create index loans_created_at_idx            on public.loans (created_at desc, id desc);
create index loans_block_number_idx          on public.loans (loan_type, block_number, seat_number);
-- Admin verification queue: cursor-paginated pending loans.
create index loans_pending_queue_idx         on public.loans (created_at, id) where verification_status = 'pending';

create table public.pools (
  id               uuid primary key default gen_random_uuid(),
  block_number     int not null check (block_number > 0),
  type             public.loan_type not null,
  total_users      int not null default 0 check (total_users between 0 and 1000),
  borrower_pool    bigint not null default 0,
  csr_pool         bigint not null default 0,
  rescue_pool      bigint not null default 0,
  regular_pool     bigint not null default 0,
  rescue_capacity  int not null default 0,
  regular_per_user int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (type, block_number)
);
create index pools_block_number_idx on public.pools (block_number);
create index pools_open_blocks_idx  on public.pools (type, block_number) where total_users < 1000;

create table public.transactions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles (id) on delete restrict,
  loan_id             uuid references public.loans (id) on delete restrict,
  type                public.txn_type not null,
  amount              bigint not null check (amount > 0),
  utr_no              text check (utr_no ~ '^[A-Z0-9]{8,22}$'),
  status              public.txn_status not null default 'initiated',
  provider_ref        text unique,          -- our idempotency key, e.g. rescue-<case id>
  provider_payout_id  text unique,          -- Razorpay payout / payment id
  block_number        int,
  created_at          timestamptz not null default now()
);
create index transactions_user_id_idx    on public.transactions (user_id);
create index transactions_user_cursor_idx on public.transactions (user_id, created_at desc, id desc);
create index transactions_created_at_idx on public.transactions (created_at desc);

create table public.rescue_cases (
  id             uuid primary key default gen_random_uuid(),
  loan_id        uuid not null unique references public.loans (id) on delete restrict,
  loan_type      public.loan_type not null,
  block_number   int,
  display_name   text not null check (char_length(display_name) between 2 and 60), -- e.g. "Priya S., Pune"
  rescue_amount  bigint not null check (rescue_amount > 0),
  story          text check (char_length(story) <= 600),
  is_saved       boolean not null default false,
  saved_at       timestamptz,
  created_at     timestamptz not null default now()
);
create index rescue_cases_wall_idx on public.rescue_cases (saved_at desc, id desc) where is_saved;
create index rescue_cases_open_idx on public.rescue_cases (loan_type, created_at) where not is_saved;

create table public.audit_logs (
  id          bigint generated always as identity primary key,
  user_id     uuid references public.profiles (id) on delete set null,
  action      text not null,
  ip          inet,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_user_id_idx    on public.audit_logs (user_id, created_at desc);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_action_idx     on public.audit_logs (action, created_at desc);

create table public.mandates (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles (id) on delete cascade,
  loan_id               uuid not null references public.loans (id) on delete cascade,
  razorpay_customer_id  text not null,
  razorpay_order_id     text unique,
  razorpay_token_id     text,
  max_amount            bigint not null check (max_amount > 0),
  status                text not null default 'created' check (status in ('created', 'authorized', 'confirmed', 'rejected', 'cancelled')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index mandates_user_id_idx on public.mandates (user_id);

create table public.lucky_draws (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  draw_at           timestamptz not null,
  prize             text not null,
  winner_user_id    uuid references public.profiles (id) on delete set null,
  winner_display    text,
  picked_at         timestamptz,
  created_at        timestamptz not null default now()
);
create index lucky_draws_draw_at_idx on public.lucky_draws (draw_at desc);
insert into public.lucky_draws (title, draw_at, prize)
values ('Diwali Lucky Draw 2026', '2026-11-08 18:30:00+05:30', 'One EMI paid directly to your loan account');

-- Service-role-only tables (RLS on, no policies).
create table public.otp_requests (
  id           bigint generated always as identity primary key,
  mobile_hash  text not null,
  ip           inet,
  created_at   timestamptz not null default now()
);
create index otp_requests_lookup_idx on public.otp_requests (mobile_hash, created_at desc);
create index otp_requests_ip_idx     on public.otp_requests (ip, created_at desc);

create table public.platform_counters (
  key    text primary key,
  value  bigint not null default 0
);
insert into public.platform_counters (key, value) values ('rescued_education', 0), ('rescued_home', 0), ('paid_out_total', 0);

-- ---------------------------------------------------------------------------
-- Row Level Security: enabled on ALL tables
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.block_rules       enable row level security;
alter table public.loans             enable row level security;
alter table public.pools             enable row level security;
alter table public.transactions      enable row level security;
alter table public.rescue_cases      enable row level security;
alter table public.audit_logs        enable row level security;
alter table public.mandates          enable row level security;
alter table public.lucky_draws       enable row level security;
alter table public.otp_requests      enable row level security;
alter table public.platform_counters enable row level security;

-- Defence in depth: start from zero table privileges, then grant exactly what policies allow.
revoke all on all tables in schema public from anon, authenticated;

-- profiles: user can read / update only own row (and only safe columns). Admin reads all.
grant select on public.profiles to authenticated;
grant update (full_name, preferred_lang) on public.profiles to authenticated;
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- loans: user reads own, admin reads all. Writes happen only in Edge Functions (service role)
-- because the account number must be encrypted server-side.
grant select on public.loans to authenticated;
create policy loans_select_own_or_admin on public.loans for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- transactions: user reads own. No update / delete for anyone via the API.
grant select on public.transactions to authenticated;
create policy transactions_select_own on public.transactions for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- pools, rescue_cases, block_rules, lucky_draws: public read, admin write only.
grant select on public.pools, public.rescue_cases, public.block_rules, public.lucky_draws to anon, authenticated;
grant insert, update, delete on public.pools, public.rescue_cases, public.block_rules, public.lucky_draws to authenticated;

create policy pools_public_read  on public.pools for select to anon, authenticated using (true);
create policy pools_admin_insert on public.pools for insert to authenticated with check ((select public.is_admin()));
create policy pools_admin_update on public.pools for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy pools_admin_delete on public.pools for delete to authenticated using ((select public.is_admin()));

create policy rescue_public_read  on public.rescue_cases for select to anon, authenticated using (true);
create policy rescue_admin_insert on public.rescue_cases for insert to authenticated with check ((select public.is_admin()));
create policy rescue_admin_update on public.rescue_cases for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy rescue_admin_delete on public.rescue_cases for delete to authenticated using ((select public.is_admin()));

create policy rules_public_read  on public.block_rules for select to anon, authenticated using (true);
create policy rules_admin_insert on public.block_rules for insert to authenticated with check ((select public.is_admin()));
create policy rules_admin_update on public.block_rules for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy rules_admin_delete on public.block_rules for delete to authenticated using ((select public.is_admin()));

create policy draws_public_read  on public.lucky_draws for select to anon, authenticated using (true);
create policy draws_admin_insert on public.lucky_draws for insert to authenticated with check ((select public.is_admin()));
create policy draws_admin_update on public.lucky_draws for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy draws_admin_delete on public.lucky_draws for delete to authenticated using ((select public.is_admin()));

-- audit_logs: admin read only. Inserts come from Edge Functions (service role).
grant select on public.audit_logs to authenticated;
create policy audit_admin_read on public.audit_logs for select to authenticated using ((select public.is_admin()));

-- mandates: user reads own.
grant select on public.mandates to authenticated;
create policy mandates_select_own on public.mandates for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- platform_counters: public read (landing page counters).
grant select on public.platform_counters to anon, authenticated;
create policy counters_public_read on public.platform_counters for select to anon, authenticated using (true);

-- otp_requests: no grants, no policies -> service role only.

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Create a profile row when a user signs up with phone OTP.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, mobile)
  values (new.id, case when new.phone is null or new.phone = '' then null
                       when left(new.phone, 1) = '+' then new.phone
                       else '+' || new.phone end)
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Audit log is append-only, even for the service role.
create or replace function public.audit_logs_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_logs is append-only';
end;
$$;
create trigger audit_logs_no_update before update or delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

-- Transactions: amount, user and type never change once written; only status/utr progress.
create or replace function public.transactions_guard()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'transactions cannot be deleted';
  end if;
  if new.user_id <> old.user_id or new.amount <> old.amount or new.type <> old.type or new.loan_id is distinct from old.loan_id then
    raise exception 'transactions are immutable except status and utr_no';
  end if;
  return new;
end;
$$;
create trigger transactions_guard before update or delete on public.transactions
  for each row execute function public.transactions_guard();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger loans_touch    before update on public.loans    for each row execute function public.touch_updated_at();
create trigger pools_touch    before update on public.pools    for each row execute function public.touch_updated_at();
create trigger mandates_touch before update on public.mandates for each row execute function public.touch_updated_at();

-- Derive every pool column from block_rules (same maths as calculations.ts).
create or replace function public.compute_pool()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.block_rules%rowtype;
  fill numeric;
begin
  select * into r from public.block_rules where loan_type = new.type;
  fill := new.total_users::numeric / r.block_size;
  new.borrower_pool    := round(r.borrower_pool * fill);
  new.csr_pool         := round(r.csr_pool * fill);
  new.rescue_pool      := round(new.csr_pool * r.rescue_share_of_csr);
  new.regular_pool     := new.csr_pool - new.rescue_pool + new.borrower_pool;
  new.rescue_capacity  := floor(new.rescue_pool::numeric / r.avg_rescue_ticket);
  new.regular_per_user := case when new.total_users = 0 then 0 else floor(new.regular_pool::numeric / new.total_users) end;
  return new;
end;
$$;
create trigger pools_compute before insert or update of total_users, type on public.pools
  for each row execute function public.compute_pool();

-- Seat a loan in the first open block of its type when it becomes verified.
create or replace function public.assign_block_on_verify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pool public.pools%rowtype;
  v_next int;
begin
  if new.verification_status = 'verified' and old.verification_status is distinct from 'verified' and new.block_number is null then
    -- Serialise seat allocation per loan type; cheap because only verifications take it.
    perform pg_advisory_xact_lock(hashtext('karjmukt_pool_' || new.loan_type::text));

    select * into v_pool from public.pools
      where type = new.loan_type and total_users < 1000
      order by block_number
      limit 1
      for update;

    if not found then
      select coalesce(max(block_number), 0) + 1 into v_next from public.pools where type = new.loan_type;
      insert into public.pools (block_number, type, total_users) values (v_next, new.loan_type, 0)
        returning * into v_pool;
    end if;

    update public.pools set total_users = total_users + 1 where id = v_pool.id;
    new.block_number := v_pool.block_number;
    new.seat_number  := v_pool.total_users + 1;
    new.verified_at  := coalesce(new.verified_at, now());
  end if;
  return new;
end;
$$;
create trigger loans_assign_block before update of verification_status on public.loans
  for each row execute function public.assign_block_on_verify();

-- Keep landing-page counters O(1) instead of COUNT(*) over millions of rows.
create or replace function public.bump_rescue_counter()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_saved and (tg_op = 'INSERT' or not old.is_saved) then
    update public.platform_counters set value = value + 1 where key = 'rescued_' || new.loan_type::text;
    update public.platform_counters set value = value + new.rescue_amount where key = 'paid_out_total';
  end if;
  return new;
end;
$$;
create trigger rescue_counter after insert or update of is_saved on public.rescue_cases
  for each row execute function public.bump_rescue_counter();

create or replace function public.bump_paid_counter()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.type = 'regular_credit' and new.status = 'success' and (tg_op = 'INSERT' or old.status <> 'success') then
    update public.platform_counters set value = value + new.amount where key = 'paid_out_total';
  end if;
  return new;
end;
$$;
create trigger transactions_paid_counter after insert or update of status on public.transactions
  for each row execute function public.bump_paid_counter();

-- ---------------------------------------------------------------------------
-- Realtime: Broadcast (not postgres_changes) so 10k+ clients share one fan-out.
-- Only pools and the rescue wall are realtime.
-- ---------------------------------------------------------------------------
create or replace function public.broadcast_pool_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object('type', new.type, 'block_number', new.block_number, 'total_users', new.total_users),
    'pool_update', 'pools', false);
  return null;
end;
$$;
create trigger pools_broadcast after insert or update on public.pools
  for each row execute function public.broadcast_pool_change();

create or replace function public.broadcast_rescue()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_saved then
    perform realtime.send(
      jsonb_build_object('id', new.id, 'loan_type', new.loan_type, 'display_name', new.display_name,
                         'rescue_amount', new.rescue_amount, 'saved_at', new.saved_at),
      'rescue_saved', 'rescue_wall', false);
  end if;
  return null;
end;
$$;
create trigger rescue_broadcast after insert or update of is_saved on public.rescue_cases
  for each row execute function public.broadcast_rescue();

-- ---------------------------------------------------------------------------
-- Read RPCs (aggregates computed in the DB, never on the client)
-- ---------------------------------------------------------------------------

-- Live user count per loan type from the pools table (<= 2,500 rows at 25L users).
create or replace function public.platform_stats()
returns table (loan_type public.loan_type, users bigint, blocks bigint, rescued bigint, paid_out_total bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select t.lt,
         coalesce((select sum(p.total_users) from public.pools p where p.type = t.lt), 0)::bigint,
         coalesce((select count(*) from public.pools p where p.type = t.lt), 0)::bigint,
         coalesce((select c.value from public.platform_counters c where c.key = 'rescued_' || t.lt::text), 0),
         coalesce((select c.value from public.platform_counters c where c.key = 'paid_out_total'), 0)
  from unnest(enum_range(null::public.loan_type)) as t(lt);
$$;
grant execute on function public.platform_stats() to anon, authenticated;

-- Seats in a block for the 1000-avatar grid. Exposes initials only, never names or ids.
-- A member can see their own block; admins can see any block.
create or replace function public.block_seats(p_type public.loan_type, p_block int)
returns table (seat_number int, initials text, is_me boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) and not exists (
    select 1 from public.loans l
    where l.user_id = (select auth.uid()) and l.loan_type = p_type and l.block_number = p_block
  ) then
    raise exception 'not a member of this block' using errcode = '42501';
  end if;

  return query
    select l.seat_number,
           upper(left(coalesce(nullif(split_part(p.full_name, ' ', 1), ''), '?'), 1)
                 || left(coalesce(split_part(p.full_name, ' ', 2), ''), 1)),
           l.user_id = (select auth.uid())
    from public.loans l
    join public.profiles p on p.id = l.user_id
    where l.loan_type = p_type and l.block_number = p_block and l.verification_status = 'verified'
    order by l.seat_number;
end;
$$;
revoke all on function public.block_seats(public.loan_type, int) from public, anon;
grant execute on function public.block_seats(public.loan_type, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private buckets only. Docs are served through 60s signed URLs.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('kyc', 'kyc', false, 1048576, array['application/octet-stream']),
  ('loan-docs', 'loan-docs', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- kyc: encrypted Aadhaar blobs. No client policies at all -> service role only.

-- loan-docs: user uploads into and reads from their own folder; admin reads all.
create policy loan_docs_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'loan-docs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy loan_docs_select_own on storage.objects for select to authenticated
  using (bucket_id = 'loan-docs' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

-- Changing a rule recomputes every block of that type (pools are small: <= 2,500 rows at 25L users).
create or replace function public.recompute_pools_on_rule_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.pools set total_users = total_users where type = new.loan_type;
  return null;
end;
$$;
create trigger block_rules_recompute after update on public.block_rules
  for each row execute function public.recompute_pools_on_rule_change();

-- Audit every direct admin write made through the API (pools, rescue cases, rules, draws).
-- Edge Functions audit their own actions; this catches writes made with an admin JWT.
create or replace function public.audit_admin_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  v_ip text := split_part(coalesce(v_headers ->> 'x-forwarded-for', v_headers ->> 'x-real-ip', ''), ',', 1);
  v_row jsonb := to_jsonb(coalesce(new, old));
begin
  if (select auth.uid()) is not null then
    insert into public.audit_logs (user_id, action, ip, metadata)
    values (
      (select auth.uid()),
      'admin.' || tg_table_name || '.' || lower(tg_op),
      case when v_ip ~ '^[0-9a-fA-F:.]{3,45}$' then v_ip::inet end,
      jsonb_build_object('id', v_row ->> 'id', 'row', v_row - 'story')
    );
  end if;
  return coalesce(new, old);
end;
$$;
create trigger rescue_cases_audit after insert or update or delete on public.rescue_cases for each row execute function public.audit_admin_write();
create trigger block_rules_audit  after insert or update or delete on public.block_rules  for each row execute function public.audit_admin_write();
create trigger lucky_draws_audit  after insert or update or delete on public.lucky_draws  for each row execute function public.audit_admin_write();
