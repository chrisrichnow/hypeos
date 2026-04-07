-- HypeOS Database Schema

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT,
  occupation      TEXT CHECK (occupation IN ('student', 'professional', 'entrepreneur', 'other')),
  school          TEXT,
  employer        TEXT,
  theme_preset    TEXT DEFAULT 'default-professional',
  use_cases       TEXT[], -- e.g. ['school', 'work', 'personal']
  onboarding_done BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Files (user workspace files)
CREATE TABLE files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path         TEXT NOT NULL,  -- e.g. 'context/me.md'
  name         TEXT NOT NULL,  -- e.g. 'me.md'
  content      TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, path)
);

-- Memories (AI memory entries per user)
CREATE TABLE memories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT CHECK (type IN ('user', 'feedback', 'project', 'reference')),
  body       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (AI chat history)
CREATE TABLE conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages   JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE files        ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "own profile"       ON profiles      FOR ALL USING (auth.uid() = id);
CREATE POLICY "own files"         ON files         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own memories"      ON memories      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own conversations" ON conversations FOR ALL USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
