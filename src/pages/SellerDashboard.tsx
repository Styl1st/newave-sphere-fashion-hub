import BrandNavbar from '@/components/BrandNavbar';
import { ProjectManager } from '@/components/ProjectManager';
import { ProjectProductManager } from '@/components/ProjectProductManager';
import { NotificationCenter } from '@/components/NotificationCenter';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SellerDashboard = () => {
  const { user } = useAuth();
  const [hasProjects, setHasProjects] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkUserProjects();
    }
  }, [user]);

  const checkUserProjects = async () => {
    try {
      const [createdProjects, memberProjects] = await Promise.all([
        supabase
          .from('projects')
          .select('id')
          .eq('creator_id', user?.id),
        supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', user?.id)
      ]);

      const hasAnyProjects = 
        (createdProjects.data && createdProjects.data.length > 0) ||
        (memberProjects.data && memberProjects.data.length > 0);

      setHasProjects(hasAnyProjects);
    } catch (error) {
      console.error('Error checking projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Veuillez vous connecter pour accéder au tableau de bord vendeur.</p>
      </div>
    );
  }

  return (
    <>
      <BrandNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Tableau de bord vendeur</h1>
          
          <Tabs defaultValue="projects" className="space-y-6">
            <TabsList className={`grid w-full ${hasProjects ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="projects">Mes Projets</TabsTrigger>
              {hasProjects && <TabsTrigger value="products">Produits</TabsTrigger>}
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-6">
              <ProjectManager onProjectsChange={checkUserProjects} />
            </TabsContent>

            {hasProjects && (
              <TabsContent value="products" className="space-y-6">
                <ProjectProductManager />
              </TabsContent>
            )}

            <TabsContent value="notifications" className="space-y-6">
              <NotificationCenter />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default SellerDashboard;