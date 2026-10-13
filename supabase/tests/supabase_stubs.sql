-- Minimal stand-ins for the Supabase-managed schemas so the migration and RLS
-- tests can run against a plain Postgres 15/16 in CI. Not deployed.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create schema storage;
create schema realtime;
create schema extensions;
grant usage on schema public, auth, storage, realtime, extensions to anon, authenticated, service_role;
create table auth.users (id uuid primary key, phone text);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
grant execute on function auth.uid(), auth.jwt() to anon, authenticated;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as
  $$ select string_to_array(name, '/') $$;
create table realtime.messages_log (topic text, event text, payload jsonb);
grant insert, select on realtime.messages_log to anon, authenticated, service_role;
create function realtime.send(payload jsonb, event text, topic text, private boolean) returns void
  language sql security definer as $$ insert into realtime.messages_log values (topic, event, payload) $$;
