-- Create the tables for the Umpire Portal (Cricket Scoring)

-- 1. Matches Table
CREATE TABLE IF NOT EXISTS public.cricket_matches (
    id BIGINT PRIMARY KEY,
    event_id BIGINT,
    team1_name TEXT NOT NULL,
    team2_name TEXT NOT NULL,
    toss_winner TEXT,
    toss_decision TEXT,
    max_overs INT NOT NULL DEFAULT 20,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'live', 'completed'
    current_inning INT DEFAULT 1,
    umpire_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Innings Table
CREATE TABLE IF NOT EXISTS public.cricket_innings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id BIGINT REFERENCES public.cricket_matches(id) ON DELETE CASCADE,
    inning_number INT NOT NULL,
    batting_team TEXT NOT NULL,
    bowling_team TEXT NOT NULL,
    total_runs INT DEFAULT 0,
    total_wickets INT DEFAULT 0,
    overs_bowled NUMERIC(5, 1) DEFAULT 0.0,
    extras INT DEFAULT 0,
    status TEXT DEFAULT 'live', -- 'live', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Balls Table
CREATE TABLE IF NOT EXISTS public.cricket_balls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inning_id UUID REFERENCES public.cricket_innings(id) ON DELETE CASCADE,
    over_number INT NOT NULL,
    ball_number INT NOT NULL,
    runs INT DEFAULT 0,
    is_boundary BOOLEAN DEFAULT FALSE,
    is_six BOOLEAN DEFAULT FALSE,
    is_wicket BOOLEAN DEFAULT FALSE,
    wicket_type TEXT,
    is_wide BOOLEAN DEFAULT FALSE,
    is_no_ball BOOLEAN DEFAULT FALSE,
    is_leg_bye BOOLEAN DEFAULT FALSE,
    is_bye BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Turn on Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.cricket_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cricket_innings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cricket_balls;
