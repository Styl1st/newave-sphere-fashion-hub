import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useTheme } from "@/hooks/useTheme";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Palette, Sun, Moon, MessageCircle, HelpCircle, Menu, X } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { CartDrawer } from "@/components/CartDrawer";
import { SupportDialog } from "@/components/SupportDialog";
import logoTransparent from "@/assets/newave/logo_transparent.png";

const BrandNavbar = () => {
  const { user, signOut } = useAuth();
  const { role } = useRole();
  const { currentTheme, themes, setTheme, mode, toggleMode } = useTheme();
  const { getUnreadCount } = useMessages();
  const unreadCount = user ? getUnreadCount() : 0;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavLinks = ({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) => {
    const linkClass = mobile 
      ? "w-full justify-start text-lg py-3" 
      : "text-sm font-medium";
    
    const handleClick = () => {
      if (onClose) onClose();
    };

  return (
    <header className="sticky z-30" style={{top: '1%', padding: '0 4%'}}>
      <nav className="mx-auto grid grid-cols-3 items-center bg-background/90 backdrop-blur border rounded-2xl shadow-elegant" style={{maxWidth: '90%', height: '4vw', minHeight: '60px', padding: '0 3%'}}>
        {/* Logo - Left */}
        <div className="flex justify-start">
          <Link to="/" className="flex-shrink-0">
            <img src={logoTransparent} alt="logo" className="w-auto dark:invert" style={{height: '2.5vw', minHeight: '36px'}} />
          </Link>
        </div>

        {/* Navigation Links - Center */}
        <div className="flex items-center justify-center" style={{gap: '3%'}}>
          <Link to="/">
            <Button variant="ghost" size="sm" className="font-medium" style={{fontSize: '0.85vw'}}>Home</Button>
          </Link>
          {user && (
            <>
              {role !== 'seller' || (
                <>
                  <Link to="/seller">
                    <Button variant="ghost" size="sm" className="font-medium" style={{fontSize: '0.85vw'}}>Dashboard</Button>
                  </Link>
                  <Link to="/my-profile">
                    <Button variant="ghost" size="sm" className="font-medium" style={{fontSize: '0.85vw'}}>Profile</Button>
                  </Link>
                </>
              )}
              
              {role === 'admin' && (
                <>
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="font-medium" style={{fontSize: '0.85vw'}}>Admin</Button>
                  </Link>
                  <Link to="/my-profile">
                    <Button variant="ghost" size="sm" className="font-medium" style={{fontSize: '0.85vw'}}>Profile</Button>
                  </Link>
                </>
              )}
              
              {role === 'buyer' && (
                <Link to="/user">
                  <Button variant="ghost" size="sm" className="font-medium" style={{fontSize: '0.85vw'}}>My Space</Button>
                </Link>
              )}
            </>
          )}
        </div>

        {/* Actions - Right */}
        <div className="flex items-center justify-end" style={{gap: '2%'}}>
          {/* Theme Controls */}
          <div className="flex items-center rounded-lg bg-muted/50" style={{gap: '0.5%', padding: '0.5% 1%'}}>
            <Button variant="ghost" size="icon" className="relative" style={{height: '2vw', width: '2vw', minHeight: '32px', minWidth: '32px'}} onClick={toggleMode}>
              {mode === 'dark' ? (
                <Sun style={{height: '1vw', width: '1vw', minHeight: '16px', minWidth: '16px'}} />
              ) : (
                <Moon style={{height: '1vw', width: '1vw', minHeight: '16px', minWidth: '16px'}} />
              )}
            </Button>

            <div className="w-px h-4 bg-border" />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" style={{height: '2vw', width: '2vw', minHeight: '32px', minWidth: '32px'}}>
                  <Palette style={{height: '1vw', width: '1vw', minHeight: '16px', minWidth: '16px'}} />
                  <span 
                    className="absolute rounded-full border-2 border-background"
                    style={{ bottom: '-2px', right: '-2px', width: '0.6vw', height: '0.6vw', minWidth: '10px', minHeight: '10px', backgroundColor: `hsl(${currentTheme.hue}, ${currentTheme.saturation}%, ${currentTheme.lightness}%)` }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-popover border-border" style={{width: '12vw', minWidth: '192px', padding: '2%'}} align="end">
                <p className="font-medium text-muted-foreground" style={{fontSize: '0.75vw', marginBottom: '1%'}}>Theme Color</p>
                <div className="grid grid-cols-4" style={{gap: '1.5%'}}>
                  {themes.map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => setTheme(theme)}
                      className={`rounded-full transition-all hover:scale-110 ${
                        currentTheme.name === theme.name 
                          ? 'ring-2 ring-offset-2 ring-foreground' 
                          : ''
                      }`}
                      style={{ width: '2vw', height: '2vw', minWidth: '32px', minHeight: '32px', backgroundColor: `hsl(${theme.hue}, ${theme.saturation}%, ${theme.lightness}%)` }}
                      title={theme.name}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Mobile Theme Toggle Only */}
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" onClick={toggleMode}>
            {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Cart */}
          <CartDrawer />

          {/* Support - Hidden on mobile, shown in menu */}
          {user && (
            <div className="hidden sm:block">
              <SupportDialog
                trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
          )}

          {/* Messages */}
          {user && (
            <Link to="/inbox" className="relative">
              <Button variant="ghost" size="icon" style={{height: '2vw', width: '2vw', minHeight: '32px', minWidth: '32px'}}>
                <MessageCircle style={{height: '1vw', width: '1vw', minHeight: '16px', minWidth: '16px'}} />
                {unreadCount > 0 && (
                  <span className="absolute bg-destructive text-destructive-foreground font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg" style={{top: '-4px', right: '-4px', width: '1.2vw', height: '1.2vw', minWidth: '20px', minHeight: '20px', fontSize: '0.7vw'}}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          )}

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