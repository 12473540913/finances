create table if not exists public.app_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  username text,
  display_name text,
  birth_date date,
  profile_photo_url text,
  updated_at timestamptz not null default now()
);

-- Copy legacy values once; all future profile writes belong to finances.
insert into public.app_profiles (user_id, username, birth_date, profile_photo_url)
select id, username, birth_date, profile_photo_url from public.users
on conflict (user_id) do nothing;
