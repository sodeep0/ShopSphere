import React from 'react';
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/lib/imageUtils";
import type { Product } from "@shared/schema";

interface ProductsTabProps {
  products: Product[];
  categories: any[];
  onAddProduct: () => void;
  onEditProduct: (productId: string) => void;
  onDeleteProduct: (product: Product) => void;
}

export function ProductsTab({ 
  products, 
  categories, 
  onAddProduct, 
  onEditProduct, 
  onDeleteProduct 
}: ProductsTabProps) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));

  React.useEffect(() => {
    // clamp page to range when products or pageSize change
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [products.length, pageSize, totalPages]);

  const startIdx = (page - 1) * pageSize;
  const visibleProducts = products.slice(startIdx, startIdx + pageSize);
  const formatPrice = (price: number) => {
    return `NPR ${price.toLocaleString()}`;
  };

  const getCategoryName = (categoryId: string) => {
    // Try matching by id first (normal case), then by slug (in case data was stored differently)
    const byId = categories.find(cat => cat.id === categoryId);
    if (byId) return byId.name;
    const bySlug = categories.find(cat => cat.slug === categoryId);
    if (bySlug) return bySlug.name;
    // Fallback: if we have an id-like value, show a short snippet to help debugging
    if (categoryId) return `Unknown (${String(categoryId).slice(0, 8)})`;
    return 'Unknown Category';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Products</h2>
        <Button onClick={onAddProduct} data-testid="button-add-product">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleProducts.map((product: any) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <img
                      src={getImageUrl(product.image, 'thumbnail')}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">ID: {product.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize">
                  {getCategoryName(product.categoryId)}
                </TableCell>
                <TableCell>{formatPrice(product.price)}</TableCell>
                <TableCell>
                  <Badge variant={product.stock > 5 ? 'default' : 'destructive'}>
                    {product.stock} units
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={product.isActive ? 'default' : 'secondary'}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditProduct(product.id)}
                      data-testid={`button-edit-${product.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeleteProduct(product)}
                      data-testid={`button-delete-${product.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Pagination Controls */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Showing {startIdx + 1} - {Math.min(startIdx + pageSize, products.length)} of {products.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-muted-foreground">Per page:</label>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border rounded px-2 py-1"
              aria-label="Products per page"
            >
              {[5, 10, 20, 50].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Prev
            </Button>

            <div className="text-sm">
              Page {page} of {totalPages}
            </div>

            <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
