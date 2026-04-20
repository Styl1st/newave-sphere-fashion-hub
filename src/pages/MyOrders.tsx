import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BrandNavbar from "@/components/BrandNavbar";
import { ShoppingBag, Package, Search, ArrowLeft, Calendar, Euro } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

type Purchase = {
  id: string;
  product_id: string;
  quantity: number;
  price_paid: number;
  purchased_at: string;
  seller_id: string;
  products: {
    id: string;
    name: string;
    brand: string;
    category: string;
    images: string[];
  };
  seller_name?: string;
};

const MyOrdersContent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user) fetchPurchases();
  }, [user]);

  const fetchPurchases = async () => {
    if (!user) return;
    try {
      const { data: purchasesData, error } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", user.id)
        .order("purchased_at", { ascending: false });

      if (error) throw error;

      if (purchasesData && purchasesData.length > 0) {
        const productIds = purchasesData.map((p) => p.product_id);
        const sellerIds = [...new Set(purchasesData.map((p) => p.seller_id))];

        const [{ data: productsData }, { data: sellersData }] = await Promise.all([
          supabase.from("products").select("id, name, brand, category, images").in("id", productIds),
          supabase.from("seller_profiles_public").select("user_id, full_name").in("user_id", sellerIds),
        ]);

        const enriched = purchasesData.map((p) => ({
          ...p,
          products: productsData?.find((pr) => pr.id === p.product_id) || {
            id: p.product_id,
            name: "Produit supprimé",
            brand: "",
            category: "",
            images: [],
          },
          seller_name: sellersData?.find((s) => s.user_id === p.seller_id)?.full_name || "Vendeur",
        }));
        setPurchases(enriched);
      } else {
        setPurchases([]);
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = purchases.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.products.name.toLowerCase().includes(q) ||
      p.products.brand.toLowerCase().includes(q) ||
      p.products.category.toLowerCase().includes(q) ||
      (p.seller_name || "").toLowerCase().includes(q)
    );
  });

  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.price_paid), 0);

  return (
    <div className="min-h-screen bg-background">
      <BrandNavbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <ShoppingBag className="h-8 w-8" />
            Mes commandes
          </h1>
          <p className="text-muted-foreground">Suivi de tous vos achats</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total commandes</p>
                <p className="text-2xl font-bold">{purchases.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Euro className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total dépensé</p>
                <p className="text-2xl font-bold">{totalSpent.toFixed(2)}€</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par produit, marque, catégorie ou vendeur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Orders list */}
        <Card>
          <CardHeader>
            <CardTitle>Historique ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Chargement...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{purchases.length === 0 ? "Aucune commande pour le moment" : "Aucun résultat"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/product/${purchase.products.id}`)}
                  >
                    {purchase.products.images?.[0] ? (
                      <img
                        src={purchase.products.images[0]}
                        alt={purchase.products.name}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{purchase.products.name}</h3>
                          <p className="text-sm text-muted-foreground">{purchase.products.brand}</p>
                        </div>
                        <p className="font-bold text-lg">{Number(purchase.price_paid).toFixed(2)}€</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {purchase.products.category && (
                          <Badge variant="secondary">{purchase.products.category}</Badge>
                        )}
                        <Badge variant="outline">x{purchase.quantity}</Badge>
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                          Payée
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(purchase.purchased_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <span>Vendeur : {purchase.seller_name}</span>
                        <span>N° {purchase.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const MyOrders = () => (
  <ProtectedRoute allowedRoles={["buyer", "admin"]}>
    <MyOrdersContent />
  </ProtectedRoute>
);

export default MyOrders;
