-- Insert sample members (students)
INSERT INTO members (name, phone, notes) VALUES
  ('مارك جرجس', '01234567890', 'طالب نشيط'),
  ('مينا عادل', '01234567891', ''),
  ('كيرلس مجدي', '01234567892', 'يحتاج متابعة'),
  ('بيتر سمير', '01234567893', ''),
  ('جورج فادي', '01234567894', 'طالب متميز'),
  ('أندرو ميلاد', '01234567895', ''),
  ('مايكل رامي', '01234567896', 'طالب جديد'),
  ('توماس كريم', '01234567897', ''),
  ('يوحنا ماجد', '01234567898', 'يحتاج تشجيع'),
  ('لوقا هاني', '01234567899', 'طالب متميز')
ON CONFLICT DO NOTHING;

-- Note: Users (servants) should be created through the signup page
-- This ensures proper authentication setup in Supabase Auth
-- After creating your first account via /signup, you can create additional users from the Users management page
