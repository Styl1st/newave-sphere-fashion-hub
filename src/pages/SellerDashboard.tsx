import BrandNavbar from "@/components/BrandNavbar";
import { ProjectManager } from "@/components/ProjectManager";
import { ProjectProductManager } from "@/components/ProjectProductManager";
import { NotificationCenter } from "@/components/NotificationCenter";
import { SalesStatistics } from "@/components/SalesStatistics";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProtectedRoute from "@/components/ProtectedRoute";

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
        supabase.from("projects").select("id").eq("creator_id", user?.id),
        supabase
          .from("project_members")
          .select("project_id")
          .eq("user_id", user?.id),
      ]);

      const hasAnyProjects =
        (createdProjects.data && createdProjects.data.length > 0) ||
        (memberProjects.data && memberProjects.data.length > 0);

      setHasProjects(hasAnyProjects);
    } catch (error) {
      console.error("Error checking projects:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to access the seller dashboard.</p>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["seller"]}>
      <div className="min-h-screen bg-animated-fade">
        <BrandNavbar />
        <div className="mx-auto" style={{maxWidth: '90%', padding: '4% 2%'}}>
          <div className="mx-auto" style={{maxWidth: '95%'}}>
            <h1 className="font-bold" style={{fontSize: '2.5vw', marginBottom: '4%'}}>Tableau de bord vendeur</h1>

            <Tabs defaultValue="sales" style={{display: 'flex', flexDirection: 'column', gap: '3%'}}>
              <TabsList
                className={`grid w-full ${
                  hasProjects ? "grid-cols-4" : "grid-cols-3"
                }`}
              >
                <TabsTrigger value="sales">Ventes</TabsTrigger>
                <TabsTrigger value="projects">Mes Projets</TabsTrigger>
                {hasProjects && (
                  <TabsTrigger value="products">Produits</TabsTrigger>
                )}
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>

              <TabsContent value="sales" className="space-y-6">
                <SalesStatistics />
              </TabsContent>

              <TabsContent value="projects" style={{display: 'flex', flexDirection: 'column', gap: '3%'}}>
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
      </div>
    </ProtectedRoute>
  );
};

export default SellerDashboard;
