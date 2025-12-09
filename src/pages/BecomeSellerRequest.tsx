import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import BrandNavbar from '@/components/BrandNavbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Store, Send, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const BecomeSellerRequest = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [brandName, setBrandName] = useState('');
  const [motivation, setMotivation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !motivation.trim() || !brandName.trim()) {
      toast({
        title: t.auth.error,
        description: t.sellerRequest.fillAllFields,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create a support ticket of type "seller_request"
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          type: 'seller_request',
          subject: `${t.sellerRequest.requestTitle}: ${brandName}`,
          message: motivation,
          status: 'open',
        });

      if (error) throw error;

      toast({
        title: t.sellerRequest.requestSent,
        description: t.sellerRequest.requestSentMessage,
      });

      navigate('/');
    } catch (error) {
      console.error('Error submitting seller request:', error);
      toast({
        title: t.auth.error,
        description: t.support.error,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['buyer']}>
      <div className="min-h-screen bg-animated-fade">
        <BrandNavbar />
        
        <div className="mx-auto max-w-2xl px-4 py-12">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            {t.nav.home}
          </Link>
          
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">{t.sellerRequest.title}</CardTitle>
              <CardDescription className="text-base">
                {t.sellerRequest.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="brandName">{t.sellerRequest.brandName}</Label>
                  <Input
                    id="brandName"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder={t.sellerRequest.brandNamePlaceholder}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="motivation">{t.sellerRequest.motivation}</Label>
                  <Textarea
                    id="motivation"
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder={t.sellerRequest.motivationPlaceholder}
                    rows={6}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    {t.sellerRequest.motivationHint}
                  </p>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    t.common.loading
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {t.sellerRequest.submit}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default BecomeSellerRequest;
