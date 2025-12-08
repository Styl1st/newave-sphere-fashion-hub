import BrandNavbar from "@/components/BrandNavbar";
import ParticlesBackground from "@/components/ParticlesBackground";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProductCard, type Product } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Palette, Check } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

import logoTransparent from "@/assets/newave/logo_transparent.png";
import { useMemo, useState, useEffect, useRef } from "react";

const CATEGORIES = ["Chaussures", "Sweats", "Vestes", "Pantalons", "T-shirts", "Sous-vêtements", "Accessoires", "Robes", "Jupes"] as const;

type Category = typeof CATEGORIES[number];

type Sort = "relevance" | "price_asc" | "price_desc";

const Index = () => {
  const [selected, setSelected] = useState<Set<Category>>(new Set());
  const [maxPrice, setMaxPrice] = useState<number>(300);
  const [sort, setSort] = useState<Sort>("relevance");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isExpanding, setIsExpanding] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [heroInitialPos, setHeroInitialPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  
  const { currentTheme, themes, setTheme } = useTheme();

  // Animate expansion when isExpanding changes
  useEffect(() => {
    if (isExpanding && heroRef.current && heroInitialPos) {
      // Start from captured position, then expand to fullscreen
      heroRef.current.style.position = 'fixed';
      heroRef.current.style.top = `${heroInitialPos.top}px`;
      heroRef.current.style.left = `${heroInitialPos.left}px`;
      heroRef.current.style.width = `${heroInitialPos.width}px`;
      heroRef.current.style.height = `${heroInitialPos.height}px`;
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (heroRef.current) {
            heroRef.current.style.top = '0';
            heroRef.current.style.left = '0';
            heroRef.current.style.width = '100vw';
            heroRef.current.style.height = '100vh';
            heroRef.current.style.borderRadius = '0';
          }
        });
      });
    } else if (!isExpanding && heroRef.current && heroInitialPos) {
      // Collapse back to initial position
      heroRef.current.style.top = `${heroInitialPos.top}px`;
      heroRef.current.style.left = `${heroInitialPos.left}px`;
      heroRef.current.style.width = `${heroInitialPos.width}px`;
      heroRef.current.style.height = `${heroInitialPos.height}px`;
      heroRef.current.style.borderRadius = '1.5rem';
      
      // After collapse animation, switch back to relative
      setTimeout(() => {
        if (heroRef.current) {
          heroRef.current.style.position = '';
          heroRef.current.style.top = '';
          heroRef.current.style.left = '';
          heroRef.current.style.width = '';
          heroRef.current.style.height = '';
          heroRef.current.style.borderRadius = '';
        }
        setHeroInitialPos(null);
      }, 1500);
    }
  }, [isExpanding, heroInitialPos, isClosing]);

  // Handle closing animation
  useEffect(() => {
    if (isClosing && heroRef.current && heroInitialPos) {
      // Animate back to original position
      heroRef.current.style.top = `${heroInitialPos.top}px`;
      heroRef.current.style.left = `${heroInitialPos.left}px`;
      heroRef.current.style.width = `${heroInitialPos.width}px`;
      heroRef.current.style.height = `${heroInitialPos.height}px`;
      heroRef.current.style.borderRadius = '1.5rem';
      
      // Wait for transition to complete before resetting
      const timeout = setTimeout(() => {
        setIsExpanding(false);
        setIsClosing(false);
        setHeroInitialPos(null);
      }, 800);
      
      return () => clearTimeout(timeout);
    }
  }, [isClosing, heroInitialPos]);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
      
      const transformedProducts: Product[] = (data || []).map(product => ({
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
    let list = products.filter(p => p.price <= maxPrice);
    if (selected.size > 0) {
      list = list.filter(p => selected.has(p.category as Category));
    }
    if (sort === "price_asc") list = [...list].sort((a,b) => a.price - b.price);
    if (sort === "price_desc") list = [...list].sort((a,b) => b.price - a.price);
    return list;
  }, [products, selected, maxPrice, sort]);

  const toggleCategory = (c: Category) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  };

  // Generate hero style based on current theme - matches background with slight contrast
  const heroStyle = {
    padding: isExpanding ? '15%' : '12%',
    background: `linear-gradient(135deg, 
      hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness + 15}% / ${isExpanding ? '1' : '0.7'}) 0%, 
      hsl(${(currentTheme.hue + 40) % 360} ${currentTheme.saturation}% ${currentTheme.lightness + 10}% / ${isExpanding ? '1' : '0.8'}) 50%,
      hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness + 15}% / ${isExpanding ? '1' : '0.7'}) 100%)`,
    boxShadow: `0 0 2.6vw hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.45),
                0 0 4.2vw hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.3),
                inset 0 0 60px hsl(0 0% 100% / 0.18)`,
    backdropFilter: 'blur(12px)',
    transition: 'all 1.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
  };

  const handleHeroClick = () => {
    if (!isExpanding && heroRef.current) {
      // Capture exact position and dimensions before expanding
      const rect = heroRef.current.getBoundingClientRect();
      setHeroInitialPos({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      setIsExpanding(true);
    } else {
      // Collapse back to initial position
      setIsExpanding(false);
    }
  };

  return (
    <div className="min-h-screen bg-animated-fade">
      <BrandNavbar />
      <main className="">
        {/* Hero */}
        <section className="relative overflow-hidden" style={{minHeight: '100vh'}}>
          <div className="mx-auto text-center px-4 sm:px-0 flex items-center justify-center" style={{width: '100%', height: '100vh', padding: '5vh 0'}}>
            <div 
              ref={heroRef}
              className="relative rounded-3xl border border-white/20 overflow-hidden cursor-pointer"
              style={{
                ...heroStyle,
                width: '90%',
                height: 'auto',
              }}
              onClick={handleHeroClick}
              onMouseEnter={(e) => {
                if (!isExpanding) {
                  e.currentTarget.style.transform = 'scale(1.01)';
                  e.currentTarget.style.boxShadow = `0 0 3vw hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.5), 0 0 5vw hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.35), inset 0 0 70px hsl(0 0% 100% / 0.2)`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isExpanding) {
                  e.currentTarget.style.transform = 'scale(1)';
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
                      style={{ backgroundColor: `hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}%)` }}
                    />
                    <span className="text-xs sm:text-sm font-medium hidden sm:inline">{currentTheme.name}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 bg-card border shadow-lg z-50" align="end">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Choose your theme</p>
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
                                ? 'border-foreground scale-110 shadow-lg' 
                                : 'border-transparent hover:scale-105 hover:border-muted-foreground/50'
                            }`}
                            style={{ backgroundColor: `hsl(${theme.hue} ${theme.saturation}% ${theme.lightness}%)` }}
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
                  transition: 'transform 0.1s linear',
                }}
              >
                <h1 
                  className="flex flex-col sm:flex-row font-semibold tracking-tight justify-center items-center text-white drop-shadow-md animate-fade-in text-xl sm:text-2xl md:text-3xl lg:text-4xl gap-2 sm:gap-4"
                  style={{
                    animationDelay: '0.1s',
                    animationFillMode: 'both',
                  }}
                >
                  <img 
                    src={logoTransparent} 
                    alt="logo" 
                    className="flex items-center invert h-8 sm:h-10 md:h-12 lg:h-16"
                  />
                  <span>Independent Fashion Marketplace</span>
                </h1>
                
                <div 
                  style={{
                    opacity: isExpanding ? 0 : 1,
                    maxHeight: isExpanding ? 0 : '500px',
                    overflow: 'hidden',
                    transition: 'opacity 0.6s ease, max-height 0.6s ease',
                  }}
                >
                  <p 
                    className="mx-auto text-white/85 drop-shadow-sm animate-fade-in mt-4 sm:mt-6 text-sm sm:text-base md:text-lg max-w-[90%] sm:max-w-[80%]" 
                    style={{
                      animationDelay: '0.3s',
                      animationFillMode: 'both',
                    }}
                  >
                    Discover streetwear, denim, grunge, goth and more from emerging brands. Curated pieces, community-first.
                  </p>
                  <div 
                    className="flex flex-col sm:flex-row justify-center animate-fade-in mt-6 sm:mt-8 gap-3 sm:gap-4" 
                    style={{
                      animationDelay: '0.5s',
                      animationFillMode: 'both',
                    }}
                  >
                    <Button variant="hero" size="lg" className="hover:scale-105 transition-transform">
                      Explore drops
                    </Button>
                    <a href="/auth">
                      <Button variant="secondary" size="lg" className="hover:scale-105 transition-transform w-full sm:w-auto">
                        Become a seller
                      </Button>
                    </a>
                  </div>
                </div>

                <div 
                  style={{
                    opacity: isExpanding ? 1 : 0,
                    maxHeight: isExpanding ? '1000px' : '0',
                    overflow: 'hidden',
                    transition: 'opacity 0.8s ease 0.4s, max-height 0.8s ease 0.4s',
                  }}
                >
                  <div className="text-white max-w-4xl mx-auto mt-8">
                    <div className="space-y-6 text-lg sm:text-xl leading-relaxed">
                      <p>
                        <strong>Newave</strong> is an independent fashion marketplace dedicated to connecting emerging brands with a community that values authenticity, creativity, and self-expression.
                      </p>
                      <p>
                        We curate a diverse range of styles—from streetwear and denim to grunge, goth, and everything in between. Our platform empowers independent designers and sellers to showcase their unique pieces directly to fashion enthusiasts who appreciate quality and individuality.
                      </p>
                      <p>
                        At Newave, we believe fashion is more than just clothing—it's a form of art, a statement, and a way to build community. We're committed to fostering a space where creativity thrives and where every piece tells a story.
                      </p>
                      <p className="text-center pt-6 text-white/80">
                        Join us in redefining fashion, one drop at a time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section id="filters" style={{padding: '0 4%', marginTop: isExpanding ? '0' : '-3%', position: 'relative', zIndex: 10, display: isExpanding ? 'none' : 'block', scrollMarginTop: '2rem'}}>
          <div
            className="mx-auto max-w-[95%] sm:max-w-[90%] bg-card/95 backdrop-blur-md rounded-2xl border shadow-lg p-4 sm:p-6 lg:p-8"
            style={{
              borderColor: `hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.25)`,
              boxShadow: `0 0 20px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.45), 0 0 40px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.3)`,
              transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 25px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.55), 0 0 50px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.38)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.45), 0 0 40px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.3)`;
            }}
          >
            <div className="flex flex-col gap-4 sm:gap-6">
              {/* Categories - Pill Style */}
              <div>
                <span className="font-medium text-foreground text-sm sm:text-base">Categories</span>
                <div className="flex flex-wrap gap-2 sm:gap-3 mt-3">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleCategory(c)}
                      className={`rounded-full transition-all border text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 ${
                        selected.has(c)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                      }`}
                      style={{
                        boxShadow: selected.has(c)
                          ? `0 0 15px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.55), 0 0 25px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.35)`
                          : `0 0 8px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.25)`,
                        transform: selected.has(c) ? 'translateY(-1px)' : 'none',
                        transition: 'box-shadow 0.25s ease, transform 0.2s ease, background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 18px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.6), 0 0 30px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.4)`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = selected.has(c)
                          ? `0 0 15px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.55), 0 0 25px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.35)`
                          : `0 0 8px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.25)`;
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Price and Sort */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 border-t border-border pt-4 sm:pt-6">
                <div className="flex-1">
                  <Label className="font-medium text-sm sm:text-base">Max price: <span className="text-primary font-semibold">€{maxPrice}</span></Label>
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
                  <Label className="font-medium text-sm sm:text-base">Sort by</Label>
                  <Select value={sort} onValueChange={(v: Sort) => setSort(v)}>
                    <SelectTrigger className="bg-background border-border mt-2">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border shadow-lg z-50">
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="price_asc">Price: Low to High</SelectItem>
                      <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="px-4 sm:px-6 py-6 sm:py-8" style={{display: isExpanding ? 'none' : 'block'}}>
          <div className="mx-auto max-w-[95%] sm:max-w-[90%]">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm sm:text-base">Chargement des produits...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm sm:text-base">
                  {products.length === 0 
                    ? "No products available at the moment." 
                    : "No products match your search criteria."
                  }
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