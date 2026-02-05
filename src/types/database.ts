export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_id: string;
          google_id: string | null;
          nickname: string | null;
          profile_image: string | null;
          is_profile_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_id: string;
          google_id?: string | null;
          nickname?: string | null;
          profile_image?: string | null;
          is_profile_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_id?: string;
          google_id?: string | null;
          nickname?: string | null;
          profile_image?: string | null;
          is_profile_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          max_members: number;
          mission_mode: string;
          owner_id: string;
          invite_code: string;
          invite_expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          max_members?: number;
          mission_mode?: string;
          owner_id: string;
          invite_code: string;
          invite_expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          max_members?: number;
          mission_mode?: string;
          owner_id?: string;
          invite_code?: string;
          invite_expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      missions: {
        Row: {
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
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          keyword: string;
          emoji?: string | null;
          description?: string | null;
          mission_date: string;
          started_at: string;
          deadline: string;
          is_completed?: boolean;
          collage_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          keyword?: string;
          emoji?: string | null;
          description?: string | null;
          mission_date?: string;
          started_at?: string;
          deadline?: string;
          is_completed?: boolean;
          collage_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          mission_id: string;
          user_id: string;
          photo_url: string;
          thumbnail_url: string | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          user_id: string;
          photo_url: string;
          thumbnail_url?: string | null;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          user_id?: string;
          photo_url?: string;
          thumbnail_url?: string | null;
          submitted_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_group_member: {
        Args: { p_group_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
