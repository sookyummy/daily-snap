-- Users table (public profile linked to Supabase Auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_id VARCHAR(255) UNIQUE,
  nickname VARCHAR(32),
  profile_image TEXT,
  is_profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(40) NOT NULL,
  max_members INT NOT NULL DEFAULT 4 CHECK (max_members >= 2 AND max_members <= 8),
  mission_mode VARCHAR(10) NOT NULL DEFAULT 'auto' CHECK (mission_mode IN ('auto', 'manual')),
  owner_id UUID NOT NULL REFERENCES public.users(id),
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  invite_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Members
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Missions
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  keyword VARCHAR(50) NOT NULL,
  emoji VARCHAR(10),
  description TEXT,
  mission_date DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  collage_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, mission_date)
);

-- Submissions
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mission_id, user_id)
);

-- Push Subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Indexes
CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_missions_group_date ON public.missions(group_id, mission_date DESC);
CREATE INDEX idx_submissions_mission ON public.submissions(mission_id);
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);
