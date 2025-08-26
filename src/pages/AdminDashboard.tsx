import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import BrandNavbar from "@/components/BrandNavbar";
import {
  Settings,
  Edit,
  Ban,
  UserCheck,
  Users,
  Package,
  ShoppingBag,
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
};

type Stats = {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalPurchases: number;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
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

  const handleUpdateBrandName = async () => {
    if (!editingProfile || !newBrandName.trim()) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: newBrandName.trim() })
        .eq("id", editingProfile.id);

      if (error) throw error;

      toast({
        title: "Nom de marque mis à jour",
        description: `Le nom a été changé pour "${newBrandName}".`,
      });

      setEditingProfile(null);
      setNewBrandName("");
      fetchProfiles();
    } catch (error) {
      console.error("Error updating brand name:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le nom de marque.",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (
    profileId: string,
    newRole: "admin" | "seller" | "buyer"
  ) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: newRole,
          is_seller: newRole === "seller",
        })
        .eq("id", profileId);

      if (error) throw error;

      toast({
        title: "Rôle mis à jour",
        description: `Le rôle a été changé pour ${newRole}.`,
      });

      fetchProfiles();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le rôle.",
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
      // Essayer d'uploader (si le fichier existe déjà, update le)
      let uploadError = null;
      let uploadResult = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, { upsert: true });
      uploadError = uploadResult.error;

      if (uploadError) throw uploadError;

      // Récupérer l'URL publique
      const { data } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Mettre à jour le champ avatar_url dans la table profiles
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profileId);

      if (updateError) throw updateError;

      toast({
        title: "Photo de profil mise à jour",
        description: `La photo de profil de ${profileId} a été mise à jour.`,
      });

      fetchProfiles();
    } catch (error) {
      console.error("Error updating profile picture:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la photo de profil.",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "seller":
        return "bg-blue-100 text-blue-800";
      case "buyer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-animated-fade">
        <BrandNavbar />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
              <Settings className="h-8 w-8" />
              Panneau d'Administration
            </h1>
            <p className="text-muted-foreground">
              Gérez les utilisateurs, les marques et les paramètres de la
              plateforme.
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Vendeurs/Marques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSellers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Achats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPurchases}</div>
              </CardContent>
            </Card>
          </div>

          {/* Users Management */}
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : (
                <div className="space-y-4">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.full_name || "Avatar"}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}

                        <div>
                          <div className="font-medium">
                            {profile.full_name || "Nom non défini"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {profile.email}
                          </div>
                        </div>

                        <Badge className={getRoleColor(profile.role)}>
                          {profile.role}
                        </Badge>
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
                                  Modifier le profil de {profile.full_name}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="brandName">
                                    Nouveau nom de marque
                                  </Label>
                                  <Input
                                    id="brandName"
                                    value={newBrandName}
                                    onChange={(e) =>
                                      setNewBrandName(e.target.value)
                                    }
                                    placeholder="Nom de la marque"
                                  />
                                </div>

                                <div>
                                  <Label>
                                    Modifier la photo de profil de{" "}
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
                                  Mettre à jour
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        {profile.role != "admin" && (
                          <select
                            value={profile.role}
                            onChange={(e) =>
                              handleRoleChange(
                                profile.id,
                                e.target.value as any
                              )
                            }
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="buyer">Acheteur</option>
                            <option value="seller">Vendeur</option>
                            {/* <option value="admin">Admin</option> */}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
