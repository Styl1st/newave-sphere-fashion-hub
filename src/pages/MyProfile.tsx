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
    <div className="min-h-screen bg-animated-fade">
      <BrandNavbar />
      <main className="mx-auto" style={{maxWidth: '90%', padding: '4% 2%'}}>
        <div className="mx-auto" style={{maxWidth: '80%'}}>
          <h1 className="font-bold text-foreground" style={{fontSize: '2.5vw', marginBottom: '4%'}}>
            Mon Profil
          </h1>
          <SellerProfileManager />
        </div>
      </main>
    </div>
  );
};

export default MyProfile;