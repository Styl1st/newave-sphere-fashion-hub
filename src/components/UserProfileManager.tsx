import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Camera } from "lucide-react";
import { profileSchema, validateForm } from "@/lib/validations";

const MAX_NAME_LENGTH = 100;
const MAX_BIO_LENGTH = 500;

type Profile = {
  user_id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  is_seller: boolean;
};

export const UserProfileManager = () => {
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
        .maybeSingle();

      if (error) {
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
        .maybeSingle();

      if (existingProfile) {
        // Profile exists, update it
        const { error } = await supabase
          .from("profiles")
          .update({
            role: 'buyer',
            is_seller: false,
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
            role: 'buyer',
            is_seller: false,
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

    // Validate form data
    const validation = validateForm(profileSchema, formData);
    if (!validation.success) {
      const errors = 'errors' in validation ? validation.errors : {};
      toast({
        title: "Erreur de validation",
        description: Object.values(errors)[0] || "Veuillez vérifier les champs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        full_name: validation.data.full_name,
        bio: validation.data.bio,
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
          Mon profil
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
              onChange={(e) => {
                const value = e.target.value.slice(0, MAX_NAME_LENGTH);
                setFormData((prev) => ({ ...prev, full_name: value }));
              }}
              placeholder="Votre nom complet ou pseudo"
              maxLength={MAX_NAME_LENGTH}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {formData.full_name.length}/{MAX_NAME_LENGTH}
            </p>
          </div>

          <div>
            <Label htmlFor="bio">À propos de moi</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => {
                const value = e.target.value.slice(0, MAX_BIO_LENGTH);
                setFormData((prev) => ({ ...prev, bio: value }));
              }}
              placeholder="Décrivez-vous en quelques mots..."
              rows={4}
              maxLength={MAX_BIO_LENGTH}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {formData.bio.length}/{MAX_BIO_LENGTH}
            </p>
          </div>

          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-xl">
            <p className="font-medium mb-1">Email :</p>
            <p>{user?.email}</p>
            <p className="text-xs mt-2">
              Votre email est utilisé pour la connexion et les communications importantes.
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