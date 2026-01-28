import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/hooks/useI18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, Edit, Trash2, ShoppingBag, Search, Filter, X } from 'lucide-react';

type Profile = {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  role: 'admin' | 'seller' | 'buyer';
  is_seller: boolean;
  created_at: string;
  purchase_count?: number;
};

export const UserSearchManager = () => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [newBrandName, setNewBrandName] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch purchase counts for each user
      const profilesWithPurchases = await Promise.all(
        (data || []).map(async (profile) => {
          const { count } = await supabase
            .from('purchases')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id);
          return { ...profile, purchase_count: count || 0 };
        })
      );

      setProfiles(profilesWithPurchases);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesSearch =
        searchQuery === '' ||
        profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'all' || profile.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [profiles, searchQuery, roleFilter]);

  const handleUpdateBrandName = async () => {
    if (!editingProfile || !newBrandName.trim()) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newBrandName.trim() })
        .eq('id', editingProfile.id);

      if (error) throw error;

      toast({
        title: 'Nom mis à jour',
        description: `Le nom a été changé en "${newBrandName}".`,
      });

      setEditingProfile(null);
      setNewBrandName('');
      fetchProfiles();
    } catch (error) {
      console.error('Error updating brand name:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le nom.',
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'seller' | 'buyer') => {
    try {
      const { error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: userId,
        new_role: newRole,
      });

      if (error) throw error;

      toast({
        title: 'Rôle mis à jour',
        description: `Le rôle a été changé en ${newRole}.`,
      });

      fetchProfiles();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le rôle.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (profile: Profile) => {
    try {
      const { error } = await supabase.rpc('delete_user_and_data', {
        target_user_id: profile.user_id,
      });

      if (error) throw error;

      toast({
        title: 'Utilisateur supprimé',
        description: `${profile.full_name || profile.email} et toutes ses données ont été supprimés.`,
      });

      fetchProfiles();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Impossible de supprimer l'utilisateur.",
        variant: 'destructive',
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
      const uploadResult = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, { upsert: true });

      if (uploadResult.error) throw uploadResult.error;

      const { data } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', profileId);

      if (updateError) throw updateError;

      toast({
        title: 'Photo mise à jour',
        description: 'La photo de profil a été mise à jour.',
      });

      fetchProfiles();
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la photo.',
        variant: 'destructive',
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      case 'seller':
        return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'buyer':
        return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setRoleFilter('all');
  }, []);

  const hasActiveFilters = searchQuery !== '' || roleFilter !== 'all';

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t.adminDashboard.users} ({filteredProfiles.length})
          </CardTitle>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="seller">Vendeur</SelectItem>
                <SelectItem value="buyer">Acheteur</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8">{t.common.loading}</div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              {hasActiveFilters
                ? 'Aucun utilisateur ne correspond à votre recherche'
                : 'Aucun utilisateur'}
            </p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Effacer les filtres
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'Avatar'}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 sm:flex-none">
                    <div className="font-medium text-sm sm:text-base truncate">
                      {profile.full_name || 'Nom non défini'}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground truncate">
                      {profile.email}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${getRoleColor(profile.role)} text-xs`}>{profile.role}</Badge>

                    {profile.purchase_count !== undefined && profile.purchase_count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <ShoppingBag className="h-3 w-3 mr-1" />
                        {profile.purchase_count} achat{profile.purchase_count > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {profile.role !== 'admin' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingProfile(profile);
                            setNewBrandName(profile.full_name || '');
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Modifier le profil de {profile.full_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="brandName">Nouveau nom</Label>
                            <Input
                              id="brandName"
                              value={newBrandName}
                              onChange={(e) => setNewBrandName(e.target.value)}
                              placeholder="Nom"
                            />
                          </div>

                          <div>
                            <Label>Mettre à jour la photo de profil</Label>
                            <Input
                              id="profilePicture"
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleProfilePictureChange(e, profile.id)}
                            />
                          </div>
                          <Button onClick={handleUpdateBrandName} className="w-full">
                            Mettre à jour
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  <Select
                    value={profile.role}
                    onValueChange={(value) =>
                      handleRoleChange(profile.user_id, value as 'admin' | 'seller' | 'buyer')
                    }
                  >
                    <SelectTrigger className="w-[110px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Acheteur</SelectItem>
                      <SelectItem value="seller">Vendeur</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  {profile.role !== 'admin' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Toutes les données de{' '}
                            <strong>{profile.full_name || profile.email}</strong> seront supprimées
                            :
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
  );
};
