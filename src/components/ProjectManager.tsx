import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Mail, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  creator_id: string;
  created_at: string;
  members?: ProjectMember[];
}

interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface ProjectManagerProps {
  onProjectsChange?: () => void;
  isAdminView?: boolean;
}

export const ProjectManager = ({ onProjectsChange, isAdminView = false }: ProjectManagerProps) => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, isAdminView]);

  const fetchProjects = async () => {
    try {
      let allProjects: Project[] = [];

      if (isAdminView && isAdmin) {
        // Admin can see all projects
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        allProjects = data || [];
      } else {
        // Fetch projects where user is creator or member
        const [createdProjects, memberProjects] = await Promise.all([
          supabase
            .from('projects')
            .select('*')
            .eq('creator_id', user?.id),
          supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', user?.id)
        ]);

        if (createdProjects.error) throw createdProjects.error;
        if (memberProjects.error) throw memberProjects.error;

        const memberProjectIds = memberProjects.data?.map(m => m.project_id) || [];
        
        allProjects = [...(createdProjects.data || [])];
        
        // Only fetch member projects that are not already in created projects
        const createdProjectIds = createdProjects.data?.map(p => p.id) || [];
        const uniqueMemberProjectIds = memberProjectIds.filter(id => !createdProjectIds.includes(id));
        
        if (uniqueMemberProjectIds.length > 0) {
          const { data: memberProjectsData, error } = await supabase
            .from('projects')
            .select('*')
            .in('id', uniqueMemberProjectIds);
          
          if (!error && memberProjectsData) {
            allProjects = [...allProjects, ...memberProjectsData];
          }
        }
      }

      // Fetch members for each project
      for (const project of allProjects) {
        const { data: members } = await supabase
          .from('project_members')
          .select(`
            id,
            user_id,
            role
          `)
          .eq('project_id', project.id);
        
        (project as any).members = members || [];
      }

      setProjects(allProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Error loading projects');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProject.name,
          description: newProject.description,
          creator_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner in project_members
      await supabase
        .from('project_members')
        .insert({
          project_id: data.id,
          user_id: user?.id,
          role: 'owner'
        });

      setNewProject({ name: '', description: '' });
      fetchProjects();
      onProjectsChange?.();
      toast.success('Project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Error creating project');
    }
  };

  const updateProject = async () => {
    if (!editingProject || !editForm.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: editForm.name,
          description: editForm.description
        })
        .eq('id', editingProject.id);

      if (error) throw error;

      toast.success('Project updated successfully!');
      setEditingProject(null);
      setEditForm({ name: '', description: '' });
      fetchProjects();
      onProjectsChange?.();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Error updating project');
    }
  };

  const inviteUser = async (projectId: string) => {
    if (!inviteEmail.trim()) {
      toast.error('Email required');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('invite_user_to_project', {
        p_project_id: projectId,
        p_user_email: inviteEmail,
        p_inviter_id: user?.id
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'success' in data) {
        const result = data as { success: boolean; message: string };
        if (result.success) {
          toast.success('Invitation sent!');
          setInviteEmail('');
          fetchProjects();
        } else {
          toast.error(result.message);
        }
      } else {
        toast.error('Error sending invitation');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Error sending invitation');
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      // First delete project members
      await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId);

      // Then delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Project deleted successfully!');
      fetchProjects();
      onProjectsChange?.();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error deleting project');
    }
  };

  const canEditProject = (project: Project) => {
    if (isAdmin) return true;
    if (project.creator_id === user?.id) return true;
    // Check if user is a member of the project
    return project.members?.some(m => m.user_id === user?.id) || false;
  };

  const canDeleteProject = (project: Project) => {
    if (isAdmin) return true;
    return project.creator_id === user?.id;
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {!isAdminView && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create a new project
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Project name (brand name)"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            />
            <Textarea
              placeholder="Project description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
            <Button onClick={createProject}>Create project</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{project.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {project.members?.length || 0}
                  </Badge>
                  
                  {canEditProject(project) && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingProject(project);
                            setEditForm({ name: project.name, description: project.description || '' });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit project</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Project name"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                          <Textarea
                            placeholder="Project description"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          />
                          <Button onClick={updateProject} className="w-full">
                            Save changes
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {canDeleteProject(project) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the project "{project.name}"? 
                            This action is irreversible and will delete all associated products.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteProject(project.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardTitle>
              {project.description && (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Members:</h4>
                <div className="space-y-1">
                  {project.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between text-sm">
                      <span>{member.user_id}</span>
                      <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                        {member.role === 'owner' ? 'Owner' : 'Collaborator'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {(project.creator_id === user?.id || isAdmin) && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Invite a collaborator:</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="User email"
                      value={selectedProject === project.id ? inviteEmail : ''}
                      onChange={(e) => {
                        setInviteEmail(e.target.value);
                        setSelectedProject(project.id);
                      }}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => inviteUser(project.id)}
                      disabled={!inviteEmail.trim()}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {isAdminView ? 'No projects found.' : 'No projects found. Create your first project!'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};