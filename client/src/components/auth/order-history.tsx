import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getUserOrders } from "@/lib/api";
import { Package, Calendar, MapPin, Phone, Mail, ArrowLeft } from "lucide-react";
import type { Order, OrderItem } from "@shared/schema";

interface OrderWithItems extends Order {
  items: OrderItem[];
}

export function OrderHistory() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const fetchOrders = async () => {
    try {
      const ordersData = await getUserOrders();
      setOrders(ordersData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch order history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading order history...</p>
        </div>
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setSelectedOrder(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Order Details</h2>
            <p className="text-muted-foreground">Order #{selectedOrder.id.slice(-8)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Order Date:</span>
                <span>{formatDate(selectedOrder.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold text-lg">NPR {parseFloat(selectedOrder.total.toString()).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.district}, {selectedOrder.road}</p>
                  {selectedOrder.additionalLandmark && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.additionalLandmark}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span>{selectedOrder.customerPhone}</span>
              </div>
              {selectedOrder.customerEmail && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span>{selectedOrder.customerEmail}</span>
                </div>
              )}
              {selectedOrder.specialInstructions && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium">Special Instructions:</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.specialInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.productName}</h4>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">NPR {parseFloat(item.productPrice.toString()).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      Total: NPR {(parseFloat(item.productPrice.toString()) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
        <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
        <Button onClick={() => window.location.href = '/products'}>
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Order History</h2>
        <p className="text-muted-foreground">View and track your orders</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <p className="font-semibold mt-1">NPR {parseFloat(order.total.toString()).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{order.district}, {order.road}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedOrder(order)}
                >
                  View Details
                </Button>
              </div>

              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-muted-foreground">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''} • 
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)} total quantity
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
