import BrandNavbar from "@/components/BrandNavbar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard, type Product } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";

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
  const [gradientIndex, setGradientIndex] = useState(0);

  const gradients = [
    {
      name: "Plum",
      backgroundImage: `linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(126, 34, 206, 0.9)),
linear-gradient(rgba(0, 0, 0, 0.3) 0%, rgba(40, 20, 50, 1) 100%)`,
    },
    {
      name: "Deep Plum",
      backgroundImage: `linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(88, 28, 135, 0.9)),
linear-gradient(rgba(0, 0, 0, 0.35) 0%, rgba(30, 15, 40, 1) 100%)`,
    },
    {
      name: "Bright Plum",
      backgroundImage: `linear-gradient(135deg, rgba(196, 123, 255, 0.3), rgba(147, 51, 234, 0.9)),
linear-gradient(rgba(0, 0, 0, 0.25) 0%, rgba(50, 25, 60, 1) 100%)`,
    },
    {
      name: "Plum Rose",
      backgroundImage: `linear-gradient(135deg, rgba(186, 85, 211, 0.3), rgba(153, 50, 204, 0.9)),
linear-gradient(rgba(0, 0, 0, 0.3) 0%, rgba(45, 20, 50, 1) 100%)`,
    },
    {
      name: "Plum Midnight",
      backgroundImage: `linear-gradient(135deg, rgba(138, 43, 226, 0.3), rgba(75, 0, 130, 0.9)),
linear-gradient(rgba(0, 0, 0, 0.4) 0%, rgba(25, 10, 35, 1) 100%)`,
    },
    {
      name: "Plum Soft",
      backgroundImage: `linear-gradient(135deg, rgba(177, 106, 242, 0.3), rgba(138, 43, 226, 0.9)),
linear-gradient(rgba(0, 0, 0, 0.28) 0%, rgba(42, 22, 52, 1) 100%)`,
    },
    {
      name: "Plum Silk",
      backgroundImage: `linear-gradient(135deg, rgba(200, 130, 250, 0.3), rgba(160, 50, 220, 0.9)),
linear-gradient(rgba(0, 0, 0, 0.27) 0%, rgba(48, 23, 58, 1) 100%)`,
    },
    {
      name: "Plum Velvet",
      backgroundImage: `linear-gradient(135deg, rgba(155, 70, 240, 0.3), rgba(100, 20, 150, 0.9)),
linear-gradient(rgba(0, 0, 0, 0.38) 0%, rgba(35, 12, 45, 1) 100%)`,
    },
    {
      name: "Plum Twilight",
      backgroundImage: `linear-gradient(135deg, rgba(172, 95, 250, 0.3), rgba(120, 30, 180, 0.9)),
linear-gradient(rgba(0, 0, 0, 0.32) 0%, rgba(38, 18, 48, 1) 100%)`,
    },
    {
      name: "Plum Amethyst",
      backgroundImage: `linear-gradient(135deg, rgba(180, 100, 245, 0.3), rgba(135, 40, 210, 0.9)),
linear-gradient(rgba(0, 0, 0, 0.29) 0%, rgba(44, 21, 54, 1) 100%)`,
    },
    {
      name: "Plum Berry",
      backgroundImage: `linear-gradient(135deg, rgba(175, 80, 245, 0.3), rgba(110, 25, 165, 0.9)),
linear-gradient(rgba(0, 0, 0, 0.36) 0%, rgba(32, 12, 42, 1) 100%)`,
    },
    {
      name: "Plum Orchid",
      backgroundImage: `linear-gradient(135deg, rgba(190, 110, 250, 0.3), rgba(145, 60, 215, 0.9)),
linear-gradient(rgba(0, 0, 0, 0.26) 0%, rgba(52, 26, 62, 1) 100%)`,
    }
  ];

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
        image: product.images[0] || "/placeholder.svg", // Use first image or placeholder
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
      <BrandNavbar  />
      <main className="">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto text-center" style={{width: '90%', padding: '10% 0'}}>
            <div className="backdrop-blur rounded-3xl relative" style={{padding: '10%', backgroundImage: gradients[gradientIndex].backgroundImage, boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'}}>
              <button 
                onClick={() => setGradientIndex((prev) => (prev + 1) % gradients.length)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm backdrop-blur transition"
                style={{fontSize: '0.75vw', padding: '0.5vw 1vw'}}
              >
                {gradients[gradientIndex].name} ▶
              </button>
              <h1 className="flex font-semibold tracking-tight justify-center" style={{fontSize: '2.5vw', gap: '2%'}}>
                <img src={logoTransparent} alt="logo" className="flex items-center" style={{height: '4vw', maxHeight: '80px'}} />
                Independent Fashion Marketplace
              </h1>
            <p className="text-muted-foreground mx-auto" style={{marginTop: '3%', fontSize: '1.2vw', maxWidth: '80%'}}>
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
        <section style={{padding: '2% 4%', marginTop: '-3%'}}>
          <div className="mx-auto bg-background/60 backdrop-blur rounded-2xl border shadow-sm" style={{maxWidth: '90%', padding: '2% 0'}}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between" style={{padding: '0 3%', gap: '2%'}}>
              <div className="flex flex-wrap items-center" style={{gap: '2%'}}>
                <span className="text-muted-foreground whitespace-nowrap" style={{fontSize: '0.9vw'}}>Categories:</span>
                {CATEGORIES.map((c) => (
                  <label key={c} className="flex items-center" style={{gap: '1%'}}>
                    <Checkbox id={c} checked={selected.has(c)} onCheckedChange={() => toggleCategory(c)} />
                    <Label htmlFor={c} className="cursor-pointer" style={{fontSize: '0.9vw'}}>{c}</Label>
                  </label>
                ))}
              </div>
              <div className="flex flex-col md:flex-row" style={{gap: '3%', width: '100%', maxWidth: '50%'}}>
                <div style={{width: '100%'}}>
                  <Label style={{fontSize: '0.9vw'}}>Max price: €{maxPrice}</Label>
                  <Slider value={[maxPrice]} min={20} max={500} step={5} onValueChange={(v) => setMaxPrice(v[0] ?? 300)} />
                </div>
                <div style={{width: '100%'}}>
                  <Label style={{fontSize: '0.9vw'}}>Sort</Label>
                  <Select value={sort} onValueChange={(v: Sort) => setSort(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
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
