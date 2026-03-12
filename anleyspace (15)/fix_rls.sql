-- Enable RLS on the posts table if not already enabled
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop existing select policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Allow authenticated select" ON public.posts;

-- Create a policy that allows all authenticated users to view posts
CREATE POLICY "Posts are viewable by authenticated users" 
ON public.posts 
FOR SELECT 
TO authenticated 
USING (true);

-- Also ensure comments and likes are viewable so the UI works correctly
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by authenticated users" 
ON public.comments 
FOR SELECT 
TO authenticated 
USING (true);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
CREATE POLICY "Likes are viewable by authenticated users" 
ON public.likes 
FOR SELECT 
TO authenticated 
USING (true);

-- Ensure profiles are viewable so usernames and avatars show up
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);
