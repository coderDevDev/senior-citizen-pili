-- Run this in Supabase SQL Editor to check if activity_logs table exists

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'activity_logs'
);

-- 2. Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activity_logs';

-- 3. Try to select from activity_logs (will fail if table doesn't exist)
SELECT * FROM activity_logs LIMIT 5;

-- 4. Check if there are any rows
SELECT COUNT(*) as total_logs FROM activity_logs;

-- 5. Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'activity_logs';
