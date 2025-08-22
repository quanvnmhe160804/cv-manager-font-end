
DROP POLICY IF EXISTS "Users can view own candidates" ON candidates;
DROP POLICY IF EXISTS "Users can insert own candidates" ON candidates;
DROP POLICY IF EXISTS "Users can update own candidates" ON candidates;
DROP POLICY IF EXISTS "Users can delete own candidates" ON candidates;

DROP POLICY IF EXISTS "Users can upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete resumes" ON storage.objects;

CREATE TABLE IF NOT EXISTS candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  applied_position TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Interviewing', 'Hired', 'Rejected')),
  resume_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can view own candidates" ON candidates
  FOR SELECT USING (auth.uid() = user_id);


CREATE POLICY "Users can insert own candidates" ON candidates
  FOR INSERT WITH CHECK (auth.uid() = user_id);


CREATE POLICY "Users can update own candidates" ON candidates
  FOR UPDATE USING (auth.uid() = user_id);


CREATE POLICY "Users can delete own candidates" ON candidates
  FOR DELETE USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;


CREATE POLICY "Users can upload resumes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'resumes');


CREATE POLICY "Users can view resumes" ON storage.objects
  FOR SELECT USING (bucket_id = 'resumes');


CREATE POLICY "Users can delete resumes" ON storage.objects
  FOR DELETE USING (bucket_id = 'resumes');


CREATE OR REPLACE VIEW candidates_with_user AS
SELECT 
  c.*,
  u.email as user_email
FROM candidates c
JOIN auth.users u ON c.user_id = u.id;

    
CREATE OR REPLACE FUNCTION get_my_candidates()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  applied_position TEXT,
  status TEXT,
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.full_name,
    c.applied_position,
    c.status,
    c.resume_url,
    c.created_at
  FROM candidates c
  WHERE c.user_id = auth.uid()
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
