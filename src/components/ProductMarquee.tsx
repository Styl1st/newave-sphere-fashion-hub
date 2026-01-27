import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, memo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type MarqueeProduct = {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
};

const ProductMarquee = memo(() => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<MarqueeProduct[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, brand, price, images")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching marquee products:", error);
        return;
      }

      const transformed: MarqueeProduct[] = (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: Number(p.price),
        image: p.images?.[0] || "/placeholder.svg",
      }));

      setProducts(transformed);
    };

    fetchProducts();
  }, []);

  // Shuffle products randomly for variety
  const shuffledProducts = useMemo(() => {
    if (products.length === 0) return [];
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    // Duplicate for seamless infinite scroll
    return [...shuffled, ...shuffled, ...shuffled];
  }, [products]);

  const handleProductClick = useCallback((productId: string) => {
    navigate(`/product/${productId}`);
  }, [navigate]);

  if (products.length === 0) return null;

  return (
    <div className="w-full py-6 overflow-hidden bg-gradient-to-r from-background via-muted/30 to-background">
      <div className="mb-4 px-4 sm:px-8">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Découvrez nos articles
        </h2>
      </div>
      
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className="flex gap-4 animate-marquee"
          style={{
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          {shuffledProducts.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="flex-shrink-0 group cursor-pointer transition-transform duration-300 hover:scale-105"
              onClick={() => handleProductClick(product.id)}
            >
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-muted border border-border/50 shadow-sm hover:shadow-elegant transition-shadow duration-300">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-2 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-xs font-medium truncate">{product.name}</p>
                  <p className="text-[10px] text-white/80">{product.brand}</p>
                  <p className="text-xs font-semibold">€{product.price}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

ProductMarquee.displayName = 'ProductMarquee';

export default ProductMarquee;
