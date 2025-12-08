import BrandNavbar from "@/components/BrandNavbar";
import { ProjectManager } from "@/components/ProjectManager";
import { ProjectProductManager } from "@/components/ProjectProductManager";
import { NotificationCenter } from "@/components/NotificationCenter";
import { SalesStatistics } from "@/components/SalesStatistics";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProtectedRoute from "@/components/ProtectedRoute";

const SellerDashboard = () => {
  const { user } = useAuth();
  const { t } = useI18n();
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
        <p>{t.common.loading}</p>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["seller"]}>
      <div className="min-h-screen bg-animated-fade">
        <BrandNavbar />
        <div className="mx-auto max-w-[95%] sm:max-w-[90%] px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
          <h1 className="font-bold text-xl sm:text-2xl lg:text-3xl mb-6 sm:mb-8">{t.nav.dashboard}</h1>

          <Tabs defaultValue="projects" className="space-y-4 sm:space-y-6">
            <TabsList className={`grid w-full h-auto ${hasProjects ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
              <TabsTrigger value="projects" className="text-xs sm:text-sm py-2">{t.sellerDashboard.myProjects}</TabsTrigger>
              {hasProjects && (
                <TabsTrigger value="products" className="text-xs sm:text-sm py-2">{t.sellerDashboard.products}</TabsTrigger>
              )}
              <TabsTrigger value="statistics" className="text-xs sm:text-sm py-2">{t.sellerDashboard.statistics}</TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm py-2">{t.sellerDashboard.notifications}</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-4 sm:space-y-6">
              <ProjectManager onProjectsChange={checkUserProjects} />
            </TabsContent>

            {hasProjects && (
              <TabsContent value="products" className="space-y-4 sm:space-y-6">
                <ProjectProductManager />
              </TabsContent>
            )}

            <TabsContent value="statistics" className="space-y-4 sm:space-y-6">
              <SalesStatistics />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4 sm:space-y-6">
              <NotificationCenter />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SellerDashboard;
