-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (handled by Supabase Auth usually, but we are doing custom auth)
-- Actually, the requirements say "Custom authentication system (NO Supabase Auth)".
-- So we need a users table.
create table users (
  id uuid primary key default uuid_generate_v4(),
  role text default 'user',
  email text unique not null,
  password_hash text not null,
  first_name text,
  last_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Channels table
create table channels (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  name text not null,
  description text,
  voiceText text,
  channel_picture_url text,
  channel_banner_url text,
  configurations text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Topics table
create table topics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  channel_id uuid references channels(id) on delete cascade not null,
  name text not null,
  description text,
  background_music_prompt text default null,
  background_music_duration integer default null,
  background_music_url text default null,
  image_generation_theme text default null,
  story_thumbnail_prompt text default null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Stories table
create table public.stories (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  channel_id uuid not null,
  topic_id uuid not null,
  title text not null,
  content text null,
  script_generated boolean null default false,
  generated_script text null,
  social_media_target text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  audio_generated boolean null default false,
  completion_status boolean null default false,
  completd_video_url text null,
  thumbnail_url text null,
  upload_path text null,
  constraint stories_pkey primary key (id),
  constraint stories_channel_id_fkey foreign KEY (channel_id) references channels (id) on delete CASCADE,
  constraint stories_topic_id_fkey foreign KEY (topic_id) references topics (id) on delete CASCADE,
  constraint stories_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;










-- Story Images table
create table story_images (
  id uuid primary key default uuid_generate_v4(),
  story_id uuid references stories(id) on delete cascade not null,
  image_url text not null,
  is_ai_generated boolean default false,
  scene_number integer default 0,
  image_number integer default null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

ALTER TABLE story_images
ADD CONSTRAINT story_images_unique_key
UNIQUE (story_id, scene_number, image_number);



-- Story Audio table
create table story_audio (
  id uuid primary key default uuid_generate_v4(),
  story_id uuid references stories(id) on delete cascade not null,
  audio_url text not null,                  -- URL or path to the audio file
  is_ai_generated boolean default false,    -- whether this audio was AI-generated
  audio_format text default 'mp3',         -- optional: mp3, wav, etc.
  duration_seconds integer,
  scene_number integer,               -- optional: length of audio in seconds
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Story Frames table
create table story_video_frames (
  id uuid primary key default uuid_generate_v4(),
  story_id uuid references stories(id) on delete cascade not null,
  frame_video_url text not null,                 -- URL or path to the frame image
  frame_upload_path text not null,
  scene_number integer,                   -- which scene this frame belongs to

  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Voice Clone
create table voice_clones (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  voice_id text unique not null,
  audio_url text default null,
  storage_path text default null,
  clone_status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Story Background Music table
create table topic_background_music (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
   topic_id uuid references topics(id) on delete cascade not null,
  music_url text not null,                  -- URL or path to the music file
  music_format text default 'mp3',         -- mp3, wav, etc.        -- optional: length of music in seconds
  volume_level numeric default 0.5,        -- 0.0 to 1.0, default 50%
  
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);






--image-apis
create table public.image_apis (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  source text null,
  value text null,
  constraint image - apis_pkey primary key (id)
) TABLESPACE pg_default;


-- RLS Policies (Row Level Security)
alter table users enable row level security;
alter table channels enable row level security;
alter table topics enable row level security;
alter table stories enable row level security;
alter table story_images enable row level security;
alter table story_audio enable row level security;
alter table topic_background_music enable row level security;
-- Since we are using custom auth, we might not be able to use `auth.uid()` easily 
-- unless we mint our own JWTs that Supabase understands or use a service key for everything on the server.
-- The requirements say "Use Supabase JavaScript client for database operations".
-- If we use Service Role Key on the server, RLS is bypassed. 
-- If we want RLS to work, we need to sign a JWT with the Supabase JWT secret and pass it to the client.
-- However, for simplicity given the "Custom Auth" requirement, we will likely use the Service Role Key 
-- in our Next.js API routes/Server Actions to access data, effectively doing checks in code.
-- BUT, strictly speaking, RLS is better. 
-- Let's define policies that assume a postgres role or just leave them open to the service_role key only.

-- Policy: Service Role has full access (default)
-- Policy: Public/Anon has NO access (default if RLS is on and no policy)

