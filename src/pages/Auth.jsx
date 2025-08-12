import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: "Connect Supabase to enable auth",
      description:
        "To enable brand sign up and login, connect your project to Supabase (green button top right).",
    });
  };

  return (
    <main className="min-h-[70vh] container mx-auto py-16">
      <h1 className="text-3xl font-semibold mb-4">Brand authentication</h1>
      <p className="text-muted-foreground max-w-prose mb-8">
        This is a placeholder. Once Supabase is connected, we’ll enable secure email/password authentication for brand accounts.
      </p>
      <div className="flex gap-4">
        <Button onClick={handleClick}>Sign in</Button>
        <Button variant="secondary" onClick={handleClick}>
          Create brand account
        </Button>
      </div>
    </main>
  );
};

export default Auth;
