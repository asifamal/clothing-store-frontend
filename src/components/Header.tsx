import { Menu, Search, User, LogOut, X, Package, ShoppingBag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import CartIcon from "./CartIcon";
import CartDrawer from "./CartDrawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { name: "Home", path: "/#home" },
    { name: "Shop", path: "/#shop" },
    { name: "New Arrivals", path: "/#new-arrivals" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path.startsWith("/#")) {
      const id = path.replace("/#", "");
      if (location.pathname === "/") {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    } else if (path === "/" && location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 z-50 w-full transition-all duration-300 border-b border-transparent",
          scrolled ? "bg-background/80 backdrop-blur-md border-border py-2" : "bg-transparent py-4"
        )}
      >
        <div className="container mx-auto flex items-center justify-between px-6">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
              <SheetHeader className="p-6 border-b text-left">
                <SheetTitle className="font-serif text-2xl font-bold">NOTED.</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col py-6">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.path}>
                    <Link 
                      to={link.path}
                      className="px-6 py-4 text-lg font-medium hover:bg-secondary/50 transition-colors flex items-center justify-between group"
                    >
                      {link.name}
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </Link>
                  </SheetClose>
                ))}
                {isAuthenticated && (
                  <>
                    <div className="h-px bg-border my-2 mx-6" />
                    <SheetClose asChild>
                      <Link 
                        to="/profile"
                        className="px-6 py-4 text-lg font-medium hover:bg-secondary/50 transition-colors flex items-center justify-between group"
                      >
                        Profile
                        <User className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link 
                        to="/orders"
                        className="px-6 py-4 text-lg font-medium hover:bg-secondary/50 transition-colors flex items-center justify-between group"
                      >
                        Orders
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </SheetClose>
                    <button 
                      onClick={handleLogout}
                      className="px-6 py-4 text-lg font-medium hover:bg-red-50 text-red-600 transition-colors flex items-center justify-between text-left w-full"
                    >
                      Logout
                      <LogOut className="h-4 w-4" />
                    </button>
                  </>
                )}
                {!isAuthenticated && (
                  <div className="p-6 mt-4">
                    <SheetClose asChild>
                      <Button className="w-full h-11 text-base" onClick={() => navigate('/login')}>
                        Sign In
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                onClick={(e) => handleNavClick(e, link.path)}
                className="text-sm font-medium tracking-wide hover:text-muted-foreground transition-colors uppercase"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Logo */}
          <Link to="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="text-2xl md:text-3xl font-bold tracking-tighter">
              NOTED.
            </span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {searchOpen ? (
              <div className="absolute inset-0 bg-background z-50 flex items-center justify-center px-4 animate-in fade-in slide-in-from-top-2">
                <form onSubmit={handleSearch} className="w-full max-w-2xl flex items-center gap-4">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products..."
                    className="flex-1 bg-transparent border-none text-lg focus:outline-none placeholder:text-muted-foreground/50"
                    autoFocus
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setSearchOpen(false)}>
                    <X className="h-6 w-6" />
                  </Button>
                </form>
              </div>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="hover:bg-transparent">
                <Search className="h-5 w-5" />
              </Button>
            )}
            
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-transparent hidden md:flex">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                    Signed in as <span className="text-foreground">{user.username}</span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" /> Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className="hidden md:block">
                <Button variant="ghost" size="icon" className="hover:bg-transparent">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}

            <CartIcon onClick={() => setCartOpen(true)} />
          </div>
        </div>
      </header>
      
      <CartDrawer 
        isOpen={cartOpen} 
        onClose={() => setCartOpen(false)} 
      />
    </>
  );
};

export default Header;
