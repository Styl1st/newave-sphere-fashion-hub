import BrandNavbar from "@/components/BrandNavbar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "@/components/ProductCard";

import hoodie from "@/assets/products/hoodie.jpg";
import denimJacket from "@/assets/products/denim-jacket.jpg";
import boots from "@/assets/products/boots.jpg";
import tee from "@/assets/products/tee.jpg";
import tote from "@/assets/products/tote.jpg";
import jeans from "@/assets/products/jeans.jpg";
import { useMemo, useState } from "react";

const CATEGORIES = ["Streetwear", "Denim", "Grunge", "Goth", "Alternative"];

const MOCK_PRODUCTS = [
  { id: "1", name: "Charcoal Oversized Hoodie", brand: "Void Atelier", category: "Streetwear", price: 95, image: hoodie },
  { id: "2", name: "Raw Indigo Denim Jacket", brand: "North Loom", category: "Denim", price: 145, image: denimJacket },
  { id: "3", name: "Worn Combat Boots", brand: "Shiver", category: "Grunge", price: 160, image: boots },
  { id: "4", name: "Minimal Graphic Tee", brand: "Nocturn", category: "Goth", price: 60, image: tee },
  { id: "5", name: "Canvas Logo Tote", brand: "Kaito", category: "Alternative", price: 40, image: tote },
  { id: "6", name: "Distressed Black Jeans", brand: "Wraith", category: "Grunge", price: 120, image: jeans },
];

const Index = () => {
  const [selected, setSelected] = useState(new Set());
  const [maxPrice, setMaxPrice] = useState(200);
  const [sort, setSort] = useState("relevance");

  const filtered = useMemo(() => {
    let list = MOCK_PRODUCTS.filter(p => p.price <= maxPrice);
    if (selected.size > 0) {
      list = list.filter(p => selected.has(p.category));
    }
    if (sort === "price_asc") list = [...list].sort((a,b) => a.price - b.price);
    if (sort === "price_desc") list = [...list].sort((a,b) => b.price - a.price);
    return list;
  }, [selected, maxPrice, sort]);

  const toggleCategory = (c) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <BrandNavbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 opacity-30 blur-3xl bg-gradient-primary animate-gradient" />
          <div className="container mx-auto py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
              NeWave Sphere — Independent Fashion Marketplace
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
        <section className="border-t">
          <div className="container mx-auto py-6 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
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
                <Slider value={[maxPrice]} min={20} max={300} step={5} onValueChange={(v) => setMaxPrice(v[0] ?? 200)} />
              </div>
              <div className="w-44">
                <Label className="text-sm">Sort</Label>
                <Select value={sort} onValueChange={(v) => setSort(v)}>
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
        </section>

        {/* Grid */}
        <section className="container mx-auto py-10">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
