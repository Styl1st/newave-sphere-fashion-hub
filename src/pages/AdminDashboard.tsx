import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrandNavbar from "@/components/BrandNavbar";
import { ProjectManager } from "@/components/ProjectManager";
import { ProjectProductManager } from "@/components/ProjectProductManager";
import { SupportTicketManager } from "@/components/SupportTicketManager";
import { UserSearchManager } from "@/components/admin/UserSearchManager";
import {
  Settings,
  Users,
  Package,
  ShoppingBag,
  MessageSquare,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

type Stats = {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalPurchases: number;
};

type Purchase = {
  id: string;
  quantity: number;
  price_paid: number;
  purchased_at: string;
  buyer?: { full_name?: string; email?: string };
  seller?: { full_name?: string; email?: string };
  product?: { name: string; images?: string[] };
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalPurchases: 0,
  });

  useEffect(() => {
    fetchStats();
    fetchPurchases();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersResult, sellersResult, productsResult, purchasesResult] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "seller"),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("purchases").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalSellers: sellersResult.count || 0,
        totalProducts: productsResult.count || 0,
        totalPurchases: purchasesResult.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchPurchases = async () => {
    try {
      setLoadingPurchases(true);
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          id,
          quantity,
          price_paid,
          purchased_at,
          user_id,
          seller_id,
          product_id,
          products (name, images)
        `)
        .order("purchased_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch buyer and seller profiles
      const purchasesWithProfiles = await Promise.all(
        (data || []).map(async (purchase: any) => {
          const [buyerResult, sellerResult] = await Promise.all([
            supabase.from("profiles").select("full_name, email").eq("user_id", purchase.user_id).maybeSingle(),
            supabase.from("profiles").select("full_name, email").eq("user_id", purchase.seller_id).maybeSingle(),
          ]);
          return {
            ...purchase,
            buyer: buyerResult.data,
            seller: sellerResult.data,
            product: purchase.products,
          };
        })
      );

      setPurchases(purchasesWithProfiles);
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoadingPurchases(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-animated-fade">
        <BrandNavbar />

        <div className="mx-auto max-w-[95%] sm:max-w-[90%] px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
          <div className="mb-6 sm:mb-8">
            <h1 className="font-bold flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl lg:text-3xl mb-2">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
              {t.nav.admin} {t.nav.dashboard}
            </h1>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-medium flex items-center gap-2 text-xs sm:text-sm">
                  <Users className="h-4 w-4" />
                  {t.adminDashboard.users}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl sm:text-3xl lg:text-4xl">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-medium flex items-center gap-2 text-xs sm:text-sm">
                  <Users className="h-4 w-4" />
                  Sellers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl sm:text-3xl lg:text-4xl">{stats.totalSellers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-medium flex items-center gap-2 text-xs sm:text-sm">
                  <Package className="h-4 w-4" />
                  {t.sellerDashboard.products}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl sm:text-3xl lg:text-4xl">{stats.totalProducts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-medium flex items-center gap-2 text-xs sm:text-sm">
                  <ShoppingBag className="h-4 w-4" />
                  {t.statistics.orders}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl sm:text-3xl lg:text-4xl">{stats.totalPurchases}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different admin sections */}
          <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto">
              <TabsTrigger value="users" className="text-xs sm:text-sm py-2">{t.adminDashboard.users}</TabsTrigger>
              <TabsTrigger value="purchases" className="text-xs sm:text-sm py-2">{t.statistics.orders}</TabsTrigger>
              <TabsTrigger value="support" className="text-xs sm:text-sm py-2">{t.nav.support}</TabsTrigger>
              <TabsTrigger value="projects" className="text-xs sm:text-sm py-2 hidden sm:flex">{t.sellerDashboard.myProjects}</TabsTrigger>
              <TabsTrigger value="products" className="text-xs sm:text-sm py-2 hidden sm:flex">{t.sellerDashboard.products}</TabsTrigger>
            </TabsList>
            {/* Mobile additional tabs */}
            <TabsList className="grid w-full grid-cols-2 sm:hidden h-auto">
              <TabsTrigger value="projects" className="text-xs py-2">{t.sellerDashboard.myProjects}</TabsTrigger>
              <TabsTrigger value="products" className="text-xs py-2">{t.sellerDashboard.products}</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <UserSearchManager />
            </TabsContent>

            <TabsContent value="purchases">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Toutes les transactions ({purchases.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPurchases ? (
                    <div className="text-center py-8">Chargement...</div>
                  ) : purchases.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm sm:text-base">Aucune transaction pour le moment</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {purchases.map((purchase) => (
                        <div
                          key={purchase.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3"
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            {purchase.product?.images?.[0] ? (
                              <img
                                src={purchase.product.images[0]}
                                alt={purchase.product.name}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate">{purchase.product?.name || 'Produit supprimé'}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                Acheteur: {purchase.buyer?.full_name || purchase.buyer?.email || 'Inconnu'}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                Vendeur: {purchase.seller?.full_name || purchase.seller?.email || 'Inconnu'}
                              </p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
                            <p className="font-bold text-primary text-sm sm:text-base">{purchase.price_paid.toFixed(2)} €</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">x{purchase.quantity}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(purchase.purchased_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                    Support & Signalements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SupportTicketManager />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects">
              <ProjectManager isAdminView={true} />
            </TabsContent>

            <TabsContent value="products">
              <ProjectProductManager isAdminView={true} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
