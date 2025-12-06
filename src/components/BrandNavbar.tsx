import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import logo from "@/assets/newave/logo.png";
import logoTransparent from "@/assets/newave/logo_transparent.png";

const BrandNavbar = () => {
  const { user, signOut } = useAuth();
  const { role } = useRole();

  return (
    <header className="sticky top-4 z-30 px-4">
      <nav className="max-w-6xl mx-auto flex items-center justify-between h-16 bg-background/90 backdrop-blur border rounded-2xl px-6 shadow-elegant">
        {/* <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">
            NeWave Sphere
          </span>
        </Link> */}

        <img src={logoTransparent} alt="logo" className="h-10 w-auto" />

        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost">Home</Button>
          </Link>
          {user && (
            <>
              {role !== 'seller' || (
                <>
                  <Link to="/seller">
                    <Button variant="ghost">Seller Dashboard</Button>
                  </Link>
                  <Link to="/my-profile">
                    <Button variant="ghost">My Profile</Button>
                  </Link>
                </>
              )}
              
              {role === 'admin' && (
                <>
                  <Link to="/admin">
                    <Button variant="ghost">Administration</Button>
                  </Link>
                  <Link to="/my-profile">
                    <Button variant="ghost">My Profile</Button>
                  </Link>
                </>
              )}
              
              {role === 'buyer' && (
                <Link to="/user">
                  <Button variant="ghost">My Space</Button>
                </Link>
              )}
            </>
          )}
          {user ? (
            <Button onClick={signOut} variant="outline">
              Sign out
            </Button>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="secondary">Become a seller</Button>
              </Link>
              <Link to="/auth">
                <Button variant="hero">Sign in</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default BrandNavbar;
