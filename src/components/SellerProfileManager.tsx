import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Upload, Camera } from "lucide-react";

type Profile = {
  user_id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  is_seller: boolean;
};

export const SellerProfileManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          bio: data.bio || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: data.publicUrl });

      toast({
        title: "Photo de profil mise à jour",
        description: "Votre photo de profil a été changée avec succès.",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la photo de profil",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingProfile) {
        // Profile exists, update it
        const { error } = await supabase
          .from("profiles")
          .update({
            is_seller: true,
            ...updates,
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Profile doesn't exist, create it
        const { error } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            email: user.email,
            is_seller: true,
            ...updates,
          });

        if (error) throw error;
      }

      // Refresh profile data
      await fetchProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await updateProfile({
        full_name: formData.full_name,
        bio: formData.bio,
      });

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-background/80 backdrop-blur border rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Mon profil vendeur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Photo de profil"
                className="w-20 h-20 rounded-full object-cover border-4 border-background shadow-elegant"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted border-4 border-background shadow-elegant flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
              className="hidden"
              id="avatar-upload"
              disabled={uploading}
            />
            <label
              htmlFor="avatar-upload"
              className="absolute -bottom-2 -right-2 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
            >
              <Camera className="h-3 w-3" />
            </label>
          </div>
          
          {uploading && (
            <p className="text-sm text-muted-foreground">
              Téléchargement en cours...
            </p>
          )}
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nom complet</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, full_name: e.target.value }))
              }
              placeholder="Votre nom de marque ou nom complet"
            />
          </div>

          <div>
            <Label htmlFor="bio">Biographie</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Décrivez votre marque, votre style, votre histoire..."
              rows={4}
            />
          </div>

          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-xl">
            <p className="font-medium mb-1">Email public :</p>
            <p>{user?.email}</p>
            <p className="text-xs mt-2">
              Votre email sera visible sur votre profil public pour que les acheteurs puissent vous contacter.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Sauvegarde..." : "Sauvegarder le profil"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};