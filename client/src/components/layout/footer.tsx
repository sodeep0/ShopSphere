import { Mountain, Facebook, Instagram, Twitter, MapPin, Phone, Mail, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/lib/api";
import { Link } from "wouter";
import type { Category } from "@shared/schema";

export function Footer() {
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => getCategories(),
  });

  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Mountain className="text-primary-foreground w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Krisha Krafts</h3>
                <p className="text-xs text-muted-foreground">Authentic Nepal</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Connecting Nepal with the world through beautiful, handcrafted treasures that tell stories of tradition and culture.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-twitter">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Categories</h4>
            {categoriesLoading ? (
              <ul className="space-y-2 text-sm">
                {[...Array(4)].map((_, i) => (
                  <li key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2 text-sm">
                {categories.map((category: Category) => (
                  <li key={category.id}>
                    <Link 
                      href={`/products?category=${category.slug}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      data-testid={`link-${category.slug}`}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-contact">Contact Us</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-shipping">Shipping Info</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-returns">Return Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-faq">FAQ</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="text-primary w-4 h-4" />
                <span className="text-muted-foreground">Kathmandu, Nepal</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="text-primary w-4 h-4" />
                <span className="text-muted-foreground">+977-1-XXXXXXX</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="text-primary w-4 h-4" />
                <span className="text-muted-foreground">info@krishakrafts.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck className="text-primary w-4 h-4" />
                <span className="text-muted-foreground">COD across Nepal</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Krisha Krafts. All rights reserved. Made with ❤️ in Nepal.</p>
        </div>
      </div>
    </footer>
  );
}
