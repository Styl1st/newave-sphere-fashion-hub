import BrandNavbar from "@/components/BrandNavbar";
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
import { useMemo, useState, useEffect } from "react";

const CATEGORIES = ["Chaussures", "Sweats", "Vestes", "Pantalons", "T-shirts", "Sous-vêtements", "Accessoires", "Robes", "Jupes"] as const;

type Category = typeof CATEGORIES[number];

type Sort = "relevance" | "price_asc" | "price_desc";

const Index = () => {
  const [selected, setSelected] = useState<Set<Category>>(new Set());
  const [maxPrice, setMaxPrice] = useState<number>(300);
  const [sort, setSort] = useState<Sort>("relevance");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { currentTheme, themes, nextTheme, setTheme } = useTheme();

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
      
      // Transform database products to match ProductCard type
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
    padding: '10%',
    background: `linear-gradient(135deg, 
      hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness + 15}% / 0.7) 0%, 
      hsl(${(currentTheme.hue + 40) % 360} ${currentTheme.saturation}% ${currentTheme.lightness + 10}% / 0.8) 50%,
      hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness + 15}% / 0.7) 100%)`,
    boxShadow: `0 8px 32px hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}% / 0.25),
                inset 0 0 60px hsl(0 0% 100% / 0.15)`,
    backdropFilter: 'blur(12px)',
  };

  return (
    <div className="min-h-screen bg-animated-fade">
      <BrandNavbar />
      <main className="">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto text-center" style={{width: '90%', padding: '10% 0'}}>
            <div className="rounded-3xl relative border border-white/20" style={heroStyle}>
              {/* Color Theme Picker - Intuitive Swatches */}
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    className="absolute top-4 right-4 flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-full backdrop-blur transition-all border border-white/30 group"
                  >
                    <Palette className="w-4 h-4" />
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-white/50 shadow-sm"
                      style={{ backgroundColor: `hsl(${currentTheme.hue} ${currentTheme.saturation}% ${currentTheme.lightness}%)` }}
                    />
                    <span className="text-sm font-medium">{currentTheme.name}</span>
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
              
              <h1 className="flex font-semibold tracking-tight justify-center text-white drop-shadow-md" style={{fontSize: '2.5vw', gap: '2%'}}>
                <img src={logoTransparent} alt="logo" className="flex items-center invert" style={{height: '4vw', maxHeight: '80px'}} />
                Independent Fashion Marketplace
              </h1>
              <p className="mx-auto text-white/85 drop-shadow-sm" style={{marginTop: '3%', fontSize: '1.2vw', maxWidth: '80%'}}>
                Discover streetwear, denim, grunge, goth and more from emerging brands. Curated pieces, community-first.
              </p>
              <div className="flex justify-center" style={{marginTop: '5%', gap: '2%'}}>
                <Button variant="hero" size="lg">Explore drops</Button>
                <a href="/auth">
                  <Button variant="secondary" size="lg">Become a seller</Button>
                </a>
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
        <section style={{padding: '3% 4%'}}>
          <div className="mx-auto" style={{maxWidth: '90%'}}>
            {loading ? (
              <div className="text-center" style={{padding: '5% 0'}}>
                <p className="text-muted-foreground" style={{fontSize: '1vw'}}>Chargement des produits...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center" style={{padding: '5% 0'}}>
                <p className="text-muted-foreground" style={{fontSize: '1vw'}}>
                  {products.length === 0 
                    ? "No products available at the moment." 
                    : "No products match your search criteria."
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{gap: '2%'}}>
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