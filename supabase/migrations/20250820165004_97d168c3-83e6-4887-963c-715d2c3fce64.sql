-- Fix projects RLS policy that might be causing recursion
DROP POLICY IF EXISTS "Project creators and members can update projects" ON projects;

-- Create a simpler non-recursive policy
CREATE POLICY "Project creators and members can update projects" 
ON projects 
FOR UPDATE 
USING (
  auth.uid() = creator_id OR
  auth.uid() IN (
    SELECT user_id FROM project_members WHERE project_id = projects.id
  )
);