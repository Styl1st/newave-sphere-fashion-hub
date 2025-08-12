import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BrandNavbar = () => {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b">
      <nav className="container mx-auto flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">NeWave Sphere</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost">Home</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <Link to="/auth">
            <Button variant="hero">Sell with us</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default BrandNavbar;
