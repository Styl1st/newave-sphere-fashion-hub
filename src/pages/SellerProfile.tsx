import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard, type Product } from "@/components/ProductCard";
import { Store, Mail, MapPin, Calendar } from "lucide-react";
import BrandNavbar from "@/components/BrandNavbar";

type Profile = {
  user_id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  is_seller?: boolean;
  created_at: string;
};

type DatabaseProduct = {
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

const SellerProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchSellerData();
    }
  }, [userId]);

  const fetchSellerData = async () => {
    try {
      // Fetch seller profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .eq("is_seller", true)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);

      // Fetch seller's products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      // Transform database products to match ProductCard type
      const transformedProducts: Product[] = (productsData || []).map(product => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: Number(product.price),
        image: product.images[0] || "/placeholder.svg",
      }));

      setProducts(transformedProducts);

    } catch (error) {
      console.error("Error fetching seller data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-animated-fade">
        <BrandNavbar />
        <div className="container mx-auto px-4 py-8 page-gap">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-animated-fade">
        <BrandNavbar />
        <div className="container mx-auto px-4 py-8 page-gap">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Profil vendeur non trouvé</h1>
            <p className="text-muted-foreground">
              Ce vendeur n'existe pas ou n'est pas encore activé.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-animated-fade">
      <BrandNavbar />
      
      <div className="container mx-auto px-4 py-8 page-gap">
        {/* Seller Header */}
        <Card className="mb-8 bg-background/80 backdrop-blur border rounded-3xl">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "Vendeur"}
                    className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-elegant"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted border-4 border-background shadow-elegant flex items-center justify-center">
                    <Store className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold">
                    {profile.full_name || "Vendeur"}
                  </h1>
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    <Store className="mr-1 h-3 w-3" />
                    Vendeur vérifié
                  </Badge>
                </div>
                
                {profile.bio && (
                  <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                    {profile.bio}
                  </p>
                )}
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Membre depuis {memberSince}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    <span>{products.length} produit{products.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  {profile.email && (
                    <Button variant="outline" asChild>
                      <a href={`mailto:${profile.email}`}>
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

        {/* Products Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Produits de {profile.full_name || "ce vendeur"}
          </h2>
          <p className="text-muted-foreground">
            Découvrez tous les articles proposés par ce vendeur
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <Card className="bg-background/80 backdrop-blur border rounded-3xl">
            <CardContent className="p-12 text-center">
              <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun produit</h3>
              <p className="text-muted-foreground">
                Ce vendeur n'a pas encore publié de produits.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SellerProfile;