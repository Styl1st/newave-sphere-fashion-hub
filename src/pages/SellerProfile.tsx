import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard, type Product } from "@/components/ProductCard";
import { Store, MessageCircle, Calendar, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { useMessages } from "@/hooks/useMessages";
import BrandNavbar from "@/components/BrandNavbar";
import { SupportDialog } from "@/components/SupportDialog";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const { startConversation } = useMessages();
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
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .eq("is_seller", true)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

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
        <div className="mx-auto" style={{maxWidth: '90%', padding: '4% 2%'}}>
          <div className="flex items-center justify-center" style={{minHeight: '60vh'}}>
            <div className="text-center">
              <div className="animate-spin rounded-full border-b-2 border-primary mx-auto" style={{height: '3vw', width: '3vw', minHeight: '48px', minWidth: '48px', marginBottom: '2%'}}></div>
              <p className="text-muted-foreground" style={{fontSize: '1vw'}}>{t.common.loading}</p>
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
        <div className="mx-auto" style={{maxWidth: '90%', padding: '4% 2%'}}>
          <div className="text-center">
            <h1 className="font-bold" style={{fontSize: '2vw', marginBottom: '2%'}}>{t.profile.sellerNotFound}</h1>
          </div>
        </div>
      </div>
    );
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-animated-fade">
      <BrandNavbar />
      
      <div className="mx-auto" style={{maxWidth: '90%', padding: '4% 2%'}}>
        {/* Seller Header */}
        <Card className="bg-background/80 backdrop-blur border rounded-3xl" style={{marginBottom: '4%'}}>
          <CardContent style={{padding: '4%'}}>
            <div className="flex flex-col md:flex-row items-start" style={{gap: '3%'}}>
              <div className="flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "Seller"}
                    className="rounded-full object-cover border-4 border-background shadow-elegant"
                    style={{width: '6vw', height: '6vw', minWidth: '96px', minHeight: '96px'}}
                  />
                ) : (
                  <div className="rounded-full bg-muted border-4 border-background shadow-elegant flex items-center justify-center" style={{width: '6vw', height: '6vw', minWidth: '96px', minHeight: '96px'}}>
                    <Store className="text-muted-foreground" style={{height: '2.5vw', width: '2.5vw'}} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center" style={{gap: '2%', marginBottom: '2%'}}>
                  <h1 className="font-bold" style={{fontSize: '2.5vw'}}>
                    {profile.full_name || "Seller"}
                  </h1>
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    <Store className="mr-1 h-3 w-3" />
                    {t.profile.verifiedSeller}
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
                    <span>{t.profile.memberSince} {memberSince}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    <span>{products.length} {t.profile.productCount}</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="default"
                    onClick={async () => {
                      if (!user) {
                        toast({
                          title: t.cart.signInRequired,
                          description: t.cart.signInMessage,
                          variant: "destructive",
                        });
                        navigate('/auth');
                        return;
                      }
                      if (user.id === profile.user_id) {
                        toast({
                          title: t.auth.error,
                          variant: "destructive",
                        });
                        return;
                      }
                      const result = await startConversation(profile.user_id);
                      if (result) {
                        navigate(`/inbox?conversationId=${result.conversationId}`);
                      }
                    }}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {t.products.contact}
                  </Button>
                  {user && user.id !== profile.user_id && (
                    <SupportDialog
                      defaultType="report_user"
                      reportedUserId={profile.user_id}
                      reportedUserName={profile.full_name || profile.email}
                      trigger={
                        <Button variant="ghost" className="text-destructive hover:text-destructive">
                          <Flag className="mr-2 h-4 w-4" />
                          {t.products.report}
                        </Button>
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            {t.products.productBy} {profile.full_name || ""}
          </h2>
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
              <h3 className="text-xl font-semibold mb-2">{t.products.noProducts}</h3>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SellerProfile;
