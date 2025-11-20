import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-fashion.jpg";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image with Parallax-like effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      <div className="relative z-10 container mx-auto px-6 text-center text-white space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="space-y-4">
          <h2 className="text-sm md:text-base font-medium tracking-[0.2em] uppercase opacity-90">
            New Collection 2024
          </h2>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight leading-tight">
            Redefining <br className="hidden md:block" />
            <span className="italic font-light">Modern Luxury</span>
          </h1>
        </div>
        
        <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto leading-relaxed font-light">
          Discover our curated selection of premium essentials, designed for the contemporary individual who values quality and style.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link to="/products">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 min-w-[180px] h-14 text-base rounded-full">
              Shop Now
            </Button>
          </Link>
          <Link to="/products?category=new">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black min-w-[180px] h-14 text-base rounded-full bg-transparent">
              View Lookbook
            </Button>
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce duration-2000 text-white/70">
        <span className="text-xs uppercase tracking-widest mb-2 block text-center">Scroll</span>
        <ArrowRight className="h-5 w-5 rotate-90 mx-auto" />
      </div>
    </section>
  );
};

export default Hero;
