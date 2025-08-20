import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Plus, Mail, Trash2 } from 'lucide-react';
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
}

export const ProjectManager = ({ onProjectsChange }: ProjectManagerProps) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
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
      
      let allProjects = [...(createdProjects.data || [])];
      
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

      // Fetch members for each project
      for (const project of allProjects) {
        const { data: members } = await supabase
          .from('project_members')
          .select(`
            id,
            user_id,
            role,
            profiles!inner(full_name, email)
          `)
          .eq('project_id', project.id);
        
        (project as any).members = members || [];
      }

      setProjects(allProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('Le nom du projet est requis');
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
      toast.success('Projet créé avec succès!');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Erreur lors de la création du projet');
    }
  };

  const inviteUser = async (projectId: string) => {
    if (!inviteEmail.trim()) {
      toast.error('Email requis');
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
          toast.success('Invitation envoyée!');
          setInviteEmail('');
          fetchProjects();
        } else {
          toast.error(result.message);
        }
      } else {
        toast.error('Erreur lors de l\'invitation');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Erreur lors de l\'invitation');
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
        .eq('id', projectId)
        .eq('creator_id', user?.id);

      if (error) throw error;

      toast.success('Projet supprimé avec succès!');
      fetchProjects();
      onProjectsChange?.();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Erreur lors de la suppression du projet');
    }
  };

  if (loading) {
    return <div className="text-center p-4">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Créer un nouveau projet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Nom du projet (nom de la marque)"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
          />
          <Textarea
            placeholder="Description du projet"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
          />
          <Button onClick={createProject}>Créer le projet</Button>
        </CardContent>
      </Card>

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
                  {project.creator_id === user?.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le projet</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer le projet "{project.name}" ? 
                            Cette action est irréversible et supprimera tous les produits associés.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteProject(project.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
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
                <h4 className="font-medium mb-2">Membres:</h4>
                <div className="space-y-1">
                  {project.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between text-sm">
                      <span>{member.profiles?.full_name || member.profiles?.email}</span>
                      <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                        {member.role === 'owner' ? 'Propriétaire' : 'Collaborateur'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {project.creator_id === user?.id && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Inviter un collaborateur:</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Email de l'utilisateur"
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
            <p className="text-muted-foreground">Aucun projet trouvé. Créez votre premier projet!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};