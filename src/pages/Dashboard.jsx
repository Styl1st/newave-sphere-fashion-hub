import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Stat = ({ label, value }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base text-muted-foreground">{label}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-semibold">{value}</div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  return (
    <main className="min-h-[70vh] container mx-auto py-10">
      <h1 className="text-3xl font-semibold">Brand dashboard</h1>
      <p className="text-muted-foreground mt-2 max-w-prose">
        This demo shows placeholder metrics. Connect Supabase to power real-time sales and traffic analytics for your brand.
      </p>
      <section className="grid gap-6 mt-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Product views" value="12,480" />
        <Stat label="Profile visits" value="3,214" />
        <Stat label="Items wishlisted" value="892" />
        <Stat label="Conversion rate" value="2.3%" />
      </section>
    </main>
  );
};

export default Dashboard;
