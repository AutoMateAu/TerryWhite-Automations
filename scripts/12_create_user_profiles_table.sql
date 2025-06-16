CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'nurse');

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role DEFAULT 'nurse' NOT NULL,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for all authenticated users to read their own profile
CREATE POLICY "Users can view their own profile." ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles." ON user_profiles
  FOR SELECT USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- Policy for admins to update any profile
CREATE POLICY "Admins can update any profile." ON user_profiles
  FOR UPDATE USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- Policy for users to update their own hospital_id
CREATE POLICY "Users can update their own hospital_id." ON user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Function to create a user profile on new user signup, reading role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'nurse')); -- Read role from metadata, default to 'nurse'
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
