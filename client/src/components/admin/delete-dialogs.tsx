import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Category, Product } from "@shared/schema";

// Delete Category Confirmation Dialog Component
export function DeleteCategoryDialog({ 
  category, 
  onConfirm, 
  onCancel, 
  isDeleting 
}: { 
  category: Category | null; 
  onConfirm: () => void; 
  onCancel: () => void; 
  isDeleting: boolean;
}) {
  if (!category) return null;

  return (
    <Dialog open={!!category} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the category "{category.name}"? 
            <br /><br />
            <strong className="text-destructive">This will permanently delete:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>The category itself</li>
              <li>All products in this category</li>
              <li>All order items referencing these products</li>
            </ul>
            <br />
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Category & Products"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete Product Confirmation Dialog Component
export function DeleteProductDialog({ 
  product, 
  onConfirm, 
  onCancel, 
  isDeleting 
}: { 
  product: Product | null; 
  onConfirm: () => void; 
  onCancel: () => void; 
  isDeleting: boolean;
}) {
  if (!product) return null;

  return (
    <Dialog open={!!product} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the product "{product.name}"? 
            <br /><br />
            <strong className="text-destructive">This will:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Remove the product from the catalog</li>
              <li>Delete all associated image files</li>
              <li>Remove the product from any pending orders</li>
            </ul>
            <br />
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
