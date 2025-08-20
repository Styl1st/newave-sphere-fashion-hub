import BrandNavbar from '@/components/BrandNavbar';
import { ProjectManager } from '@/components/ProjectManager';
import { ProjectProductManager } from '@/components/ProjectProductManager';
import { NotificationCenter } from '@/components/NotificationCenter';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SellerDashboard = () => {
  const { user } = useAuth();

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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="projects">Mes Projets</TabsTrigger>
              <TabsTrigger value="products">Produits</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-6">
              <ProjectManager />
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <ProjectProductManager />
            </TabsContent>

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