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
  const heroRef = useRef<HTMLDivElement>(null);
  
  const { currentTheme, themes, setTheme } = useTheme();

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

  return (
    <div className="min-h-screen bg-animated-fade">
      <BrandNavbar />
      <main className="">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto text-center px-4 sm:px-0" style={{width: '90%', padding: '6% 0'}}>
            <div 
              ref={heroRef}
              className="rounded-2xl sm:rounded-3xl relative border border-white/20 overflow-hidden p-6 sm:p-8 md:p-[10%]" 
              style={{
                background: `linear-gradient(135deg, 
                  hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness + 15}% / 0.7) 0%, 
                  hsl(${(currentTheme.hue + 40) % 360} ${currentTheme.saturation}% ${currentTheme.lightness + 10}% / 0.8) 50%,
                  hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness + 15}% / 0.7) 100%)`,
                boxShadow: `0 8px 32px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.25),
                            inset 0 0 60px hsl(0 0% 100% / 0.15)`,
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Animated particles */}
              <ParticlesBackground 
                particleCount={60} 
                color="rgb(255, 255, 255)" 
              />

              {/* Color Theme Picker - Intuitive Swatches */}
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1 sm:gap-2 bg-white/20 hover:bg-white/30 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-full backdrop-blur transition-all border border-white/30 group z-10"
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
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="px-4 md:px-8 -mt-6 relative z-10">
          <div className="mx-auto max-w-[90%] bg-card/95 backdrop-blur-md rounded-2xl border border-border shadow-lg p-4 md:p-6">
            <div className="flex flex-col gap-4">
              {/* Categories - Pill Style */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">Categories</span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleCategory(c)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all border ${
                        selected.has(c)
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Price and Sort */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 pt-2 border-t border-border">
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium">Max price: <span className="text-primary font-semibold">€{maxPrice}</span></Label>
                  <Slider 
                    value={[maxPrice]} 
                    min={20} 
                    max={500} 
                    step={5} 
                    onValueChange={(v) => setMaxPrice(v[0] ?? 300)}
                    className="py-2"
                  />
                </div>
                <div className="w-full md:w-48 space-y-2">
                  <Label className="text-sm font-medium">Sort by</Label>
                  <Select value={sort} onValueChange={(v: Sort) => setSort(v)}>
                    <SelectTrigger className="bg-background border-border">
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
        <section className="px-4 sm:px-6 py-6 sm:py-8">
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