-- RANDOM CHAT SCHEMA REPAIR (v2)
-- Run this in your Supabase SQL Editor

-- 1. Ensure the Queue table has all required columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='random_chat_queue') THEN
    -- Add created_at if missing (needed for FIFO matching)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='random_chat_queue' AND COLUMN_NAME='created_at') THEN
      ALTER TABLE random_chat_queue ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add target_gender if missing
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='random_chat_queue' AND COLUMN_NAME='target_gender') THEN
      ALTER TABLE random_chat_queue ADD COLUMN target_gender TEXT DEFAULT 'all';
    END IF;
  ELSE
    -- Recreate table if it doesn't exist at all
    CREATE TABLE random_chat_queue (
      user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
      is_anonymous BOOLEAN DEFAULT TRUE,
      target_gender TEXT DEFAULT 'all',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- 2. UPDATED MASTER FUNCTION: find_random_match
DROP FUNCTION IF EXISTS find_random_match(BOOLEAN, TEXT);

CREATE OR REPLACE FUNCTION find_random_match(p_anonymous BOOLEAN, p_target_gender TEXT DEFAULT 'all')
RETURNS TABLE (
  matched BOOLEAN,
  session_id UUID,
  partner_username TEXT,
  partner_avatar_url TEXT,
  partner_anonymous BOOLEAN,
  partner_is_verified BOOLEAN,
  fallback_username TEXT,
  fallback_avatar_url TEXT,
  fallback_bio TEXT,
  fallback_gender TEXT,
  fallback_age INTEGER,
  fallback_is_verified BOOLEAN
) AS $$
DECLARE
  v_my_gender TEXT;
  v_match RECORD;
  v_new_session_id UUID;
BEGIN
  -- Get current user's gender
  SELECT gender INTO v_my_gender FROM profiles WHERE id = auth.uid();

  -- 1. Try to find an existing waiter who matches my preference AND I match theirs
  -- We sort by created_at to get the person who has been waiting longest
  SELECT q.*, p.username, p.avatar_url, p.is_verified, p.gender
  INTO v_match
  FROM random_chat_queue q
  JOIN profiles p ON q.user_id = p.id
  WHERE q.user_id != auth.uid()
    -- I match their preference (e.g. they want 'female' and I am 'female')
    AND (q.target_gender = 'all' OR q.target_gender = COALESCE(v_my_gender, 'other'))
    -- They match my preference (e.g. I want 'male' and they are 'male')
    AND (p_target_gender = 'all' OR p_target_gender = p.gender)
  ORDER BY q.created_at ASC
  LIMIT 1;

  IF v_match.user_id IS NOT NULL THEN
    -- Match found! Create a session
    v_new_session_id := gen_random_uuid();

    INSERT INTO random_chat_sessions (id, user1_id, user2_id, user1_anon, user2_anon)
    VALUES (v_new_session_id, v_match.user_id, auth.uid(), v_match.is_anonymous, p_anonymous);

    -- Remove partner from queue
    DELETE FROM random_chat_queue WHERE user_id = v_match.user_id;

    RETURN QUERY SELECT
      TRUE,
      v_new_session_id,
      v_match.username,
      v_match.avatar_url,
      v_match.is_anonymous,
      v_match.is_verified,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::INTEGER, FALSE;
  ELSE
    -- No match found. Join the queue with preference
    DELETE FROM random_chat_queue WHERE user_id = auth.uid(); -- Clean old entries
    INSERT INTO random_chat_queue (user_id, is_anonymous, target_gender)
    VALUES (auth.uid(), p_anonymous, p_target_gender);

    -- Return a fallback profile for them to look at while waiting
    RETURN QUERY SELECT
      FALSE,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      FALSE,
      FALSE,
      p.username, p.avatar_url, p.bio, p.gender, p.age, p.is_verified
    FROM profiles p
    WHERE p.id != auth.uid()
      AND (p_target_gender = 'all' OR p.gender = p_target_gender)
    ORDER BY RANDOM() LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
