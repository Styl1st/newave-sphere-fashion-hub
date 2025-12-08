import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useTheme } from "@/hooks/useTheme";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette } from "lucide-react";
import logoTransparent from "@/assets/newave/logo_transparent.png";

const BrandNavbar = () => {
  const { user, signOut } = useAuth();
  const { role } = useRole();
  const { currentTheme, themes, setTheme } = useTheme();

  return (
    <header className="sticky z-30" style={{top: '1%', padding: '0 2%'}}>
      <nav className="mx-auto flex items-center justify-between bg-background/90 backdrop-blur border rounded-2xl shadow-elegant" style={{maxWidth: '90%', height: '4vw', minHeight: '60px', padding: '0 3%'}}>
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

          {/* Theme Toggle */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Palette className="h-5 w-5" />
                <span 
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background"
                  style={{ backgroundColor: `hsl(${currentTheme.hue}, ${currentTheme.saturation}%, ${currentTheme.lightness}%)` }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3" align="end">
              <p className="text-xs font-medium text-muted-foreground mb-2">Theme Color</p>
              <div className="grid grid-cols-4 gap-2">
                {themes.map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => setTheme(theme)}
                    className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${
                      currentTheme.name === theme.name 
                        ? 'ring-2 ring-offset-2 ring-foreground' 
                        : ''
                    }`}
                    style={{ backgroundColor: `hsl(${theme.hue}, ${theme.saturation}%, ${theme.lightness}%)` }}
                    title={theme.name}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

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
