-- Fix the recursive RLS policy issue
DROP POLICY IF EXISTS "Project members are viewable by project members" ON project_members;
DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;

-- Create new non-recursive policies
CREATE POLICY "Project members are viewable by project members" 
ON project_members 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_members.project_id 
    AND p.creator_id = auth.uid()
  )
);

CREATE POLICY "Project owners can manage members" 
ON project_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_members.project_id 
    AND p.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own memberships"
ON project_members
FOR SELECT
USING (user_id = auth.uid());