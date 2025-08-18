import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/newave/logo.png";

const BrandNavbar = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b">
      <nav className="container mx-auto flex items-center justify-between h-20">
        {/* <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">
            NeWave Sphere
          </span>
        </Link> */}

        <img src={logo} alt="logo" className="h-full w-auto" />

        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost">Home</Button>
          </Link>
          {user && (
            <Link to="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          )}
          {user ? (
            <Button onClick={signOut} variant="outline">
              Se déconnecter
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="hero">Sell with us</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default BrandNavbar;
