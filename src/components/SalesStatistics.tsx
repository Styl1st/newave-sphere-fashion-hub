import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Package, Euro, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type Sale = {
  id: string;
  quantity: number;
  price_paid: number;
  purchased_at: string;
  product: {
    id: string;
    name: string;
    images: string[] | null;
  } | null;
};

type ProductStats = {
  name: string;
  totalSales: number;
  totalRevenue: number;
  image?: string;
};

const COLORS = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))'
];

export const SalesStatistics = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [productStats, setProductStats] = useState<ProductStats[]>([]);

  useEffect(() => {
    if (user) {
      fetchSales();
    }
  }, [user]);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          quantity,
          price_paid,
          purchased_at,
          product_id,
          products (id, name, images)
        `)
        .eq('seller_id', user?.id)
        .order('purchased_at', { ascending: false });

      if (error) throw error;

      const formattedSales = (data || []).map((sale: any) => ({
        ...sale,
        product: sale.products,
      }));

      setSales(formattedSales);
      calculateProductStats(formattedSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProductStats = (salesData: Sale[]) => {
    const statsMap = new Map<string, ProductStats>();

    salesData.forEach((sale) => {
      if (!sale.product) return;
      const key = sale.product.id;
      const existing = statsMap.get(key);

      if (existing) {
        existing.totalSales += sale.quantity;
        existing.totalRevenue += sale.price_paid;
      } else {
        statsMap.set(key, {
          name: sale.product.name,
          totalSales: sale.quantity,
          totalRevenue: sale.price_paid,
          image: sale.product.images?.[0],
        });
      }
    });

    const sorted = Array.from(statsMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
    setProductStats(sorted);
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.price_paid, 0);
  const totalSales = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const averageOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Euro className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenus totaux</p>
                <p className="text-2xl font-bold">{totalRevenue.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <ShoppingCart className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commandes</p>
                <p className="text-2xl font-bold">{sales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-full">
                <Package className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Articles vendus</p>
                <p className="text-2xl font-bold">{totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Panier moyen</p>
                <p className="text-2xl font-bold">{averageOrderValue.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {sales.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Aucune vente pour le moment</h3>
            <p className="text-muted-foreground">Vos statistiques de vente apparaîtront ici</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Top Products by Revenue */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top produits par revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productStats.slice(0, 5)} layout="vertical">
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => `${value}€`}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const maxRevenue = Math.max(...productStats.slice(0, 5).map(p => p.totalRevenue));
                        const percent = ((data.totalRevenue / maxRevenue) * 100).toFixed(0);
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold text-foreground">{data.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Revenus: <span className="text-primary font-medium">{data.totalRevenue.toFixed(2)} €</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Ventes: <span className="text-foreground font-medium">{data.totalSales} unité{data.totalSales > 1 ? 's' : ''}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Prix moyen: <span className="text-foreground font-medium">{(data.totalRevenue / data.totalSales).toFixed(2)} €</span>
                            </p>
                            <div className="mt-2 pt-2 border-t border-border">
                              <p className="text-xs text-muted-foreground">
                                {percent}% du top produit
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="totalRevenue" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Sales Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Répartition des ventes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productStats.slice(0, 5)}
                    dataKey="totalSales"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={40}
                    paddingAngle={3}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                    label={({ cx, cy, midAngle, outerRadius, percent, name }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius * 1.2;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="hsl(var(--foreground))"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          fontSize={12}
                        >
                          {`${name.slice(0, 8)}${name.length > 8 ? '..' : ''} (${(percent * 100).toFixed(0)}%)`}
                        </text>
                      );
                    }}
                    labelLine={false}
                  >
                    {productStats.slice(0, 5).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const total = productStats.slice(0, 5).reduce((sum, p) => sum + p.totalSales, 0);
                        const percent = ((data.totalSales / total) * 100).toFixed(1);
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold text-foreground">{data.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Ventes: <span className="text-foreground font-medium">{data.totalSales}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Part: <span className="text-foreground font-medium">{percent}%</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Revenus: <span className="text-primary font-medium">{data.totalRevenue.toFixed(2)} €</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Best Sellers List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Meilleures ventes</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {productStats.map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                    >
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center rounded-full">
                        {index + 1}
                      </Badge>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.totalSales} vente{product.totalSales > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{product.totalRevenue.toFixed(2)} €</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Ventes récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {sales.slice(0, 20).map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center gap-4 p-3 rounded-lg border"
                    >
                      {sale.product?.images?.[0] ? (
                        <img
                          src={sale.product.images[0]}
                          alt={sale.product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{sale.product?.name || 'Produit supprimé'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sale.purchased_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{sale.price_paid.toFixed(2)} €</p>
                        <p className="text-xs text-muted-foreground">x{sale.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
