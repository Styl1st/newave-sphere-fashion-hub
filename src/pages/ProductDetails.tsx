import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Heart, ArrowLeft, Store, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
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
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [sellerProfile, setSellerProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { startConversation } = useMessages();

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
        title: "Error",
        description: "Unable to load product details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour contacter le vendeur",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!sellerProfile || !product) return;

    if (user.id === sellerProfile.user_id) {
      toast({
        title: "Action impossible",
        description: "Vous ne pouvez pas vous envoyer un message",
        variant: "destructive",
      });
      return;
    }

    const result = await startConversation(sellerProfile.user_id, product.id);
    if (result) {
      navigate(`/inbox?conversationId=${result.conversationId}&productId=${product.id}`);
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
              <p className="text-muted-foreground" style={{fontSize: '1vw'}}>Loading...</p>
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
            <h1 className="font-bold" style={{fontSize: '2vw', marginBottom: '2%'}}>Product not found</h1>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
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
          Back
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
                      alt={`${product.name} - Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info - Enhanced with better contrast */}
          <div className="space-y-6">
            <Card className="bg-card/95 backdrop-blur border-border/50">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
                    <p className="text-lg text-muted-foreground font-medium">{product.brand}</p>
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
                
                <Badge variant="secondary" className="text-sm">
                  {product.category}
                </Badge>
                
                <div className="text-3xl font-bold text-primary">
                  €{product.price}
                </div>
              </CardContent>
            </Card>

            {product.description && (
              <Card className="bg-card/95 backdrop-blur border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-3">Description</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card/95 backdrop-blur border-border/50">
              <CardContent className="p-6">
                <Button size="lg" className="w-full" onClick={handleContactSeller}>
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Contacter le vendeur
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seller Profile */}
        {sellerProfile && (
          <Card className="bg-card/95 backdrop-blur border-border/50 rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {sellerProfile.avatar_url ? (
                    <img
                      src={sellerProfile.avatar_url}
                      alt={sellerProfile.full_name || "Seller"}
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
                    <h3 className="font-semibold text-lg text-foreground">
                      {sellerProfile.full_name || "Seller"}
                    </h3>
                    {sellerProfile.is_seller && (
                      <Badge variant="outline">Verified seller</Badge>
                    )}
                  </div>
                  
                  {sellerProfile.bio && (
                    <p className="text-sm text-muted-foreground mb-3 whitespace-pre-line">
                      {sellerProfile.bio}
                    </p>
                  )}
                  
                  <div className="flex gap-3">
                    <Link to={`/seller/${sellerProfile.user_id}`}>
                      <Button variant="outline" size="sm">
                        <Store className="mr-2 h-4 w-4" />
                        View all products
                      </Button>
                    </Link>
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