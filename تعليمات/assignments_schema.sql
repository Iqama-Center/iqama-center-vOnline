-- Assignments Scheduling Feature Schema (PostgreSQL)
-- Timezone default Africa/Cairo at application level

CREATE TABLE IF NOT EXISTS teacher_schedules (
  teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  days TEXT NOT NULL CHECK (days ~ '^(sat|sun|mon|tue|wed|thu|fri)(,(sat|sun|mon|tue|wed|thu|fri))*$'),
  publish_time TEXT NOT NULL CHECK (publish_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  is_paused BOOLEAN NOT NULL DEFAULT false,
  holidays DATERANGE[] DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (teacher_id, course_id)
);

CREATE TABLE IF NOT EXISTS assignment_templates (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  attachments JSONB DEFAULT '[]',
  active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE assignment_status AS ENUM ('scheduled','posted','skipped-holiday');

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_status') THEN
    CREATE TYPE assignment_status AS ENUM ('scheduled','posted','skipped-holiday');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS assignment_occurrences (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES assignment_templates(id) ON DELETE CASCADE,
  publish_at TIMESTAMPTZ NOT NULL,
  status assignment_status NOT NULL DEFAULT 'scheduled',
  UNIQUE(template_id, publish_at)
);

-- Helper function to detect overlap with holidays
CREATE OR REPLACE FUNCTION overlaps_holidays(ranges DATERANGE[], ts TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
DECLARE
  r DATERANGE;
BEGIN
  FOREACH r IN ARRAY ranges LOOP
    IF ts::date <@ r THEN
      RETURN TRUE;
    END IF;
  END LOOP;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
