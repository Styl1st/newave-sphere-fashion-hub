import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useI18n } from '@/hooks/useI18n';
import BrandNavbar from '@/components/BrandNavbar';
import { SellerProfileManager } from '@/components/SellerProfileManager';

const MyProfile = () => {
  const { user } = useAuth();
  const { role, loading } = useRole();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.common.loading}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.cart.signInRequired}</div>
      </div>
    );
  }

  if (role !== 'seller' && role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.profile.noAccess}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-animated-fade">
      <BrandNavbar />
      <main className="mx-auto" style={{maxWidth: '90%', padding: '4% 2%'}}>
        <div className="mx-auto" style={{maxWidth: '80%'}}>
          <h1 className="font-bold text-foreground" style={{fontSize: '2.5vw', marginBottom: '4%'}}>
            {t.profile.myProfile}
          </h1>
          <SellerProfileManager />
        </div>
      </main>
    </div>
  );
};

export default MyProfile;
