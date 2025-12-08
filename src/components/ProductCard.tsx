import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLikes } from "@/hooks/useLikes";
import { useEffect, useState } from "react";

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  image: string;
  images?: string[];
};

export const ProductCard = ({ product }: { product: Product }) => {
  const navigate = useNavigate();
  const { isLiked, toggleLike, fetchLikeCount, getLikeCount } = useLikes();
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetchLikeCount(product.id).then(count => setLikeCount(count));
  }, [product.id, fetchLikeCount]);

  // Update local count when global state changes
  useEffect(() => {
    const count = getLikeCount(product.id);
    if (count > 0) setLikeCount(count);
  }, [getLikeCount, product.id]);

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    const wasLiked = isLiked(product.id);
    await toggleLike(product.id, e);
    // Update local count optimistically
    setLikeCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);
  };

  return (
    <Card className="overflow-hidden group hover:shadow-elegant transition-[transform,box-shadow] duration-300 will-change-transform hover:-translate-y-1 bg-background/80 backdrop-blur border rounded-3xl cursor-pointer"
          onClick={handleCardClick}>
      <div className="aspect-square overflow-hidden rounded-t-3xl relative">
        <img
          src={product.image}
          alt={`${product.name} by ${product.brand} — ${product.category} independent fashion`}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-3 right-3 rounded-full transition-colors ${
            isLiked(product.id) ? 'text-red-500 bg-background/90' : 'text-muted-foreground bg-background/70 hover:bg-background/90'
          }`}
          onClick={handleLikeClick}
        >
          <Heart className={`h-4 w-4 ${isLiked(product.id) ? 'fill-current' : ''}`} />
        </Button>
        {likeCount > 0 && (
          <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
            {likeCount}
          </div>
        )}
      </div>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-sm text-muted-foreground">{product.brand}</p>
            <h3 className="font-medium leading-tight">{product.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
          </div>
          <div className="font-semibold">€{product.price}</div>
        </div>
      </CardContent>
    </Card>
  );
};
