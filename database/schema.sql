

CREATE TABLE IF NOT EXISTS profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  bio text,
  city text,
  avatar_url text,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS user_hobbies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  hobby_name text,
  category text,
  icon text,
  created_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade unique,
  beginner_only boolean default false,
  free_only boolean default false,
  notifications boolean default true,
  radius_miles integer default 10,
  updated_at timestamp default now()
);

CREATE TABLE IF NOT EXISTS saved_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  event_id text,
  event_source text,
  event_title text,
  event_date text,
  event_url text,
  created_at timestamp default now(),
  constraint saved_events_user_event_unique unique (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS event_ratings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  event_id text,
  event_title text,
  event_source text,
  category text,
  rating integer check (rating >= 1 and rating <= 5),
  note text,
  created_at timestamp default now(),
  constraint event_ratings_user_event_unique unique (user_id, event_id)
);


-- ADD COLUMNS IF MISSING


ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text;


-- ROW LEVEL SECURITY


ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_ratings ENABLE ROW LEVEL SECURITY;


-- DROP EXISTING POLICIES


DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own hobbies" ON user_hobbies;
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own saved events" ON saved_events;
DROP POLICY IF EXISTS "Users can view their own saved events" ON saved_events;
DROP POLICY IF EXISTS "Users can delete their own saved events" ON saved_events;
DROP POLICY IF EXISTS "Users can update their own saved events" ON saved_events;
DROP POLICY IF EXISTS "Users can manage their own ratings" ON event_ratings;

-- POLICIES — profiles


CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- POLICIES — user_hobbies


CREATE POLICY "Users can manage their own hobbies"
ON user_hobbies FOR ALL
USING (auth.uid() = user_id);

-- POLICIES — user_preferences


CREATE POLICY "Users can manage their own preferences"
ON user_preferences FOR ALL
USING (auth.uid() = user_id);


-- POLICIES — saved_events


CREATE POLICY "Users can insert their own saved events"
ON saved_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own saved events"
ON saved_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved events"
ON saved_events FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved events"
ON saved_events FOR UPDATE
USING (auth.uid() = user_id);


-- POLICIES — event_ratings


CREATE POLICY "Users can manage their own ratings"
ON event_ratings FOR ALL
USING (auth.uid() = user_id);


-- STORAGE BUCKET FOR AVATARS


INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);



-- auto create profile when signup is triggered

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_preferences (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();