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
      <BrandNavbar />
      <main className="relative z-10">
        {/* Hero */}
        <section className="relative overflow-hidden px-4">
          <div className="max-w-4xl mx-auto py-16 text-center">
            <h1 className="flex text-4xl md:text-5xl font-semibold tracking-tight justify-center gap-2">
              <img src={logoTransparent} alt="logo" className="flex h-[80px] items-center" />
              - Independent Fashion Marketplace
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover streetwear, denim, grunge, goth and more from emerging brands. Curated pieces, community-first.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button variant="hero" size="lg">Explore drops</Button>
              <a href="/auth">
                <Button variant="secondary" size="lg">Become a seller</Button>
              </a>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="px-4">
          <div className="max-w-6xl mx-auto py-6 bg-background/60 backdrop-blur rounded-2xl border shadow-sm">
            <div className="px-6 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <span className="text-sm text-muted-foreground">Categories:</span>
                {CATEGORIES.map((c) => (
                  <label key={c} className="flex items-center gap-2">
                    <Checkbox id={c} checked={selected.has(c)} onCheckedChange={() => toggleCategory(c)} />
                    <Label htmlFor={c} className="cursor-pointer">{c}</Label>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-6">
                <div className="w-56">
                  <Label className="text-sm">Max price: €{maxPrice}</Label>
                  <Slider value={[maxPrice]} min={20} max={500} step={5} onValueChange={(v) => setMaxPrice(v[0] ?? 300)} />
                </div>
                <div className="w-44">
                  <Label className="text-sm">Sort</Label>
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
        <section className="px-4 py-10">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Chargement des produits...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {products.length === 0 
                    ? "Aucun produit disponible pour le moment." 
                    : "Aucun produit ne correspond à vos critères de recherche."
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
