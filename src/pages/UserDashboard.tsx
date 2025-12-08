import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrandNavbar from "@/components/BrandNavbar";
import { NotificationCenter } from "@/components/NotificationCenter";
import { UserProfileManager } from "@/components/UserProfileManager";
import { Heart, ShoppingBag, User, Package, Settings, Receipt, Calendar, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

type LikedProduct = {
  id: string;
  product_id: string;
  products: {
    id: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    images: string[];
  };
};

type Purchase = {
  id: string;
  product_id: string;
  seller_id: string;
  quantity: number;
  price_paid: number;
  purchased_at: string;
  products: {
    id: string;
    name: string;
    brand: string;
    category: string;
    images: string[];
  };
  seller?: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likedProducts, setLikedProducts] = useState<LikedProduct[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch liked products with product details
      const { data: likesData, error: likesError } = await supabase
        .from("likes")
        .select("*")
        .eq("user_id", user.id);

      if (likesError) throw likesError;

      // Fetch product details for liked products
      if (likesData && likesData.length > 0) {
        const productIds = likesData.map(like => like.product_id);
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id, name, brand, category, price, images")
          .in("id", productIds);

        if (productsError) throw productsError;

        const likesWithProducts = likesData.map(like => ({
          ...like,
          products: productsData?.find(p => p.id === like.product_id) || {
            id: like.product_id,
            name: "Deleted product",
            brand: "",
            category: "",
            price: 0,
            images: []
          }
        }));
        setLikedProducts(likesWithProducts);
      }

      // Fetch purchases with product details
      const { data: purchasesData, error: purchasesError } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", user.id)
        .order("purchased_at", { ascending: false });

      if (purchasesError) throw purchasesError;

      // Fetch product details and seller info for purchases
      if (purchasesData && purchasesData.length > 0) {
        const productIds = purchasesData.map(purchase => purchase.product_id);
        const sellerIds = [...new Set(purchasesData.map(purchase => purchase.seller_id))];
        
        const [productsResult, sellersResult] = await Promise.all([
          supabase
            .from("products")
            .select("id, name, brand, category, images")
            .in("id", productIds),
          supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url")
            .in("user_id", sellerIds)
        ]);

        if (productsResult.error) throw productsResult.error;

        const purchasesWithDetails = purchasesData.map(purchase => ({
          ...purchase,
          products: productsResult.data?.find(p => p.id === purchase.product_id) || {
            id: purchase.product_id,
            name: "Produit supprimé",
            brand: "",
            category: "",
            images: []
          },
          seller: sellersResult.data?.find(s => s.user_id === purchase.seller_id) || {
            full_name: "Vendeur inconnu",
            avatar_url: null
          }
        }));
        setPurchases(purchasesWithDetails);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={['buyer']}>
      <div className="min-h-screen bg-animated-fade">
        <BrandNavbar />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
              <User className="h-8 w-8" />
              Mon Espace Personnel
            </h1>
            <p className="text-muted-foreground">
              Gérez votre profil, vos achats et vos articles favoris.
            </p>
          </div>

          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
              <TabsTrigger value="orders" className="text-xs sm:text-sm py-2">Commandes</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs sm:text-sm py-2">Favoris</TabsTrigger>
              <TabsTrigger value="profile" className="text-xs sm:text-sm py-2">Profil</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm py-2">Paramètres</TabsTrigger>
            </TabsList>

            {/* Orders History Tab */}
            <TabsContent value="orders" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    Historique des Commandes ({purchases.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Chargement...</div>
                  ) : purchases.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>Aucune commande pour le moment.</p>
                      <p className="text-sm">Découvrez notre sélection de vêtements de seconde main !</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {purchases.map((purchase) => (
                        <div
                          key={purchase.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleProductClick(purchase.products.id)}
                        >
                          {purchase.products.images && purchase.products.images.length > 0 ? (
                            <img
                              src={purchase.products.images[0]}
                              alt={purchase.products.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          
                          <div className="flex-1 space-y-2">
                            <div>
                              <h3 className="font-semibold text-lg">{purchase.products.name}</h3>
                              <p className="text-sm text-muted-foreground">{purchase.products.brand}</p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Store className="h-4 w-4" />
                                <span>{purchase.seller?.full_name || "Vendeur inconnu"}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(purchase.purchased_at).toLocaleDateString('fr-FR', { 
                                  day: 'numeric', 
                                  month: 'long', 
                                  year: 'numeric' 
                                })}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">Qté: {purchase.quantity}</Badge>
                              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                                Confirmée
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-2xl font-bold">{purchase.price_paid}€</p>
                            <p className="text-xs text-muted-foreground">Total payé</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" style={{marginTop: '3%'}}>
              <div className="grid grid-cols-1 lg:grid-cols-2" style={{gap: '4%'}}>
            {/* Liked Products Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center" style={{gap: '1%'}}>
                  <Heart style={{height: '1.2vw', width: '1.2vw'}} className="text-red-500" />
                  Articles Aimés ({likedProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center" style={{padding: '4% 0'}}>Chargement...</div>
                ) : likedProducts.length === 0 ? (
                  <div className="text-center text-muted-foreground" style={{padding: '4% 0'}}>
                    <Heart className="mx-auto text-muted-foreground/50" style={{height: '3vw', width: '3vw', marginBottom: '2%'}} />
                    <p>Aucun article aimé pour le moment.</p>
                    <p className="text-sm">Explorez notre catalogue pour découvrir des pièces uniques !</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {likedProducts.map((like) => (
                      <div
                        key={like.id}
                        className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleProductClick(like.products.id)}
                      >
                        {like.products.images && like.products.images.length > 0 ? (
                          <img
                            src={like.products.images[0]}
                            alt={like.products.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h3 className="font-medium">{like.products.name}</h3>
                          <p className="text-sm text-muted-foreground">{like.products.brand}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{like.products.category}</Badge>
                            <span className="font-semibold">{like.products.price}€</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
              </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-6">
              <UserProfileManager />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Paramètres du compte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Paramètres avancés bientôt disponibles</p>
                    <p className="text-sm">
                      Préférences de notifications, confidentialité, etc.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default UserDashboard;