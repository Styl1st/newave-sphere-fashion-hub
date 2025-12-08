import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
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
  const { t } = useI18n();
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
        title: t.cart.signInRequired,
        description: t.cart.signInMessage,
        variant: "destructive",
      });
      return;
    }

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast({
        title: t.auth.error,
        description: "Please fill in all fields",
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
        title: t.support.ticketSent,
      });
      
      setFormData({ type: defaultType, subject: '', message: '' });
      setOpen(false);
    } catch (error: any) {
      console.error('Error creating support ticket:', error);
      toast({
        title: t.auth.error,
        description: t.support.error,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'support': return t.support.generalSupport;
      case 'report_product': return t.support.reportProduct;
      case 'report_user': return t.support.reportUser;
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
      {defaultType === 'support' ? t.nav.support : t.products.report}
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
                {t.support.contactSupport}
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {t.support.reportIssue}
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!reportedProductId && !reportedUserId && (
            <div className="space-y-2">
              <Label>{t.support.requestType}</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">{t.support.generalSupport}</SelectItem>
                  <SelectItem value="report_product">{t.support.reportProduct}</SelectItem>
                  <SelectItem value="report_user">{t.support.reportUser}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {reportedProductName && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{t.support.reportProduct}:</p>
              <p className="font-medium">{reportedProductName}</p>
            </div>
          )}

          {reportedUserName && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{t.support.reportUser}:</p>
              <p className="font-medium">{reportedUserName}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">{t.support.subject}</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder=""
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t.support.message}</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder=""
              rows={5}
              maxLength={2000}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t.support.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t.common.loading : t.support.send}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
