export type User = {
  id: string;
  nickname: string | null;
  profile_image: string | null;
  is_profile_complete: boolean;
};

export type Group = {
  id: string;
  name: string;
  max_members: number;
  mission_mode: "auto" | "manual";
  owner_id: string;
  invite_code: string;
  created_at: string;
};

export type GroupWithStatus = Group & {
  member_count: number;
  today_mission: {
    keyword: string;
    emoji: string | null;
  } | null;
  today_progress: {
    completed: number;
    total: number;
  };
  is_today_completed: boolean;
};

export type Mission = {
  id: string;
  group_id: string;
  keyword: string;
  emoji: string | null;
  description: string | null;
  mission_date: string;
  started_at: string;
  deadline: string;
  is_completed: boolean;
  collage_url: string | null;
};

export type MissionWithSubmissions = Mission & {
  submissions: SubmissionStatus[];
};

export type SubmissionStatus = {
  user_id: string;
  nickname: string;
  profile_image: string | null;
  submitted_at: string | null;
  photo_url: string | null;
  thumbnail_url: string | null;
};

export type MissionPoolItem = {
  id: string;
  keyword: string;
  emoji: string;
  category: "color" | "object" | "food";
  description: string;
};
