import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
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
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
              <User className="h-8 w-8" />
              My Personal Space
            </h1>
            <p className="text-muted-foreground">
              Manage your profile, purchases and favorite items.
            </p>
          </div>

          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Liked Products Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Liked Items ({likedProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : likedProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No liked items yet.</p>
                    <p className="text-sm">Explore our catalog to discover unique pieces!</p>
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
                  Purchase History ({purchases.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : purchases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No purchases yet.</p>
                    <p className="text-sm">Discover our selection of second-hand clothing!</p>
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
                              Quantity: {purchase.quantity}
                            </span>
                            <span className="font-semibold">{purchase.price_paid}€</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Purchased on {new Date(purchase.purchased_at).toLocaleDateString()}
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
                    Account Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Advanced settings coming soon</p>
                    <p className="text-sm">
                      Notification preferences, privacy, etc.
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