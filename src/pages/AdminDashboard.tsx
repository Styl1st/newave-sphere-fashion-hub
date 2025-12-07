import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
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
import { useToast } from "@/hooks/use-toast";
import BrandNavbar from "@/components/BrandNavbar";
import { ProjectManager } from "@/components/ProjectManager";
import { ProjectProductManager } from "@/components/ProjectProductManager";
import {
  Settings,
  Edit,
  Users,
  Package,
  ShoppingBag,
  FolderOpen,
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
        title: "Role updated",
        description: `The role has been changed to ${newRole}.`,
      });

      fetchProfiles();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Unable to update the role.",
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

        <div className="mx-auto" style={{maxWidth: '90%', padding: '4% 2%'}}>
          <div style={{marginBottom: '4%'}}>
            <h1 className="font-bold flex items-center" style={{fontSize: '2.5vw', gap: '1%', marginBottom: '1%'}}>
              <Settings style={{height: '2vw', width: '2vw'}} />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground" style={{fontSize: '1vw'}}>
              Manage users, brands, and platform settings.
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4" style={{gap: '3%', marginBottom: '4%'}}>
            <Card>
              <CardHeader style={{paddingBottom: '1%'}}>
                <CardTitle className="font-medium flex items-center" style={{fontSize: '0.9vw', gap: '1%'}}>
                  <Users style={{height: '1vw', width: '1vw'}} />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold" style={{fontSize: '2vw'}}>{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader style={{paddingBottom: '1%'}}>
                <CardTitle className="font-medium flex items-center" style={{fontSize: '0.9vw', gap: '1%'}}>
                  <Users style={{height: '1vw', width: '1vw'}} />
                  Sellers/Brands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold" style={{fontSize: '2vw'}}>{stats.totalSellers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader style={{paddingBottom: '1%'}}>
                <CardTitle className="font-medium flex items-center" style={{fontSize: '0.9vw', gap: '1%'}}>
                  <Package style={{height: '1vw', width: '1vw'}} />
                  Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold" style={{fontSize: '2vw'}}>{stats.totalProducts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader style={{paddingBottom: '1%'}}>
                <CardTitle className="font-medium flex items-center" style={{fontSize: '0.9vw', gap: '1%'}}>
                  <ShoppingBag style={{height: '1vw', width: '1vw'}} />
                  Purchases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold" style={{fontSize: '2vw'}}>{stats.totalPurchases}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different admin sections */}
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading...</div>
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
                                {profile.full_name || "Name not set"}
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
                                <option value="buyer">Buyer</option>
                                <option value="seller">Seller</option>
                              </select>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
