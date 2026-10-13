-- Daily rescue counts for the mobile Rescue Analytics chart.
-- Aggregates server-side so clients never download individual rescue rows for a chart.
create index if not exists rescue_cases_daily_idx on public.rescue_cases (loan_type, saved_at) where is_saved;

create or replace function public.rescue_daily(p_type public.loan_type, p_days int default 30)
returns table (day date, saved bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select d::date, count(r.id)
  from generate_series(current_date - (least(greatest(p_days, 1), 366) - 1), current_date, interval '1 day') as d
  left join public.rescue_cases r
    on r.is_saved and r.loan_type = p_type and r.saved_at >= d and r.saved_at < d + interval '1 day'
  group by d
  order by d;
$$;
grant execute on function public.rescue_daily(public.loan_type, int) to anon, authenticated;
