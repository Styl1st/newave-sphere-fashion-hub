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
      <>
        <Link to="/" onClick={handleClick}>
          <Button variant="ghost" size={mobile ? "lg" : "sm"} className={linkClass}>Home</Button>
        </Link>
        {user && (
          <>
            {role !== 'seller' || (
              <>
                <Link to="/seller" onClick={handleClick}>
                  <Button variant="ghost" size={mobile ? "lg" : "sm"} className={linkClass}>Dashboard</Button>
                </Link>
                <Link to="/my-profile" onClick={handleClick}>
                  <Button variant="ghost" size={mobile ? "lg" : "sm"} className={linkClass}>Profile</Button>
                </Link>
              </>
            )}
            
            {role === 'admin' && (
              <>
                <Link to="/admin" onClick={handleClick}>
                  <Button variant="ghost" size={mobile ? "lg" : "sm"} className={linkClass}>Admin</Button>
                </Link>
                <Link to="/my-profile" onClick={handleClick}>
                  <Button variant="ghost" size={mobile ? "lg" : "sm"} className={linkClass}>Profile</Button>
                </Link>
              </>
            )}
            
            {role === 'buyer' && (
              <Link to="/user" onClick={handleClick}>
                <Button variant="ghost" size={mobile ? "lg" : "sm"} className={linkClass}>My Space</Button>
              </Link>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <header className="sticky z-30 top-2 sm:top-4 px-2 sm:px-4 md:px-8">
      <nav className="mx-auto flex items-center justify-between bg-background/90 backdrop-blur border rounded-xl sm:rounded-2xl shadow-elegant max-w-6xl h-14 sm:h-16 px-3 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img src={logoTransparent} alt="logo" className="h-7 sm:h-9 w-auto dark:invert" />
        </Link>

        {/* Desktop Navigation Links - Hidden on mobile */}
        <div className="hidden md:flex items-center justify-center gap-4 lg:gap-6">
          <NavLinks />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Theme Controls - Simplified on mobile */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMode}>
              {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
                        currentTheme.name === theme.name ? 'ring-2 ring-offset-2 ring-foreground' : ''
                      }`}
                      style={{ backgroundColor: `hsl(${theme.hue}, ${theme.saturation}%, ${theme.lightness}%)` }}
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
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MessageCircle className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Button onClick={signOut} variant="outline" size="sm">
                Sign out
              </Button>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-sm hidden lg:inline-flex">Become a seller</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero" size="sm">Sign in</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px] p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <img src={logoTransparent} alt="logo" className="h-8 w-auto dark:invert" />
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>

                {/* Navigation */}
                <div className="flex flex-col p-4 gap-1">
                  <NavLinks mobile onClose={() => setMobileMenuOpen(false)} />
                </div>

                {/* Theme Picker - Mobile */}
                <div className="px-4 py-3 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Theme Color</p>
                  <div className="grid grid-cols-6 gap-2">
                    {themes.map((theme) => (
                      <button
                        key={theme.name}
                        onClick={() => setTheme(theme)}
                        className={`w-10 h-10 rounded-full transition-all ${
                          currentTheme.name === theme.name ? 'ring-2 ring-offset-2 ring-foreground' : ''
                        }`}
                        style={{ backgroundColor: `hsl(${theme.hue}, ${theme.saturation}%, ${theme.lightness}%)` }}
                        title={theme.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Support - Mobile */}
                {user && (
                  <div className="px-4 py-3 border-t">
                    <SupportDialog
                      trigger={
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Support
                        </Button>
                      }
                    />
                  </div>
                )}

                {/* Auth - Mobile */}
                <div className="mt-auto p-4 border-t">
                  {user ? (
                    <Button onClick={() => { signOut(); setMobileMenuOpen(false); }} variant="outline" className="w-full">
                      Sign out
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="hero" className="w-full">Sign in</Button>
                      </Link>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">Become a seller</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};

export default BrandNavbar;