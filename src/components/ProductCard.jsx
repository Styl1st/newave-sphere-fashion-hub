import { Card, CardContent } from "@/components/ui/card";

export const ProductCard = ({ product }) => {
  return (
    <Card className="overflow-hidden group hover:shadow-elegant transition-[transform,box-shadow] duration-300 will-change-transform hover:-translate-y-0.5">
      <div className="aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={`${product.name} by ${product.brand} — ${product.category} independent fashion`}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
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
