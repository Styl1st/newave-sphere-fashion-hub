import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useLikes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikes = async () => {
      if (!user) {
        setLikedProducts(new Set());
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('likes')
          .select('product_id')
          .eq('user_id', user.id);

        if (error) throw error;

        const productIds = new Set(data.map(like => like.product_id));
        setLikedProducts(productIds);
      } catch (error) {
        console.error('Error fetching likes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikes();
  }, [user]);

  const toggleLike = async (productId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour aimer un produit.",
        variant: "destructive",
      });
      return;
    }

    const isLiked = likedProducts.has(productId);

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;

        setLikedProducts(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            product_id: productId,
          });

        if (error) throw error;

        setLikedProducts(prev => new Set(prev).add(productId));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le like.",
        variant: "destructive",
      });
    }
  };

  const isLiked = (productId: string) => likedProducts.has(productId);

  return { isLiked, toggleLike, loading };
};