import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useState } from "react";

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  image: string;
};

export const ProductCard = ({ product }: { product: Product }) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <Card className="overflow-hidden group hover:shadow-elegant transition-[transform,box-shadow] duration-300 will-change-transform hover:-translate-y-1 bg-background/80 backdrop-blur border rounded-3xl cursor-pointer"
          onClick={() => window.location.href = `/product/${product.id}`}>
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
            isLiked ? 'text-red-500 bg-background/90' : 'text-muted-foreground bg-background/70 hover:bg-background/90'
          }`}
          onClick={() => setIsLiked(!isLiked)}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
        </Button>
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
