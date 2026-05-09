import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with secret key (for API routes)
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

// Database types
export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  total_points: number;
  favorite_team: string | null;
  profile_complete: boolean;
  created_at: string;
};

export type Prediction = {
  id: string;
  user_id: string;
  match_id: string;
  home_goals: number;
  away_goals: number;
  points_earned: number | null;
  league_id: number | null;
  season_id: string | null;
  created_at: string;
};

export type Season = {
  id: string;
  name: string;                        // العربي
  name_en: string;                     // الإنجليزي
  start_date: string;
  end_date: string | null;             // null = موسم جارٍ
  is_active: boolean;
  winner_user_id: string | null;
  winner_username: string | null;
  winner_adjusted_points: number | null;
  created_at: string;
};
