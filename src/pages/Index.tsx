import BrandNavbar from "@/components/BrandNavbar";
import ProductMarquee from "@/components/ProductMarquee";
import ParticlesBackground from "@/components/ParticlesBackground";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProductCard, type Product } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Palette, Check } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useI18n } from "@/hooks/useI18n";

import logoTransparent from "@/assets/newave/logo_transparent.png";
import { useMemo, useState, useEffect, useRef } from "react";

const CATEGORY_KEYS = [
  "shoes",
  "sweaters",
  "jackets",
  "pants",
  "tshirts",
  "underwear",
  "accessories",
  "dresses",
  "skirts",
] as const;

type CategoryKey = (typeof CATEGORY_KEYS)[number];

type Sort = "relevance" | "price_asc" | "price_desc";

const Index = () => {
  const [selected, setSelected] = useState<Set<CategoryKey>>(new Set());
  const [maxPrice, setMaxPrice] = useState<number>(300);
  const [sort, setSort] = useState<Sort>("relevance");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isExpanding, setIsExpanding] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isTextFading, setIsTextFading] = useState(false);
  const [heroInitialPos, setHeroInitialPos] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { currentTheme, themes, setTheme } = useTheme();
  const { user } = useAuth();
  const { role } = useRole();
  const { t } = useI18n();

  // Map category keys to translated names for filtering
  const categoryKeyToDb: Record<CategoryKey, string> = {
    shoes: "Chaussures",
    sweaters: "Sweats",
    jackets: "Vestes",
    pants: "Pantalons",
    tshirts: "T-shirts",
    underwear: "Sous-vêtements",
    accessories: "Accessoires",
    dresses: "Robes",
    skirts: "Jupes",
  };
  // Single unified animation controller for open/close
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || !heroInitialPos) return;

    const DURATION = 700;
    const EASING = 'cubic-bezier(0.22, 0.9, 0.2, 1)';
    const transition = `top ${DURATION}ms ${EASING}, left ${DURATION}ms ${EASING}, width ${DURATION}ms ${EASING}, height ${DURATION}ms ${EASING}, border-radius ${Math.round(DURATION * 0.9)}ms ${EASING}`;

    // Compute viewport coords from stored page coords
    const viewportTop = heroInitialPos.top - window.scrollY;
    const viewportLeft = heroInitialPos.left - window.scrollX;

    if (isExpanding && !isClosing) {
      // Set element to fixed at its current viewport rect
      hero.style.position = 'fixed';
      hero.style.top = `${viewportTop}px`;
      hero.style.left = `${viewportLeft}px`;
      hero.style.width = `${heroInitialPos.width}px`;
      hero.style.height = `${heroInitialPos.height}px`;
      hero.style.borderRadius = '1.5rem';
      hero.style.overflow = 'hidden';
      hero.style.willChange = 'top, left, width, height, border-radius';
      hero.style.zIndex = '50';
      hero.style.transition = transition;

      // Force layout then animate to fullscreen
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          hero.style.top = '0';
          hero.style.left = '0';
          hero.style.width = '100vw';
          hero.style.height = '100vh';
          hero.style.borderRadius = '0';
        });
      });
      return;
    }

    if (isClosing) {
      let cleaned = false;

      // Recompute target position for closing
      const targetTop = heroInitialPos.top - window.scrollY;
      const targetLeft = heroInitialPos.left - window.scrollX;

      hero.style.transition = transition;

      // Animate back to original rect
      requestAnimationFrame(() => {
        hero.style.top = `${targetTop}px`;
        hero.style.left = `${targetLeft}px`;
        hero.style.width = `${heroInitialPos.width}px`;
        hero.style.height = `${heroInitialPos.height}px`;
        hero.style.borderRadius = '1.5rem';
      });

      const handleTransitionEnd = (e: TransitionEvent) => {
        if (e.target !== hero) return;
        if (e.propertyName !== 'width' && e.propertyName !== 'height') return;
        if (cleaned) return;
        cleaned = true;

        hero.removeEventListener('transitionend', handleTransitionEnd);

        // CRITICAL: Wait 2 frames before resetting layout to prevent jump
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Disable all transitions during reset
            hero.style.transition = 'none';
            // Force reflow
            void hero.offsetHeight;

            // Clear all inline positioning styles
            hero.style.position = '';
            hero.style.zIndex = '';
            hero.style.top = '';
            hero.style.left = '';
            hero.style.width = '';
            hero.style.height = '';
            hero.style.borderRadius = '';
            hero.style.overflow = '';
            hero.style.willChange = '';
            hero.style.transform = '';
            hero.style.boxShadow = '';

            // Force reflow again
            void hero.offsetHeight;

            // Restore transitions
            hero.style.transition = '';

            // Update state after layout is stable
            setIsExpanding(false);
            setIsClosing(false);
            setIsTextFading(false);
            setHeroInitialPos(null);
          });
        });
      };

      hero.addEventListener('transitionend', handleTransitionEnd);

      // Fallback timeout
      const fallback = window.setTimeout(() => {
        if (!cleaned) {
          handleTransitionEnd({ target: hero, propertyName: 'width' } as unknown as TransitionEvent);
        }
      }, DURATION + 300);

      return () => {
        window.clearTimeout(fallback);
        hero.removeEventListener('transitionend', handleTransitionEnd);
      };
    }
  }, [isExpanding, isClosing, heroInitialPos]);

  // (closing animation now handled in unified controller above)

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        setMousePos({ x, y });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformedProducts: Product[] = (data || []).map((product) => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: Number(product.price),
        image: product.images?.[0] || "/placeholder.svg",
      }));

      setProducts(transformedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.price <= maxPrice);
    if (selected.size > 0) {
      // Convert selected category keys to DB category names for filtering
      const selectedDbCategories = Array.from(selected).map(
        (key) => categoryKeyToDb[key]
      );
      list = list.filter((p) => selectedDbCategories.includes(p.category));
    }
    if (sort === "price_asc")
      list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price_desc")
      list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, selected, maxPrice, sort, categoryKeyToDb]);

  const toggleCategory = (c: CategoryKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  // Generate hero style based on current theme - matches background with slight contrast
  // CRITICAL: Keep padding constant during closing to prevent layout jump
  const isAnimating = isExpanding || isClosing;
  const heroStyle = {
    padding: isExpanding && !isClosing ? "8% 15%" : "12%",
    background: `linear-gradient(135deg, 
      hsl(${currentTheme.hue} ${currentTheme.saturation}% ${
      currentTheme.lightness + 15
    }% / ${isExpanding && !isClosing ? "1" : "0.7"}) 0%, 
      hsl(${(currentTheme.hue + 40) % 360} ${currentTheme.saturation}% ${
      currentTheme.lightness + 10
    }% / ${isExpanding && !isClosing ? "1" : "0.8"}) 50%,
      hsl(${currentTheme.hue} ${currentTheme.saturation}% ${
      currentTheme.lightness + 15
    }% / ${isExpanding && !isClosing ? "1" : "0.7"}) 100%)`,
    boxShadow: isExpanding && !isClosing
      ? "none"
      : `0 0 2.6vw hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.45),
                0 0 4.2vw hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.3),
                inset 0 0 60px hsl(0 0% 100% / 0.18)`,
    backdropFilter: "blur(12px)",
  };

  const handleHeroClick = () => {
    if (!isExpanding && heroRef.current) {
      const rect = heroRef.current.getBoundingClientRect();
      // store page coordinates so closing target is correct even after page scroll
      setHeroInitialPos({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
      setIsExpanding(true);
      setIsTextFading(false);
    } else if (isExpanding && !isTextFading && !isClosing) {
      // First fade out the text, then start closing
      setIsTextFading(true);
    }
  };

  // When text fade completes, start closing the hero
  useEffect(() => {
    if (!isTextFading) return;
    
    const fadeTimer = setTimeout(() => {
      setIsClosing(true);
    }, 300); // Match the text fade duration
    
    return () => clearTimeout(fadeTimer);
  }, [isTextFading]);

  return (
    <div className="min-h-screen bg-animated-fade">
      <BrandNavbar />
      <main className="">
        {/* Hero */}
        <section
          className="relative overflow-hidden"
          style={{ minHeight: "100vh" }}
        >
          <div
            className="mx-auto text-center px-4 sm:px-0 flex items-center justify-center"
            style={{ width: "100%", height: "100vh", padding: "5vh 0" }}
          >
            <div
              ref={heroRef}
              className="relative rounded-3xl border border-white/20 overflow-hidden cursor-pointer w-[90%]"
              style={{
                ...heroStyle,
              }}
              onClick={handleHeroClick}
              onMouseEnter={(e) => {
                if (!isExpanding) {
                  e.currentTarget.style.transform = "scale(1.01)";
                  e.currentTarget.style.boxShadow = `0 0 3vw hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.5), 0 0 5vw hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.35), inset 0 0 70px hsl(0 0% 100% / 0.2)`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isExpanding) {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = `0 0 2.6vw hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.45), 0 0 4.2vw hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.3), inset 0 0 60px hsl(0 0% 100% / 0.18)`;
                }
              }}
            >
              {/* Animated particles */}
              <ParticlesBackground
                particleCount={60}
                color="rgb(255, 255, 255)"
              />

              {/* Color Theme Picker - Intuitive Swatches */}
              {!isExpanding && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1 sm:gap-2 bg-white/20 hover:bg-white/30 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-full backdrop-blur transition-all border border-white/30 group z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Palette className="w-3 h-3 sm:w-4 sm:h-4" />
                      <div
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white/50 shadow-sm"
                        style={{
                          backgroundColor: `hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}%)`,
                        }}
                      />
                      <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                        {currentTheme.name}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-64 p-4 bg-card border shadow-lg z-50"
                    align="end"
                  >
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground">
                        Choose your theme
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {themes.map((theme) => (
                          <button
                            key={theme.name}
                            onClick={() => setTheme(theme)}
                            className="relative group flex flex-col items-center gap-1"
                            title={theme.name}
                          >
                            <div
                              className={`w-10 h-10 rounded-full transition-all border-2 ${
                                currentTheme.name === theme.name
                                  ? "border-foreground scale-110 shadow-lg"
                                  : "border-transparent hover:scale-105 hover:border-muted-foreground/50"
                              }`}
                              style={{
                                backgroundColor: `hsl(${theme.hue} ${theme.saturation}% ${theme.lightness}%)`,
                              }}
                            >
                              {currentTheme.name === theme.name && (
                                <Check className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[48px]">
                              {theme.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Animated content with staggered entrance */}
              <div
                className="relative z-10"
                style={{
                  transform: `translateY(${scrollY * -0.1}px)`,
                  transition: "transform 0.1s linear",
                }}
              >
                <h1
                  className="flex flex-col sm:flex-row font-semibold tracking-tight justify-center items-center text-white drop-shadow-md animate-fade-in text-xl sm:text-2xl md:text-3xl lg:text-4xl gap-2 sm:gap-4"
                  style={{
                    animationDelay: "0.1s",
                    animationFillMode: "both",
                  }}
                >
                  <img
                    src={logoTransparent}
                    alt="logo"
                    className="flex items-center invert h-8 sm:h-10 md:h-12 lg:h-16"
                  />
                  <span>{t.home.heroTitle}</span>
                </h1>

                <div
                  style={{
                    opacity: isExpanding || isClosing ? 0 : 1,
                    maxHeight: isExpanding || isClosing ? "0" : "500px",
                    overflow: "hidden",
                    transition: isExpanding || isClosing
                      ? "opacity 0.2s ease-out, max-height 0.25s ease-out"
                      : "opacity 0.3s ease-in 0.1s, max-height 0.35s ease-in",
                  }}
                >
                  <p
                    className="mx-auto text-white/85 drop-shadow-sm animate-fade-in mt-4 sm:mt-6 text-sm sm:text-base md:text-lg max-w-[90%] sm:max-w-[80%]"
                    style={{
                      animationDelay: "0.3s",
                      animationFillMode: "both",
                    }}
                  >
                    {t.home.heroSubtitle}
                  </p>
                  <div
                    className="flex flex-col sm:flex-row justify-center animate-fade-in mt-6 sm:mt-8 gap-3 sm:gap-4"
                    style={{
                      animationDelay: "0.5s",
                      animationFillMode: "both",
                    }}
                  >
                    <Button
                      variant="hero"
                      size="lg"
                      className="hover:scale-105 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById("filters")?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                    >
                      {t.home.exploreDrops}
                    </Button>
                    {/* Show become seller only if not logged in or if buyer */}
                    {(!user || role === "buyer") && (
                      <a href={user ? "/become-seller" : "/auth"}>
                        <Button
                          variant="secondary"
                          size="lg"
                          className="hover:scale-105 transition-transform w-full sm:w-auto"
                        >
                          {t.home.becomeSeller}
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    opacity: isExpanding && !isTextFading ? 1 : 0,
                    maxHeight: isExpanding && !isTextFading ? "1000px" : "0",
                    overflow: isExpanding && !isTextFading ? "auto" : "hidden",
                    transition: isTextFading
                      ? "opacity 0.25s ease-out, max-height 0.3s ease-out"
                      : isExpanding
                        ? "opacity 0.5s ease-in 0.3s, max-height 0.6s ease-in 0.2s"
                        : "opacity 0.2s ease-out, max-height 0.3s ease-out",
                  }}
                >
                  <div className="text-white max-w-4xl mx-auto mt-8">
                    <div className="space-y-6 text-lg sm:text-xl leading-relaxed">
                      <p>{t.home.aboutText1}</p>
                      <p>{t.home.aboutText2}</p>
                      <p>{t.home.aboutText3}</p>
                      <p className="text-center pt-6 text-white/80">
                        {t.home.aboutText4}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Marquee */}
        {!isExpanding && <ProductMarquee />}

        {/* Filters */}
        <section
          id="filters"
          style={{
            padding: "0 4%",
            marginTop: "2rem",
            position: "relative",
            zIndex: 5,
            display: isExpanding ? "none" : "block",
            scrollMarginTop: "2rem",
          }}
        >
          <div
            className="mx-auto max-w-[95%] sm:max-w-[90%] bg-card/95 backdrop-blur-md rounded-2xl border shadow-lg p-4 sm:p-6 lg:p-8"
            style={{
              borderColor: `hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.25)`,
              boxShadow: `0 0 20px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.45), 0 0 40px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.3)`,
              transition: "box-shadow 0.3s ease, border-color 0.3s ease",
            }}
            onMouseEnter={(e) => {
              (
                e.currentTarget as HTMLDivElement
              ).style.boxShadow = `0 0 25px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.55), 0 0 50px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.38)`;
            }}
            onMouseLeave={(e) => {
              (
                e.currentTarget as HTMLDivElement
              ).style.boxShadow = `0 0 20px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.45), 0 0 40px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.3)`;
            }}
          >
            <div className="flex flex-col gap-4 sm:gap-6">
              {/* Categories - Pill Style */}
              <div>
                <span className="font-medium text-foreground text-sm sm:text-base">
                  {t.filters.categories}
                </span>
                <div className="flex flex-wrap gap-2 sm:gap-3 mt-3">
                  {CATEGORY_KEYS.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleCategory(c)}
                      className={`rounded-full transition-all border text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 ${
                        selected.has(c)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                      }`}
                      style={{
                        boxShadow: selected.has(c)
                          ? `0 0 15px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.55), 0 0 25px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.35)`
                          : `0 0 8px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.25)`,
                        transform: selected.has(c)
                          ? "translateY(-1px)"
                          : "none",
                        transition:
                          "box-shadow 0.25s ease, transform 0.2s ease, background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.boxShadow = `0 0 18px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.6), 0 0 30px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.4)`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.boxShadow =
                          selected.has(c)
                            ? `0 0 15px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.55), 0 0 25px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.35)`
                            : `0 0 8px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.25)`;
                      }}
                    >
                      {t.categories[c]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price and Sort */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 border-t border-border pt-4 sm:pt-6">
                <div className="flex-1">
                  <Label className="font-medium text-sm sm:text-base">
                    {t.filters.maxPrice}:{" "}
                    <span className="text-primary font-semibold">
                      €{maxPrice}
                    </span>
                  </Label>
                  <Slider
                    value={[maxPrice]}
                    min={20}
                    max={500}
                    step={5}
                    onValueChange={(v) => setMaxPrice(v[0] ?? 300)}
                    className="glow-slider mt-3"
                  />
                </div>
                <div className="w-full sm:w-48 lg:w-56">
                  <Label className="font-medium text-sm sm:text-base">
                    {t.filters.sortBy}
                  </Label>
                  <Select value={sort} onValueChange={(v: Sort) => setSort(v)}>
                    <SelectTrigger className="bg-background border-border mt-2">
                      <SelectValue placeholder={t.filters.sortBy} />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border shadow-lg z-50">
                      <SelectItem value="relevance">
                        {t.filters.relevance}
                      </SelectItem>
                      <SelectItem value="price_asc">
                        {t.filters.priceLowHigh}
                      </SelectItem>
                      <SelectItem value="price_desc">
                        {t.filters.priceHighLow}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section
          className="px-4 sm:px-6 py-6 sm:py-8"
          style={{ display: isExpanding ? "none" : "block" }}
        >
          <div className="mx-auto max-w-[95%] sm:max-w-[90%]">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm sm:text-base">
                  {t.home.loadingProducts}
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm sm:text-base">
                  {products.length === 0
                    ? t.home.noProductsAvailable
                    : t.home.noProductsMatch}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
