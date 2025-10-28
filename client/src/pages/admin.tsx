import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAdminStats, 
  getAdminOrders, 
  updateOrderStatus, 
  deleteProduct,
  getCategories,
  getProducts,
  deleteCategory,
  clearAuthToken,
  getAuthToken 
} from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CSVImport,
  LoginForm,
  AdminSidebar,
  AdminStats,
  ProductsTab,
  CategoriesTab,
  OrdersTab,
  OrderDetailsView,
  CategoryForm,
  DeleteCategoryDialog,
    DeleteProductDialog,
    AnalyticsTab
} from "@/components/admin";
import type { Category, Product, OrderWithItems } from "@shared/schema";


export default function Admin() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const [activeTab, setActiveTab] = useState("products");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showOrderDetailsDialog, setShowOrderDetailsDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: isAuthenticated,
  }) as { data: any };

  const { data: orders = [] } = useQuery({
    queryKey: ['/api/admin/orders'],
    queryFn: () => getAdminOrders(),
    enabled: isAuthenticated && activeTab === 'orders',
  }) as { data: any[] };

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => getProducts(),
    enabled: isAuthenticated && activeTab === 'products',
  }) as { data: any[] };

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => getCategories(),
    // Fetch categories when either categories tab or products tab is active
    enabled: isAuthenticated && (activeTab === 'categories' || activeTab === 'products'),
  }) as { data: any[] };

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) => 
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setProductToDelete(null);
      toast({
        title: "Product Deleted",
        description: "Product has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "Failed to delete product.",
      });
    },
  });


  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setCategoryToDelete(null);
      toast({
        title: "Category Deleted",
        description: "Category and all associated products have been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "Failed to delete category.",
      });
    },
  });

  const handleLogout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
  };


  if (!isAuthenticated) {
    return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-panel">
      <div className="h-screen flex">
        {/* Sidebar */}
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto h-full">
          {/* Header */}
          <div className="bg-card border-b border-border p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">
                {activeTab === 'products' && 'Product Management'}
                {activeTab === 'orders' && 'Order Management'}
                {activeTab === 'categories' && 'Category Management'}
                {activeTab === 'import' && 'CSV Import'}
                {activeTab === 'analytics' && 'Analytics & Reporting'}
              </h1>
              <div className="flex items-center space-x-2">
                <Link href="/">
                  <Button
                    variant="outline"
                    data-testid="button-back-to-home"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={handleLogout}
                  data-testid="button-admin-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Stats Cards */}
            <AdminStats stats={stats} />

            {/* Products Tab */}
            {activeTab === 'products' && (
              <ProductsTab
                products={products}
                categories={categories}
                onAddProduct={() => setLocation('/admin/products/create')}
                onEditProduct={(productId) => setLocation(`/admin/products/edit?id=${productId}`)}
                onDeleteProduct={setProductToDelete}
              />
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <CategoriesTab
                categories={categories}
                onAddCategory={() => setShowCategoryDialog(true)}
                onEditCategory={(category) => {
                                  setEditingCategory(category);
                                  setShowCategoryDialog(true);
                                }}
                onDeleteCategory={setCategoryToDelete}
                isDeleting={deleteCategoryMutation.isPending}
              />
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <OrdersTab
                orders={orders}
                onUpdateOrderStatus={(orderId, status) => 
                  updateOrderMutation.mutate({ orderId, status })
                }
                onViewOrderDetails={(order) => {
                                setSelectedOrder(order as unknown as OrderWithItems);
                                setShowOrderDetailsDialog(true);
                              }}
              />
            )}

            {/* CSV Import Tab */}
            {activeTab === 'import' && <CSVImport />}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && <AnalyticsTab />}
          </div>
        </div>
      </div>


      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editingCategory}
            onClose={() => {
              setShowCategoryDialog(false);
              setEditingCategory(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetailsDialog} onOpenChange={setShowOrderDetailsDialog}>
        <DialogContent 
          className="max-w-4xl w-[85vw] max-h-[80vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Order Details - {selectedOrder?.customerName || 'Unknown Customer'}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <OrderDetailsView 
              order={selectedOrder} 
              onClose={() => {
                setShowOrderDetailsDialog(false);
                setSelectedOrder(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <DeleteCategoryDialog
        category={categoryToDelete}
        onConfirm={() => {
          if (categoryToDelete) {
            deleteCategoryMutation.mutate(categoryToDelete.id);
          }
        }}
        onCancel={() => setCategoryToDelete(null)}
        isDeleting={deleteCategoryMutation.isPending}
      />

      {/* Delete Product Confirmation Dialog */}
      <DeleteProductDialog
        product={productToDelete}
        onConfirm={() => {
          if (productToDelete) {
            deleteProductMutation.mutate(productToDelete.id);
          }
        }}
        onCancel={() => setProductToDelete(null)}
        isDeleting={deleteProductMutation.isPending}
      />
    </div>
  );
}
