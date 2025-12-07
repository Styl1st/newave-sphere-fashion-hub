import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProtectedRoute from "@/components/ProtectedRoute";
import BrandNavbar from "@/components/BrandNavbar";
import { useAuth } from "@/hooks/useAuth";

const Stat = ({ label, value }: { label: string; value: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base text-muted-foreground">{label}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-semibold">{value}</div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <BrandNavbar />
        <main className="mx-auto" style={{maxWidth: '90%', padding: '5% 0'}}>
          <div style={{marginBottom: '3%'}}>
            <h1 className="font-semibold" style={{fontSize: '2.5vw'}}>Dashboard</h1>
            <p className="text-muted-foreground" style={{marginTop: '1%', fontSize: '1vw'}}>
              Bienvenue {user?.email} ! Voici vos métriques de marque.
            </p>
          </div>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{gap: '3%', marginTop: '4%'}}>
            <Stat label="Vues produits" value="12,480" />
            <Stat label="Visites profil" value="3,214" />
            <Stat label="Articles favoris" value="892" />
            <Stat label="Taux conversion" value="2.3%" />
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
