-- RLS + business-rule tests. Run: scripts/test-db.sh
\set ON_ERROR_STOP on
\set QUIET on

create or replace function pg_temp.as_user(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
  if uid is null then execute 'set local role anon'; else execute 'set local role authenticated'; end if;
end $$;

create or replace function pg_temp.expect(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not cond then raise exception 'FAIL: %', msg; end if;
  raise notice 'ok - %', msg;
end $$;

-- Fixtures (as superuser = service role equivalent)
insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a', '919800000001'),
  ('00000000-0000-0000-0000-00000000000b', '+919800000002'),
  ('00000000-0000-0000-0000-0000000000ad', '+919800000009');
update public.profiles set full_name = 'Asha Patil' where id = '00000000-0000-0000-0000-00000000000a';
update public.profiles set full_name = 'Bhavesh Rao' where id = '00000000-0000-0000-0000-00000000000b';
update public.profiles set user_type = 'admin', full_name = 'Admin User' where id = '00000000-0000-0000-0000-0000000000ad';

select pg_temp.expect((select mobile from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = '+919800000001', 'signup trigger normalises mobile to +91');

insert into public.loans (id, user_id, loan_type, bank_name, loan_account_encrypted, loan_account_last4, ifsc, sanction_amount, outstanding, emi, interest_rate)
values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'education', 'SBI', 'enc', '1234', 'SBIN0001234', 1000000, 900000, 12668, 9),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', 'education', 'HDFC', 'enc', '5678', 'HDFC0001234', 1000000, 900000, 12668, 9);
insert into public.transactions (user_id, loan_id, type, amount, utr_no, status)
values ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'regular_credit', 3200, 'UTR12345678', 'success');

-- Block assignment on verification
update public.loans set verification_status = 'verified' where id in ('10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b');
select pg_temp.expect((select count(*) from public.pools) = 1, 'first verification creates block 1');
select pg_temp.expect((select total_users from public.pools where type = 'education' and block_number = 1) = 2, 'block 1 has 2 users');
select pg_temp.expect((select array_agg(seat_number order by seat_number) from public.loans) = array[1, 2], 'seats 1 and 2 assigned');
select pg_temp.expect((select regular_per_user from public.pools limit 1) = 3200, 'pool regular_per_user = 3200 (matches calculations.ts)');
update public.pools set total_users = 1000 where block_number = 1;
select pg_temp.expect((select (rescue_pool, regular_pool, rescue_capacity) = (6800000::bigint, 3200000::bigint, 22) from public.pools where block_number = 1), 'full education block: 68L rescue, 32L regular, 22 rescues');
update public.block_rules set csr_pool = 9500000 where loan_type = 'education';
select pg_temp.expect((select rescue_pool from public.pools where block_number = 1) = 7600000, 'rule change recomputes pools');
update public.block_rules set csr_pool = 8500000 where loan_type = 'education';
select pg_temp.expect((select count(*) from realtime.messages_log where topic = 'pools') > 0, 'pool change is broadcast');

-- Full block -> next verification opens block 2
insert into auth.users values ('00000000-0000-0000-0000-00000000000c', '+919800000003');
insert into public.loans (id, user_id, loan_type, bank_name, loan_account_encrypted, loan_account_last4, ifsc, sanction_amount, outstanding, emi, interest_rate)
values ('10000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000c', 'education', 'SBI', 'enc', '0000', 'SBIN0001234', 500000, 400000, 6000, 9);
update public.loans set verification_status = 'verified' where id = '10000000-0000-0000-0000-00000000000c';
select pg_temp.expect((select (block_number, seat_number) = (2, 1) from public.loans where id = '10000000-0000-0000-0000-00000000000c'), 'full block rolls to block 2 seat 1');

begin;
-- ---------- profiles ----------
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.expect((select count(*) from public.profiles) = 1, 'user sees only own profile');
update public.profiles set full_name = 'Asha P' where id = '00000000-0000-0000-0000-00000000000b';
select pg_temp.expect((select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Asha Patil', 'cannot update someone else (0 rows)');
update public.profiles set full_name = 'Asha S Patil' where id = '00000000-0000-0000-0000-00000000000a';
select pg_temp.expect((select full_name from public.profiles) = 'Asha S Patil', 'can update own full_name');
rollback;

begin;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
do $$ begin
  update public.profiles set user_type = 'admin' where id = '00000000-0000-0000-0000-00000000000a';
  raise exception 'FAIL: privilege escalation via user_type';
exception when insufficient_privilege then raise notice 'ok - cannot set own user_type to admin';
end $$;
rollback;

begin;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
-- ---------- loans ----------
select pg_temp.expect((select count(*) from public.loans) = 1, 'user reads only own loan');
do $$ begin
  insert into public.loans (user_id, loan_type, bank_name, loan_account_encrypted, loan_account_last4, ifsc, sanction_amount, outstanding, emi, interest_rate)
  values ('00000000-0000-0000-0000-00000000000a', 'home', 'SBI', 'plain', '1234', 'SBIN0001234', 1000000, 1, 1, 1);
  raise exception 'FAIL: direct loan insert allowed';
exception when insufficient_privilege then raise notice 'ok - clients cannot insert loans directly';
end $$;
-- ---------- transactions ----------
select pg_temp.expect((select count(*) from public.transactions) = 1, 'user reads own transactions');
do $$ begin
  update public.transactions set amount = 999999;
  raise exception 'FAIL: transaction update allowed';
exception when insufficient_privilege then raise notice 'ok - transactions cannot be updated by user';
end $$;
do $$ begin
  delete from public.transactions;
  raise exception 'FAIL: transaction delete allowed';
exception when insufficient_privilege then raise notice 'ok - transactions cannot be deleted by user';
end $$;
-- ---------- pools / rescue ----------
do $$ begin
  insert into public.pools (block_number, type) values (99, 'home');
  raise exception 'FAIL: non-admin pool write';
exception when insufficient_privilege then raise notice 'ok - non-admin cannot write pools';
end $$;
select pg_temp.expect((select count(*) from public.audit_logs) = 0, 'non-admin cannot read audit logs');
-- ---------- block seats ----------
select pg_temp.expect((select count(*) from public.block_seats('education', 1)) = 2, 'member sees own block seats');
select pg_temp.expect((select initials from public.block_seats('education', 1) where is_me) = 'AP', 'seat shows initials only');
do $$ begin
  perform public.block_seats('education', 2);
  raise exception 'FAIL: non-member saw block 2';
exception when insufficient_privilege then raise notice 'ok - cannot view another block';
end $$;
rollback;

begin;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.expect((select count(*) from public.transactions) = 0, 'user B cannot see user A transactions');
select pg_temp.expect((select count(*) from public.loans where user_id = '00000000-0000-0000-0000-00000000000a') = 0, 'user B cannot see user A loan');
rollback;

begin;
select pg_temp.as_user(null);
select pg_temp.expect((select count(*) from public.pools) = 2, 'anon can read pools');
select pg_temp.expect((select count(*) from public.platform_stats()) = 2, 'anon can call platform_stats');
select pg_temp.expect((select count(*) from public.rescue_daily('home', 30)) = 30, 'anon can read 30 days of rescue counts');
select pg_temp.expect((select count(*) from public.rescue_daily('home', 99999)) = 366, 'rescue_daily caps the range at 366 days');
do $$ begin
  perform count(*) from public.profiles;
  raise exception 'FAIL: anon read profiles';
exception when insufficient_privilege then raise notice 'ok - anon cannot read profiles';
end $$;
do $$ begin
  perform count(*) from public.loans;
  raise exception 'FAIL: anon read loans';
exception when insufficient_privilege then raise notice 'ok - anon cannot read loans';
end $$;
rollback;

begin;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000ad');
select pg_temp.expect((select count(*) from public.loans) = 3, 'admin reads all loans');
insert into public.rescue_cases (loan_id, loan_type, display_name, rescue_amount, is_saved, saved_at)
values ('10000000-0000-0000-0000-00000000000b', 'education', 'Bhavesh R., Nagpur', 300000, true, now());
select pg_temp.expect((select value from public.platform_counters where key = 'rescued_education') = 1, 'rescue increments counter');
select pg_temp.expect((select count(*) from realtime.messages_log where topic = 'rescue_wall') = 1, 'rescue is broadcast to rescue_wall');
select pg_temp.expect((select count(*) from public.audit_logs where action = 'admin.rescue_cases.insert') = 1, 'admin API write is audited');
rollback;

-- ---------- audit log is append-only even for service role ----------
insert into public.audit_logs (user_id, action, ip) values ('00000000-0000-0000-0000-0000000000ad', 'test', '1.2.3.4');
do $$ begin
  update public.audit_logs set action = 'tampered';
  raise exception 'FAIL: audit log update allowed';
exception when raise_exception then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'ok - audit log is append-only';
end $$;
do $$ begin
  update public.transactions set amount = 1;
  raise exception 'FAIL: transaction amount changed';
exception when raise_exception then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'ok - transaction amount immutable for service role';
end $$;

-- every public table has RLS enabled
select pg_temp.expect(not exists (
  select 1 from pg_tables where schemaname = 'public' and not rowsecurity
), 'RLS enabled on ALL public tables');

\echo 'ALL DATABASE TESTS PASSED'
