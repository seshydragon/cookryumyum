insert into storage.buckets (id, name, public)
values ('challenge-photos', 'challenge-photos', false)
on conflict (id) do nothing;

-- Challenge photos are accessed through the server endpoint, which uses the
-- Supabase service role. No public read policy is created.
