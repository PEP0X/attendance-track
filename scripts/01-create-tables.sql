-- Create members table for students
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  -- New: support multiple phone numbers
  phones TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure new column exists on existing databases and backfill from legacy phone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'phones'
  ) THEN
    ALTER TABLE members ADD COLUMN phones TEXT[];
  END IF;
END $$;

-- Backfill: if a single phone exists and phones is empty/null, move it into phones array
UPDATE members
SET phones = ARRAY[phone]
WHERE phone IS NOT NULL AND (phones IS NULL OR array_length(phones, 1) IS NULL);

-- Remove legacy single phone column now that data is migrated
ALTER TABLE members DROP COLUMN IF EXISTS phone;

-- Create attendance table for tracking attendance records
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, date)
);

-- Create users table for servant accounts (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'servant' CHECK (role IN ('servant', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_members_name ON members(name);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for members table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'members' AND policyname = 'Authenticated users can view members'
  ) THEN
    CREATE POLICY "Authenticated users can view members"
      ON members FOR SELECT
      TO authenticated
      USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'members' AND policyname = 'Authenticated users can insert members'
  ) THEN
    CREATE POLICY "Authenticated users can insert members"
      ON members FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'members' AND policyname = 'Authenticated users can update members'
  ) THEN
    CREATE POLICY "Authenticated users can update members"
      ON members FOR UPDATE
      TO authenticated
      USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'members' AND policyname = 'Authenticated users can delete members'
  ) THEN
    CREATE POLICY "Authenticated users can delete members"
      ON members FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- RLS Policies for attendance table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance' AND policyname = 'Authenticated users can view attendance'
  ) THEN
    CREATE POLICY "Authenticated users can view attendance"
      ON attendance FOR SELECT
      TO authenticated
      USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance' AND policyname = 'Authenticated users can insert attendance'
  ) THEN
    CREATE POLICY "Authenticated users can insert attendance"
      ON attendance FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance' AND policyname = 'Authenticated users can update attendance'
  ) THEN
    CREATE POLICY "Authenticated users can update attendance"
      ON attendance FOR UPDATE
      TO authenticated
      USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance' AND policyname = 'Authenticated users can delete attendance'
  ) THEN
    CREATE POLICY "Authenticated users can delete attendance"
      ON attendance FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- RLS Policies for users table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view all users'
  ) THEN
    CREATE POLICY "Users can view all users"
      ON users FOR SELECT
      TO authenticated
      USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON users FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON users FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;
