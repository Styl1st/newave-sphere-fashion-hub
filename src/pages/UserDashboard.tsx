import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrandNavbar from "@/components/BrandNavbar";
import { NotificationCenter } from "@/components/NotificationCenter";
import { UserProfileManager } from "@/components/UserProfileManager";
import { Heart, ShoppingBag, User, Package, Settings } from "lucide-react";
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
};

const UserDashboard = () => {
  const { user } = useAuth();
  const { t } = useI18n();
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

      // Fetch product details for purchases
      if (purchasesData && purchasesData.length > 0) {
        const productIds = purchasesData.map(purchase => purchase.product_id);
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id, name, brand, category, images")
          .in("id", productIds);

        if (productsError) throw productsError;

        const purchasesWithProducts = purchasesData.map(purchase => ({
          ...purchase,
          products: productsData?.find(p => p.id === purchase.product_id) || {
            id: purchase.product_id,
            name: "Deleted product",
            brand: "",
            category: "",
            images: []
          }
        }));
        setPurchases(purchasesWithProducts);
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
        
        <div className="mx-auto" style={{maxWidth: '90%', padding: '4% 2%'}}>
          <div style={{marginBottom: '4%'}}>
            <h1 className="font-bold flex items-center" style={{fontSize: '2.5vw', gap: '1%', marginBottom: '1%'}}>
              <User style={{height: '2vw', width: '2vw'}} />
              {t.userDashboard.myPersonalSpace}
            </h1>
          </div>

          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="activity">{t.userDashboard.activity}</TabsTrigger>
              <TabsTrigger value="profile">{t.userDashboard.profile}</TabsTrigger>
              <TabsTrigger value="settings">{t.userDashboard.settings}</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" style={{marginTop: '3%'}}>
              <div className="grid grid-cols-1 lg:grid-cols-2" style={{gap: '4%'}}>
            {/* Liked Products Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center" style={{gap: '1%'}}>
                  <Heart style={{height: '1.2vw', width: '1.2vw'}} className="text-red-500" />
                  {t.userDashboard.likedItems} ({likedProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center" style={{padding: '4% 0'}}>{t.common.loading}</div>
                ) : likedProducts.length === 0 ? (
                  <div className="text-center text-muted-foreground" style={{padding: '4% 0'}}>
                    <Heart className="mx-auto text-muted-foreground/50" style={{height: '3vw', width: '3vw', marginBottom: '2%'}} />
                    <p>{t.userDashboard.noLikes}</p>
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

            {/* Purchase History Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-green-600" />
                  {t.userDashboard.purchaseHistory} ({purchases.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">{t.common.loading}</div>
                ) : purchases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>{t.userDashboard.noPurchases}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchases.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleProductClick(purchase.products.id)}
                      >
                        {purchase.products.images && purchase.products.images.length > 0 ? (
                          <img
                            src={purchase.products.images[0]}
                            alt={purchase.products.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h3 className="font-medium">{purchase.products.name}</h3>
                          <p className="text-sm text-muted-foreground">{purchase.products.brand}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">
                              x{purchase.quantity}
                            </span>
                            <span className="font-semibold">{purchase.price_paid}€</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t.userDashboard.purchased} {new Date(purchase.purchased_at).toLocaleDateString()}
                          </p>
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
                    {t.userDashboard.accountSettings}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>{t.common.loading}</p>
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
