import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import BrandNavbar from '@/components/BrandNavbar';
import { SellerProfileManager } from '@/components/SellerProfileManager';

const MyProfile = () => {
  const { user } = useAuth();
  const { role, loading } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Vous devez être connecté pour accéder à cette page.</div>
      </div>
    );
  }

  if (role !== 'seller' && role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Accès non autorisé.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BrandNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">
            Mon Profil
          </h1>
          <SellerProfileManager />
        </div>
      </main>
    </div>
  );
};

export default MyProfile;