import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/hooks/useI18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Flag, User, Package, Clock, CheckCircle, XCircle, Store } from 'lucide-react';

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  type: string;
  reported_product_id: string | null;
  reported_user_id: string | null;
  status: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  user?: { full_name: string | null; email: string | null };
  product?: { name: string } | null;
  reported_user?: { full_name: string | null; email: string | null } | null;
}

export const SupportTicketManager = () => {
  const { toast } = useToast();
  const { t } = useI18n();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch additional info for each ticket
      const ticketsWithDetails = await Promise.all(
        (data || []).map(async (ticket) => {
          const [userResult, productResult, reportedUserResult] = await Promise.all([
            supabase.from('profiles').select('full_name, email').eq('user_id', ticket.user_id).maybeSingle(),
            ticket.reported_product_id 
              ? supabase.from('products').select('name').eq('id', ticket.reported_product_id).maybeSingle()
              : Promise.resolve({ data: null }),
            ticket.reported_user_id
              ? supabase.from('profiles').select('full_name, email').eq('user_id', ticket.reported_user_id).maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          return {
            ...ticket,
            user: userResult.data || undefined,
            product: productResult.data,
            reported_user: reportedUserResult.data,
          };
        })
      );

      setTickets(ticketsWithDetails);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;

    try {
      const updates: any = {};
      if (newStatus) updates.status = newStatus;
      if (response.trim()) updates.admin_response = response;

      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', selectedTicket.id);

      if (error) throw error;

      // If approving a seller request, update the user's role
      if (selectedTicket.type === 'seller_request' && newStatus === 'resolved') {
        await supabase
          .from('profiles')
          .update({ role: 'seller', is_seller: true })
          .eq('user_id', selectedTicket.user_id);
      }

      toast({
        title: t.tickets.update,
        description: selectedTicket.type === 'seller_request' && newStatus === 'resolved' 
          ? "L'utilisateur a été promu vendeur" 
          : "Le ticket a été mis à jour avec succès",
      });

      setSelectedTicket(null);
      setResponse('');
      setNewStatus('');
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: t.auth.error,
        description: "Impossible de mettre à jour le ticket",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive" className="gap-1"><Clock className="h-3 w-3" />{t.tickets.open}</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 gap-1"><Clock className="h-3 w-3" />{t.tickets.inProgress}</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1"><CheckCircle className="h-3 w-3" />{t.tickets.resolved}</Badge>;
      case 'closed':
        return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" />{t.tickets.closed}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'support':
        return <Badge variant="outline" className="gap-1"><MessageSquare className="h-3 w-3" />{t.tickets.supportType}</Badge>;
      case 'report_product':
        return <Badge variant="outline" className="gap-1 text-orange-600 border-orange-500/30"><Package className="h-3 w-3" />{t.tickets.reportedProduct}</Badge>;
      case 'report_user':
        return <Badge variant="outline" className="gap-1 text-red-600 border-red-500/30"><Flag className="h-3 w-3" />{t.tickets.reportedUser}</Badge>;
      case 'seller_request':
        return <Badge variant="outline" className="gap-1 text-purple-600 border-purple-500/30"><Store className="h-3 w-3" />{t.tickets.sellerRequest}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tickets de support ({tickets.length})</h3>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Aucun ticket pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => {
              setSelectedTicket(ticket);
              setNewStatus(ticket.status);
              setResponse(ticket.admin_response || '');
            }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getTypeBadge(ticket.type)}
                      {getStatusBadge(ticket.status)}
                    </div>
                    <h4 className="font-medium">{ticket.subject}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.user?.full_name || ticket.user?.email || 'Utilisateur inconnu'}
                      </span>
                      <span>{new Date(ticket.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {ticket.product && (
                      <p className="text-xs text-orange-600">Produit: {ticket.product.name}</p>
                    )}
                    {ticket.reported_user && (
                      <p className="text-xs text-red-600">Utilisateur signalé: {ticket.reported_user.full_name || ticket.reported_user.email}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails du ticket</DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getTypeBadge(selectedTicket.type)}
                {getStatusBadge(selectedTicket.status)}
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">De:</p>
                <p className="font-medium">{selectedTicket.user?.full_name || selectedTicket.user?.email}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Sujet:</p>
                <p className="font-medium">{selectedTicket.subject}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Message:</p>
                <p className="p-3 bg-muted rounded-lg text-sm">{selectedTicket.message}</p>
              </div>

              {selectedTicket.product && (
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <p className="text-sm text-orange-600">Produit signalé: {selectedTicket.product.name}</p>
                </div>
              )}

              {selectedTicket.reported_user && (
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <p className="text-sm text-red-600">
                    Utilisateur signalé: {selectedTicket.reported_user.full_name || selectedTicket.reported_user.email}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Statut:</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Ouvert</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="resolved">Résolu</SelectItem>
                    <SelectItem value="closed">Fermé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Réponse admin:</p>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Écrivez votre réponse..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                  Fermer
                </Button>
                <Button onClick={handleUpdateTicket}>
                  Mettre à jour
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
