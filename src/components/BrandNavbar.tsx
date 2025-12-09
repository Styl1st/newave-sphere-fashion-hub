import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/hooks/useI18n";
import { useOpenTickets } from "@/hooks/useOpenTickets";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Palette, Sun, Moon, MessageCircle, HelpCircle, Menu, Home, LayoutDashboard, User, Shield, Heart, LogOut, Store, LogIn } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { CartDrawer } from "@/components/CartDrawer";
import { SupportDialog } from "@/components/SupportDialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import logoTransparent from "@/assets/newave/logo_transparent.png";

const BrandNavbar = () => {
  const { user, signOut } = useAuth();
  const { role } = useRole();
  const { currentTheme, themes, setTheme, mode, toggleMode } = useTheme();
  const { t } = useI18n();
  const { getUnreadCount } = useMessages();
  const { openTicketsCount } = useOpenTickets();
  const unreadCount = user ? getUnreadCount() : 0;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-2 z-30 px-2 sm:px-4">
      <nav className="mx-auto grid grid-cols-3 items-center bg-background/90 backdrop-blur border rounded-2xl shadow-elegant max-w-7xl h-14 sm:h-16 px-3 sm:px-6">
        {/* Logo - Left */}
        <div className="flex justify-start">
          <Link to="/" className="flex-shrink-0">
            <img src={logoTransparent} alt="logo" className="h-8 sm:h-10 w-auto dark:invert" />
          </Link>
        </div>

        {/* Desktop Navigation Links - Center */}
        <div className="hidden md:flex items-center justify-center gap-1 lg:gap-2">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-sm font-medium">{t.nav.home}</Button>
          </Link>
          {user && (
            <>
              {role === 'seller' && (
                <>
                  <Link to="/seller">
                    <Button variant="ghost" size="sm" className="text-sm font-medium">{t.nav.dashboard}</Button>
                  </Link>
                  <Link to="/my-profile">
                    <Button variant="ghost" size="sm" className="text-sm font-medium">{t.nav.profile}</Button>
                  </Link>
                </>
              )}
              
              {role === 'admin' && (
                <>
                  <Link to="/admin" className="relative">
                    <Button variant="ghost" size="sm" className="text-sm font-medium">
                      {t.nav.admin}
                      {openTicketsCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                          {openTicketsCount > 9 ? '9+' : openTicketsCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link to="/my-profile">
                    <Button variant="ghost" size="sm" className="text-sm font-medium">{t.nav.profile}</Button>
                  </Link>
                </>
              )}
              
              {role === 'buyer' && (
                <Link to="/user">
                  <Button variant="ghost" size="sm" className="text-sm font-medium">{t.nav.mySpace}</Button>
                </Link>
              )}
            </>
          )}
        </div>

        {/* Actions - Right */}
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          {/* Theme Controls - Desktop */}
          <div className="hidden sm:flex items-center gap-1 rounded-lg bg-muted/50 p-1">
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
                <p className="text-xs font-medium text-muted-foreground mb-2">{t.nav.themeColor}</p>
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

            <div className="w-px h-4 bg-border" />

            <LanguageSwitcher />
          </div>

          {/* Mobile Theme Toggle */}
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" onClick={toggleMode}>
            {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Cart */}
          <CartDrawer />

          {/* Support - Desktop only */}
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

          {/* Messages - Desktop only */}
          {user && (
            <Link to="/inbox" className="relative hidden sm:block">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MessageCircle className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Button onClick={signOut} variant="outline" size="sm" className="text-sm">
                {t.nav.signOut}
              </Button>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-sm">{t.nav.becomeSeller}</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero" size="sm" className="text-sm">{t.nav.signIn}</Button>
                </Link>
              </>
            )}
            {/* Become seller button only for buyers */}
            {user && role === 'buyer' && (
              <Link to="/become-seller">
                <Button variant="ghost" size="sm" className="text-sm">{t.nav.becomeSeller}</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-2 mt-8">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">{t.nav.navigation}</p>
                
                <Link to="/" onClick={closeMobileMenu}>
                  <Button variant="ghost" className="w-full justify-start gap-3 text-base h-11">
                    <Home className="h-5 w-5" />
                    {t.nav.home}
                  </Button>
                </Link>
                
                {user && (
                  <>
                    {role === 'seller' && (
                      <>
                        <Link to="/seller" onClick={closeMobileMenu}>
                          <Button variant="ghost" className="w-full justify-start gap-3 text-base h-11">
                            <LayoutDashboard className="h-5 w-5" />
                            {t.nav.dashboard}
                          </Button>
                        </Link>
                        <Link to="/my-profile" onClick={closeMobileMenu}>
                          <Button variant="ghost" className="w-full justify-start gap-3 text-base h-11">
                            <User className="h-5 w-5" />
                            {t.nav.profile}
                          </Button>
                        </Link>
                      </>
                    )}
                    
                    {role === 'admin' && (
                      <>
                        <Link to="/admin" onClick={closeMobileMenu} className="relative">
                          <Button variant="ghost" className="w-full justify-start gap-3 text-base h-11">
                            <Shield className="h-5 w-5" />
                            {t.nav.admin}
                            {openTicketsCount > 0 && (
                              <span className="ml-auto px-2 py-0.5 bg-destructive text-destructive-foreground text-xs rounded-full animate-pulse">
                                {openTicketsCount}
                              </span>
                            )}
                          </Button>
                        </Link>
                        <Link to="/my-profile" onClick={closeMobileMenu}>
                          <Button variant="ghost" className="w-full justify-start gap-3 text-base h-11">
                            <User className="h-5 w-5" />
                            {t.nav.profile}
                          </Button>
                        </Link>
                      </>
                    )}
                    
                    {role === 'buyer' && (
                      <>
                        <Link to="/user" onClick={closeMobileMenu}>
                          <Button variant="ghost" className="w-full justify-start gap-3 text-base h-11">
                            <Heart className="h-5 w-5" />
                            {t.nav.mySpace}
                          </Button>
                        </Link>
                        <Link to="/become-seller" onClick={closeMobileMenu}>
                          <Button variant="ghost" className="w-full justify-start gap-3 text-base h-11">
                            <Store className="h-5 w-5" />
                            {t.nav.becomeSeller}
                          </Button>
                        </Link>
                      </>
                    )}

                    <Link to="/inbox" onClick={closeMobileMenu}>
                      <Button variant="ghost" className="w-full justify-start gap-3 text-base h-11">
                        <MessageCircle className="h-5 w-5" />
                        {t.nav.messages}
                        {unreadCount > 0 && (
                          <span className="ml-auto px-2 py-0.5 bg-destructive text-destructive-foreground text-xs rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </Button>
                    </Link>

                    <SupportDialog
                      trigger={
                        <Button variant="ghost" className="w-full justify-start gap-3 text-base h-11">
                          <HelpCircle className="h-5 w-5" />
                          {t.nav.support}
                        </Button>
                      }
                    />
                  </>
                )}

                <div className="border-t pt-4 mt-4">
                  {user ? (
                    <Button onClick={() => { signOut(); closeMobileMenu(); }} variant="outline" className="w-full gap-3 h-11">
                      <LogOut className="h-5 w-5" />
                      {t.nav.signOut}
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link to="/auth" onClick={closeMobileMenu}>
                        <Button variant="ghost" className="w-full gap-3 h-11">
                          <Store className="h-5 w-5" />
                          {t.nav.becomeSeller}
                        </Button>
                      </Link>
                      <Link to="/auth" onClick={closeMobileMenu}>
                        <Button variant="hero" className="w-full gap-3 h-11">
                          <LogIn className="h-5 w-5" />
                          {t.nav.signIn}
                        </Button>
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
