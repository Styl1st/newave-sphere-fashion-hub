import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useTheme } from "@/hooks/useTheme";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette, Sun, Moon } from "lucide-react";
import logoTransparent from "@/assets/newave/logo_transparent.png";

const BrandNavbar = () => {
  const { user, signOut } = useAuth();
  const { role } = useRole();
  const { currentTheme, themes, setTheme, mode, toggleMode } = useTheme();

  return (
    <header className="sticky z-30 top-4 px-4 md:px-8">
      <nav className="mx-auto flex items-center bg-background/90 backdrop-blur border rounded-2xl shadow-elegant max-w-6xl h-16 px-6">
        {/* Logo - Left */}
        <Link to="/" className="flex-shrink-0">
          <img src={logoTransparent} alt="logo" className="h-9 w-auto" />
        </Link>

        {/* Navigation Links - Center */}
        <div className="flex-1 flex items-center justify-center gap-1">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-sm">Home</Button>
          </Link>
          {user && (
            <>
              {role !== 'seller' || (
                <>
                  <Link to="/seller">
                    <Button variant="ghost" size="sm" className="text-sm">Dashboard</Button>
                  </Link>
                  <Link to="/my-profile">
                    <Button variant="ghost" size="sm" className="text-sm">Profile</Button>
                  </Link>
                </>
              )}
              
              {role === 'admin' && (
                <>
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="text-sm">Admin</Button>
                  </Link>
                  <Link to="/my-profile">
                    <Button variant="ghost" size="sm" className="text-sm">Profile</Button>
                  </Link>
                </>
              )}
              
              {role === 'buyer' && (
                <Link to="/user">
                  <Button variant="ghost" size="sm" className="text-sm">My Space</Button>
                </Link>
              )}
            </>
          )}
        </div>

        {/* Actions - Right */}
        <div className="flex items-center gap-2">
          {/* Theme Controls */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMode}>
              {mode === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <div className="w-px h-4 bg-border" />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                  <Palette className="h-4 w-4" />
                  <span 
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background"
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
          </div>

          {/* Auth Buttons */}
          {user ? (
            <Button onClick={signOut} variant="outline" size="sm">
              Sign out
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-sm">Become a seller</Button>
              </Link>
              <Link to="/auth">
                <Button variant="hero" size="sm">Sign in</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default BrandNavbar;
