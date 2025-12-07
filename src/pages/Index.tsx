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

const CATEGORIES = ["Streetwear", "Denim", "Grunge", "Goth", "Alternative"] as const;

type Category = typeof CATEGORIES[number];

type Sort = "relevance" | "price_asc" | "price_desc";

const Index = () => {
  const [selected, setSelected] = useState<Set<Category>>(new Set());
  const [maxPrice, setMaxPrice] = useState<number>(300);
  const [sort, setSort] = useState<Sort>("relevance");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
      <main className="relative z-10">
        {/* Hero */}
        <section className="relative overflow-hidden" style={{padding: '5% 4%'}}>
          <div className="mx-auto text-center" style={{width: '90%', padding: '10% 0'}}>
            <div className="bg-white/80 backdrop-blur rounded-3xl" style={{padding: '7%'}}>
            <h1 className="flex font-semibold tracking-tight justify-center" style={{fontSize: '2.5vw', gap: '2%'}}>
              <img src={logoTransparent} alt="logo" className="flex items-center" style={{height: '4vw', maxHeight: '80px'}} />
              - Independent Fashion Marketplace
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
                    ? "Aucun produit disponible pour le moment." 
                    : "Aucun produit ne correspond à vos critères de recherche."
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
