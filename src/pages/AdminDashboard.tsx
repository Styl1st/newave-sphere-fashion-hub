import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import BrandNavbar from "@/components/BrandNavbar";
import { ProjectManager } from "@/components/ProjectManager";
import { ProjectProductManager } from "@/components/ProjectProductManager";
import { SupportTicketManager } from "@/components/SupportTicketManager";
import {
  Settings,
  Edit,
  Users,
  Package,
  ShoppingBag,
  FolderOpen,
  Trash2,
  MessageSquare,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

type Profile = {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  role: "admin" | "seller" | "buyer";
  is_seller: boolean;
  created_at: string;
  purchase_count?: number;
};

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
  const { t, language } = useI18n();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [newBrandName, setNewBrandName] = useState("");
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalPurchases: 0,
  });

  useEffect(() => {
    fetchProfiles();
    fetchStats();
    fetchPurchases();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch purchase counts for each user
      const profilesWithPurchases = await Promise.all(
        (data || []).map(async (profile) => {
          const { count } = await supabase
            .from("purchases")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.user_id);
          return { ...profile, purchase_count: count || 0 };
        })
      );
      
      setProfiles(profilesWithPurchases);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Total sellers
      const { count: totalSellers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "seller");

      // Total products
      const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // Total purchases
      const { count: totalPurchases } = await supabase
        .from("purchases")
        .select("*", { count: "exact", head: true });

      setStats({
        totalUsers: totalUsers || 0,
        totalSellers: totalSellers || 0,
        totalProducts: totalProducts || 0,
        totalPurchases: totalPurchases || 0,
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

  const handleUpdateBrandName = async () => {
    if (!editingProfile || !newBrandName.trim()) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: newBrandName.trim() })
        .eq("id", editingProfile.id);

      if (error) throw error;

      toast({
        title: "Brand name updated",
        description: `The name has been changed to "${newBrandName}".`,
      });

      setEditingProfile(null);
      setNewBrandName("");
      fetchProfiles();
    } catch (error) {
      console.error("Error updating brand name:", error);
      toast({
        title: "Error",
        description: "Unable to update the brand name.",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: "admin" | "seller" | "buyer"
  ) => {
    try {
      // Use the secure admin_update_user_role function instead of direct table update
      const { error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) throw error;

      toast({
        title: "Role updated",
        description: `The role has been changed to ${newRole}.`,
      });

      fetchProfiles();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: error.message || "Unable to update the role.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (profile: Profile) => {
    try {
      const { error } = await supabase.rpc('delete_user_and_data', {
        target_user_id: profile.user_id
      });

      if (error) throw error;

      toast({
        title: "Utilisateur supprimé",
        description: `${profile.full_name || profile.email} et toutes ses données ont été supprimés.`,
      });

      fetchProfiles();
      fetchStats();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'utilisateur.",
        variant: "destructive",
      });
    }
  };

  const handleProfilePictureChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    profileId: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const filePath = `public/${profileId}`;
    try {
      let uploadError = null;
      let uploadResult = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, { upsert: true });
      uploadError = uploadResult.error;

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profileId);

      if (updateError) throw updateError;

      toast({
        title: "Profile picture updated",
        description: `The profile picture has been updated.`,
      });

      fetchProfiles();
    } catch (error) {
      console.error("Error updating profile picture:", error);
      toast({
        title: "Error",
        description: "Unable to update the profile picture.",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
      case "seller":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "buyer":
        return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
      default:
        return "bg-muted text-muted-foreground";
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">{t.adminDashboard.users}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">{t.common.loading}</div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {profiles.map((profile) => (
                        <div
                          key={profile.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                            {profile.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt={profile.full_name || "Avatar"}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center">
                                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1 sm:flex-none">
                              <div className="font-medium text-sm sm:text-base truncate">
                                {profile.full_name || "Name not set"}
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground truncate">
                                {profile.email}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`${getRoleColor(profile.role)} text-xs`}>
                                {profile.role}
                              </Badge>
                              
                              {profile.purchase_count !== undefined && profile.purchase_count > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <ShoppingBag className="h-3 w-3 mr-1" />
                                  {profile.purchase_count} achat{profile.purchase_count > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {profile.role != "admin" && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingProfile(profile);
                                      setNewBrandName(profile.full_name || "");
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Edit profile of {profile.full_name}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="brandName">
                                        New brand name
                                      </Label>
                                      <Input
                                        id="brandName"
                                        value={newBrandName}
                                        onChange={(e) =>
                                          setNewBrandName(e.target.value)
                                        }
                                        placeholder="Brand name"
                                      />
                                    </div>

                                    <div>
                                      <Label>
                                        Update profile picture of{" "}
                                        {profile.full_name}
                                      </Label>
                                      <Input
                                        id="profilePicture"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                          handleProfilePictureChange(e, profile.id)
                                        }
                                      />
                                    </div>
                                    <Button
                                      onClick={handleUpdateBrandName}
                                      className="w-full"
                                    >
                                      Update
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}

                            <select
                              value={profile.role}
                              onChange={(e) =>
                                handleRoleChange(
                                  profile.user_id,
                                  e.target.value as any
                                )
                              }
                              className="text-sm border border-border rounded-md px-3 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="buyer">Buyer</option>
                              <option value="seller">Seller</option>
                              <option value="admin">Admin</option>
                            </select>

                            {profile.role != "admin" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cette action est irréversible. Toutes les données de{" "}
                                      <strong>{profile.full_name || profile.email}</strong> seront supprimées :
                                      <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Profil et compte</li>
                                        <li>Conversations et messages</li>
                                        <li>Produits mis en vente</li>
                                        <li>Projets créés</li>
                                        <li>Likes et commentaires</li>
                                      </ul>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(profile)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Supprimer définitivement
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
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
