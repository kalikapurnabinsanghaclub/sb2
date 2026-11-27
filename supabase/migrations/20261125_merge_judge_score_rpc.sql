-- ============================================================
-- Migration: merge_judge_score RPC
-- Purpose  : Atomic per-judge score/comment update.
--            When 5 judges save simultaneously for the same
--            participant, each judge only writes to their own
--            judgeId key inside round_scores / round_comments.
--            No judge can overwrite another judge's data.
-- Author   : Antigravity (sb-sup-skill parallel-save fix)
-- Date     : 2026-11-25
-- ============================================================

-- Step 1: Enable RLS on public_registrations (if not already)
-- ALTER TABLE public_registrations ENABLE ROW LEVEL SECURITY;

-- Step 2: Create the atomic merge function
CREATE OR REPLACE FUNCTION merge_judge_score(
  p_id        TEXT,       -- participant row id (matches public_registrations.id)
  p_round     TEXT,       -- e.g. 'audition', 'semi_final', 'final'
  p_judge_id  TEXT,       -- judge's unique id string
  p_scores    JSONB,      -- { rhythm: 9, expression: 8, footwork: 7 }
  p_comment   TEXT        -- judge's written comment
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER   -- runs as function owner, not calling user
AS $$
BEGIN
  -- Step 2a: Enforce Server-Side Score Lock Check
  -- If monitor operator has toggled 'lockScore' in switchStates or scores_locked is true, abort!
  IF EXISTS (
    SELECT 1 FROM sync_state 
    WHERE (
      (COALESCE(data->'switchStates'->>'lockScore', 'false'))::boolean = true OR
      (COALESCE(data->>'scores_locked', 'false'))::boolean = true
    )
  ) THEN
    RAISE EXCEPTION 'Scores are currently LOCKED by the Monitor control desk.';
  END IF;

  UPDATE public_registrations
  SET
    -- Merge only this judge's scores into round_scores->p_round->p_judge_id
    -- COALESCE ensures we start with '{}' if the column is NULL
    round_scores = jsonb_set(
      jsonb_set(
        COALESCE(round_scores, '{}'::jsonb),
        ARRAY[p_round],
        COALESCE(round_scores->p_round, '{}'::jsonb)   -- keep existing round data
      ),
      ARRAY[p_round, p_judge_id],
      p_scores                                          -- set only this judge's key
    ),

    -- Merge only this judge's comment into round_comments->p_round->p_judge_id
    round_comments = jsonb_set(
      jsonb_set(
        COALESCE(round_comments, '{}'::jsonb),
        ARRAY[p_round],
        COALESCE(round_comments->p_round, '{}'::jsonb)
      ),
      ARRAY[p_round, p_judge_id],
      to_jsonb(p_comment)
    ),

    -- Also keep the flat scores column in sync (backward compat with legacy reads)
    scores = jsonb_set(
      COALESCE(scores, '{}'::jsonb),
      ARRAY[p_judge_id],
      p_scores
    )

  WHERE id = p_id;
END;
$$;

-- Step 3: Grant execute to the authenticated and anon roles used by Supabase JS client
GRANT EXECUTE ON FUNCTION merge_judge_score(TEXT, TEXT, TEXT, JSONB, TEXT)
  TO authenticated, anon, service_role;

-- ============================================================
-- HOW IT WORKS (5-judge parallel save example):
--
-- Before (all 5 judges save within 2 seconds for KNSDC-101):
--   round_scores = { "audition": { "judge_1": {...} } }
--
-- Judge-2 calls: merge_judge_score('KNSDC-101','audition','judge_2',{...},'Great!')
--   round_scores = { "audition": { "judge_1": {...}, "judge_2": {...} } }
--
-- Judge-3 calls at the SAME TIME:
--   round_scores = { "audition": { "judge_1": {...}, "judge_2": {...}, "judge_3": {...} } }
--
-- Judge-4 and Judge-5 also call simultaneously — all 5 entries survive. ✅
-- No race condition. No data loss. Each judge only touches their own key.
-- ============================================================

-- ============================================================
-- MONITOR PERMISSION SCOPES (reference — enforced in JS):
--
--   switchStates['edit-score']     = true/false   (edit permission on/off)
--   switchStates['editScoreMode']  = 'current'    (only current round)
--                                  | 'all'        (all rounds)
--
-- Judge portal enforces:
--   - 'current': judge can only edit scores for p.round (active round)
--   - 'all'    : judge can edit scores for any round they originally scored
--   In both cases: judge can ONLY edit their OWN judgeId key (cross-judge
--   protection is enforced by the fairness guard in saveModalScores).
-- ============================================================
