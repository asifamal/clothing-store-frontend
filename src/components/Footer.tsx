import { Instagram, Facebook, Twitter, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Section */}
          <div className="md:col-span-4 space-y-6">
            <h3 className="text-3xl font-serif font-bold tracking-tighter">NOTED.</h3>
            <p className="text-primary-foreground/60 max-w-xs leading-relaxed">
              Elevating everyday essentials with timeless design and premium materials. Crafted for the modern individual.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Links Sections */}
          <div className="md:col-span-2">
            <h4 className="font-medium mb-6 text-sm uppercase tracking-widest text-primary-foreground/40">Shop</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white text-primary-foreground/80 transition-colors">New Arrivals</a></li>
              <li><a href="#" className="hover:text-white text-primary-foreground/80 transition-colors">Best Sellers</a></li>
              <li><a href="#" className="hover:text-white text-primary-foreground/80 transition-colors">Accessories</a></li>
              <li><a href="#" className="hover:text-white text-primary-foreground/80 transition-colors">Sale</a></li>
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h4 className="font-medium mb-6 text-sm uppercase tracking-widest text-primary-foreground/40">Support</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white text-primary-foreground/80 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-white text-primary-foreground/80 transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-white text-primary-foreground/80 transition-colors">Size Guide</a></li>
              <li><a href="#" className="hover:text-white text-primary-foreground/80 transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-4">
            <h4 className="font-medium mb-6 text-sm uppercase tracking-widest text-primary-foreground/40">Stay in the loop</h4>
            <p className="text-primary-foreground/60 text-sm mb-4">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/30 focus-visible:ring-primary-foreground/20"
              />
              <Button type="submit" variant="secondary">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-primary-foreground/40">
          <p>&copy; 2024 NOTED STORE. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary-foreground/80 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary-foreground/80 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
