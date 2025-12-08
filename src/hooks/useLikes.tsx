import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useLikes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        // Fetch user's likes if logged in
        if (user) {
          const { data: userLikes, error: userError } = await supabase
            .from('likes')
            .select('product_id')
            .eq('user_id', user.id);

          if (userError) throw userError;
          setLikedProducts(new Set(userLikes.map(like => like.product_id)));
        } else {
          setLikedProducts(new Set());
        }
      } catch (error) {
        console.error('Error fetching likes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikes();
  }, [user]);

  const fetchLikeCount = useCallback(async (productId: string) => {
    try {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId);

      if (error) throw error;
      setLikeCounts(prev => new Map(prev).set(productId, count || 0));
      return count || 0;
    } catch (error) {
      console.error('Error fetching like count:', error);
      return 0;
    }
  }, []);

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

    const isCurrentlyLiked = likedProducts.has(productId);
    const currentCount = likeCounts.get(productId) || 0;

    // Optimistic update
    if (isCurrentlyLiked) {
      setLikedProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      setLikeCounts(prev => new Map(prev).set(productId, Math.max(0, currentCount - 1)));
    } else {
      setLikedProducts(prev => new Set(prev).add(productId));
      setLikeCounts(prev => new Map(prev).set(productId, currentCount + 1));
    }

    try {
      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            product_id: productId,
          });

        if (error) throw error;
      }
    } catch (error) {
      // Rollback on error
      if (isCurrentlyLiked) {
        setLikedProducts(prev => new Set(prev).add(productId));
        setLikeCounts(prev => new Map(prev).set(productId, currentCount));
      } else {
        setLikedProducts(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        setLikeCounts(prev => new Map(prev).set(productId, currentCount));
      }
      console.error('Error toggling like:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le like.",
        variant: "destructive",
      });
    }
  };

  const isLiked = (productId: string) => likedProducts.has(productId);
  const getLikeCount = (productId: string) => likeCounts.get(productId) || 0;

  return { isLiked, toggleLike, loading, fetchLikeCount, getLikeCount };
};