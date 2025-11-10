import ProductCard from "./ProductCard";

const FeaturedProducts = () => {
  const products = [
    {
      name: "Minimalist Wool Coat",
      price: "285",
      category: "Outerwear",
      image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80",
    },
    {
      name: "Organic Cotton Tee",
      price: "65",
      category: "Essentials",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    },
    {
      name: "Tailored Linen Trousers",
      price: "145",
      category: "Bottoms",
      image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80",
    },
    {
      name: "Cashmere Knit Sweater",
      price: "195",
      category: "Knitwear",
      image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">Featured Collection</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Carefully selected pieces that embody our commitment to quality, sustainability, and timeless design.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <ProductCard key={index} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
