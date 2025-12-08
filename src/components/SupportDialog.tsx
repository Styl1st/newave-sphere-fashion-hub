import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { HelpCircle, Flag, AlertTriangle } from 'lucide-react';

interface SupportDialogProps {
  trigger?: React.ReactNode;
  defaultType?: 'support' | 'report_product' | 'report_user';
  reportedProductId?: string;
  reportedProductName?: string;
  reportedUserId?: string;
  reportedUserName?: string;
}

export const SupportDialog = ({
  trigger,
  defaultType = 'support',
  reportedProductId,
  reportedProductName,
  reportedUserId,
  reportedUserName,
}: SupportDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: defaultType,
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour contacter le support",
        variant: "destructive",
      });
      return;
    }

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          type: formData.type,
          subject: formData.subject,
          message: formData.message,
          reported_product_id: reportedProductId || null,
          reported_user_id: reportedUserId || null,
        });

      if (error) throw error;

      toast({
        title: "Message envoyé",
        description: "Notre équipe vous répondra dans les plus brefs délais",
      });
      
      setFormData({ type: defaultType, subject: '', message: '' });
      setOpen(false);
    } catch (error: any) {
      console.error('Error creating support ticket:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'support': return 'Support général';
      case 'report_product': return 'Signaler un produit';
      case 'report_user': return 'Signaler un utilisateur';
      default: return type;
    }
  };

  const getIcon = () => {
    switch (defaultType) {
      case 'report_product':
      case 'report_user':
        return <Flag className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      {getIcon()}
      {defaultType === 'support' ? 'Support' : 'Signaler'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {defaultType === 'support' ? (
              <>
                <HelpCircle className="h-5 w-5" />
                Contacter le Support
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Signaler un problème
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!reportedProductId && !reportedUserId && (
            <div className="space-y-2">
              <Label>Type de demande</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">Support général</SelectItem>
                  <SelectItem value="report_product">Signaler un produit</SelectItem>
                  <SelectItem value="report_user">Signaler un utilisateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {reportedProductName && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Produit signalé:</p>
              <p className="font-medium">{reportedProductName}</p>
            </div>
          )}

          {reportedUserName && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Utilisateur signalé:</p>
              <p className="font-medium">{reportedUserName}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Sujet</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Décrivez brièvement votre demande"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Décrivez votre problème ou votre demande en détail..."
              rows={5}
              maxLength={2000}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
