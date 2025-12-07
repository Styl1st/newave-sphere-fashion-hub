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
    <header className="sticky z-30" style={{top: '1%', padding: '0 2%'}}>
      <nav className="mx-auto flex items-center justify-between bg-background/90 backdrop-blur border rounded-2xl shadow-elegant" style={{maxWidth: '90%', height: '4vw', minHeight: '60px', padding: '0 3%'}}>
        {/* <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">
            NeWave Sphere
          </span>
        </Link> */}

        <img src={logoTransparent} alt="logo" className="w-auto" style={{height: '2.5vw', minHeight: '40px'}} />

        <div className="flex items-center" style={{gap: '2%'}}>
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
