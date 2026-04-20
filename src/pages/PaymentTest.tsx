import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { User } from '@supabase/supabase-js';

const PaymentTest = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testAmount, setTestAmount] = useState('10.00');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setAuthLoading(false);
      } catch (err) {
        console.error('Error getting user:', err);
        setAuthLoading(false);
      }
    };

    getUser();
  }, []);

  const handleTestPayment = async () => {
    setError(null);
    
    if (!user) {
      setError('Vous devez être connecté pour tester les paiements');
      return;
    }

    setLoading(true);

    try {
      console.log('Initiating test payment...');
      
      const testItems = [{
        productId: 'test-product-123',
        name: 'Produit de Test',
        brand: 'Newave Fashion',
        price: parseFloat(testAmount),
        quantity: 1,
        image: 'https://via.placeholder.com/150',
        sellerId: user.id
      }];

      console.log('Test items:', testItems);

      const { data, error: functionError } = await supabase.functions.invoke('create-checkout', {
        body: { items: testItems },
      });

      console.log('Response:', { data, error: functionError });

      if (functionError) {
        throw new Error(functionError.message || 'Erreur lors de l\'appel de la fonction');
      }

      if (data?.url) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = data.url;
        }, 1000);
      } else {
        throw new Error('Aucune URL de paiement reçue');
      }
    } catch (err: any) {
      console.error('Erreur de paiement test:', err);
      const errorMsg = err.message || 'Impossible de créer la session de paiement';
      setError(errorMsg);
      toast({
        title: "Erreur de paiement",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <CreditCard className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Test des Paiements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">Redirection vers Stripe Checkout...</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!user && !authLoading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Vous devez être connecté pour tester les paiements</AlertDescription>
            </Alert>
          )}

          {user && (
            <>
              <div className="space-y-2">
                <Label htmlFor="amount">Montant du test (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.50"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  placeholder="10.00"
                />
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Instructions de test:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Utilisez les cartes de test Stripe:</li>
                  <li>• Succès: 4242 4242 4242 4242</li>
                  <li>• Échec: 4000 0000 0000 0002</li>
                  <li>• N'importe quelle date future et CVC</li>
                </ul>
              </div>

              <Button
                onClick={handleTestPayment}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création du paiement...
                  </>
                ) : (
                  `Tester le paiement - ${testAmount} €`
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentTest;