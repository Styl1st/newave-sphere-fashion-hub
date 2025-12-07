import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowLeft, Store, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BrandNavbar from "@/components/BrandNavbar";
import ProductComments from "@/components/ProductComments";

type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  description?: string;
  images: string[];
  user_id: string;
  created_at: string;
};

type Profile = {
  user_id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  is_seller?: boolean;
};

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [sellerProfile, setSellerProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (productError) throw productError;

      if (productData) {
        setProduct(productData);
        
        // Fetch seller profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", productData.user_id)
          .single();

        if (profileData) {
          setSellerProfile(profileData);
        }
      }
    } catch (error: any) {
      console.error("Error fetching product:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du produit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-animated-fade">
        <BrandNavbar />
        <div className="mx-auto" style={{maxWidth: '90%', padding: '4% 2%'}}>
          <div className="flex items-center justify-center" style={{minHeight: '60vh'}}>
            <div className="text-center">
              <div className="animate-spin rounded-full border-b-2 border-primary mx-auto" style={{height: '3vw', width: '3vw', minHeight: '48px', minWidth: '48px', marginBottom: '2%'}}></div>
              <p className="text-muted-foreground" style={{fontSize: '1vw'}}>Chargement...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-animated-fade">
        <BrandNavbar />
        <div className="mx-auto" style={{maxWidth: '90%', padding: '4% 2%'}}>
          <div className="text-center">
            <h1 className="font-bold" style={{fontSize: '2vw', marginBottom: '2%'}}>Produit non trouvé</h1>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    if (product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="min-h-screen bg-animated-fade">
      <BrandNavbar />
      
      <div className="mx-auto" style={{maxWidth: '90%', padding: '4% 2%'}}>
        <Button 
          onClick={() => navigate("/")} 
          variant="ghost" 
          style={{marginBottom: '3%'}}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-muted">
              <img
                src={product.images[currentImageIndex] || "/placeholder.svg"}
                alt={`${product.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {product.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90"
                    onClick={prevImage}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90"
                    onClick={nextImage}
                  >
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </>
              )}
            </div>
            
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - Miniature ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold">{product.name}</h1>
                  <p className="text-lg text-muted-foreground">{product.brand}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full transition-colors ${
                    isLiked ? 'text-red-500' : 'text-muted-foreground'
                  }`}
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
              </div>
              
              <Badge variant="secondary" className="mb-4">
                {product.category}
              </Badge>
              
              <div className="text-3xl font-bold text-primary">
                €{product.price}
              </div>
            </div>

            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button size="lg" className="w-full">
                Contacter le vendeur
              </Button>
            </div>
          </div>
        </div>

        {/* Seller Profile */}
        {sellerProfile && (
          <Card className="bg-background/80 backdrop-blur border rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {sellerProfile.avatar_url ? (
                    <img
                      src={sellerProfile.avatar_url}
                      alt={sellerProfile.full_name || "Vendeur"}
                      className="w-16 h-16 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted border flex items-center justify-center">
                      <Store className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">
                      {sellerProfile.full_name || "Vendeur"}
                    </h3>
                    {sellerProfile.is_seller && (
                      <Badge variant="outline">Vendeur vérifié</Badge>
                    )}
                  </div>
                  
                  {sellerProfile.bio && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {sellerProfile.bio}
                    </p>
                  )}
                  
                  <div className="flex gap-3">
                    <Link to={`/seller/${sellerProfile.user_id}`}>
                      <Button variant="outline" size="sm">
                        <Store className="mr-2 h-4 w-4" />
                        Voir tous ses produits
                      </Button>
                    </Link>
                    
                    {sellerProfile.email && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`mailto:${sellerProfile.email}`}>
                          <Mail className="mr-2 h-4 w-4" />
                          Contacter
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments Section */}
        <div className="mt-8">
          <ProductComments productId={id!} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;