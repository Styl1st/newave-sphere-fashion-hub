import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const usePurchases = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchasing, setPurchasing] = useState(false);

  const purchaseProduct = async (productId: string, sellerId: string, price: number, quantity: number = 1) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour acheter",
        variant: "destructive",
      });
      return false;
    }

    if (user.id === sellerId) {
      toast({
        title: "Action impossible",
        description: "Vous ne pouvez pas acheter votre propre produit",
        variant: "destructive",
      });
      return false;
    }

    setPurchasing(true);
    try {
      const { error } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          product_id: productId,
          seller_id: sellerId,
          price_paid: price * quantity,
          quantity,
        });

      if (error) throw error;

      toast({
        title: "Achat effectué !",
        description: "Votre achat a été enregistré avec succès",
      });
      return true;
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de finaliser l'achat",
        variant: "destructive",
      });
      return false;
    } finally {
      setPurchasing(false);
    }
  };

  return { purchaseProduct, purchasing };
};
