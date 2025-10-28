import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  getProduct,
  updateProduct,
  getCategories
} from "@/lib/api";
import { ImageUpload } from "@/components/ui/image-upload";
import type { Category, Product } from "@shared/schema";

export default function AdminProductEdit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get product ID from URL params
  const productId = new URLSearchParams(window.location.search).get('id') || '';

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    image: "",
    stock: 0,
    categoryId: "",
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => getCategories(),
  });

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['/api/products', productId],
    queryFn: () => getProduct(productId),
    enabled: !!productId,
  });

  // Update form data when product is loaded
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0),
        image: product.image || "",
        stock: product.stock || 0,
        categoryId: product.categoryId || "",
      });
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Product Updated",
        description: "Product has been updated successfully.",
      });
      setLocation('/admin');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update product.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.description || !formData.image || !formData.categoryId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields.",
      });
      return;
    }

    // Convert price to string for API compatibility
    const submitData = {
      ...formData,
      price: formData.price.toString()
    };
    
    updateMutation.mutate({ id: productId, data: submitData });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setLocation('/admin');
  };

  if (productLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
          <Button onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit Product</h1>
              <p className="text-muted-foreground">Update product information</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      placeholder="Enter product name"
                      data-testid="input-product-name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Category *</Label>
                    <Select 
                      value={formData.categoryId} 
                      onValueChange={(value) => handleInputChange('categoryId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesLoading ? (
                          <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                        ) : (
                          categories.map((category: Category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    required
                    placeholder="Enter product description"
                    rows={4}
                    data-testid="input-product-description"
                  />
                </div>

                {/* Price and Stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (NPR) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      required
                      placeholder="0.00"
                      data-testid="input-product-price"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                      required
                      placeholder="0"
                      data-testid="input-product-stock"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Product Image *</Label>
                  <ImageUpload
                    value={formData.image}
                    onChange={(imageUrl) => handleInputChange('image', imageUrl)}
                    className="mt-2"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending}
                    data-testid="button-save-product"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Update Product
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
