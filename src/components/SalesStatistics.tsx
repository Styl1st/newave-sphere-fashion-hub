import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Package, Euro, ShoppingCart, Heart } from 'lucide-react';
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
  likes?: number;
  productId?: string;
};

type LikeStats = {
  productId: string;
  productName: string;
  likes: number;
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
  const { t } = useI18n();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [productStats, setProductStats] = useState<ProductStats[]>([]);
  const [likeStats, setLikeStats] = useState<LikeStats[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);

  useEffect(() => {
    if (user) {
      fetchSales();
      fetchLikeStats();
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

  const fetchLikeStats = async () => {
    try {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, images')
        .eq('user_id', user?.id);

      if (productsError) throw productsError;

      if (!products || products.length === 0) {
        setLikeStats([]);
        setTotalLikes(0);
        return;
      }

      const productIds = products.map(p => p.id);
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('product_id')
        .in('product_id', productIds);

      if (likesError) throw likesError;

      const likesMap = new Map<string, number>();
      (likes || []).forEach(like => {
        likesMap.set(like.product_id, (likesMap.get(like.product_id) || 0) + 1);
      });

      const stats: LikeStats[] = products
        .map(product => ({
          productId: product.id,
          productName: product.name,
          likes: likesMap.get(product.id) || 0,
          image: product.images?.[0],
        }))
        .filter(s => s.likes > 0)
        .sort((a, b) => b.likes - a.likes);

      setLikeStats(stats);
      setTotalLikes(stats.reduce((sum, s) => sum + s.likes, 0));
    } catch (error) {
      console.error('Error fetching like stats:', error);
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
                <p className="text-sm text-muted-foreground">{t.statistics.totalRevenue}</p>
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
                <p className="text-sm text-muted-foreground">{t.statistics.orders}</p>
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
                <p className="text-sm text-muted-foreground">{t.statistics.itemsSold}</p>
                <p className="text-2xl font-bold">{totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-full">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total likes</p>
                <p className="text-2xl font-bold">{totalLikes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {sales.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">{t.statistics.noSales}</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Top Products by Revenue */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.statistics.topProducts}</CardTitle>
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
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold text-foreground">{data.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {t.statistics.totalRevenue}: <span className="text-primary font-medium">{data.totalRevenue.toFixed(2)} €</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {t.statistics.itemsSold}: <span className="text-foreground font-medium">{data.totalSales}</span>
                            </p>
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
              <CardTitle className="text-lg">{t.statistics.salesDistribution}</CardTitle>
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
                              {t.statistics.itemsSold}: <span className="text-foreground font-medium">{data.totalSales}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {t.statistics.totalRevenue}: <span className="text-primary font-medium">{data.totalRevenue.toFixed(2)} €</span>
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
              <CardTitle className="text-lg">{t.statistics.bestSellers}</CardTitle>
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
                          {product.totalSales} {t.statistics.itemsSold}
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

          {/* Likes Statistics */}
          {likeStats.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  {t.statistics.mostLiked}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {likeStats.map((product, index) => (
                      <div
                        key={product.productId}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                      >
                        <Badge variant="outline" className="w-8 h-8 flex items-center justify-center rounded-full">
                          {index + 1}
                        </Badge>
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.productName}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.productName}</p>
                        </div>
                        <div className="flex items-center gap-1 text-red-500">
                          <Heart className="h-4 w-4 fill-current" />
                          <span className="font-bold">{product.likes}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Recent Sales */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">{t.statistics.recentSales}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {sales.slice(0, 10).map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                    >
                      {sale.product?.images?.[0] ? (
                        <img
                          src={sale.product.images[0]}
                          alt={sale.product?.name || ''}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{sale.product?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.quantity}x {t.statistics.soldFor} {sale.price_paid.toFixed(2)} €
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {new Date(sale.purchased_at).toLocaleDateString()}
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
