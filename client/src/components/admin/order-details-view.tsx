import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { OrderWithItems } from "@shared/schema";

interface OrderDetailsViewProps {
  order: OrderWithItems;
  onClose: () => void;
}

export function OrderDetailsView({ order, onClose }: OrderDetailsViewProps) {
  const formatPrice = (price: number) => {
    return `NPR ${price.toLocaleString()}`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6 p-1">
      {/* Order Header */}
      <div className="border-b border-border pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Order #{order.id?.slice(0, 8) || 'N/A'}</h3>
            <p className="text-sm text-muted-foreground">Placed on {formatDate(order.createdAt || null)}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${getStatusColor(order.status || 'pending')}`}>
            {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
              <p className="text-foreground break-words">{order.customerName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
              <p className="text-foreground">{order.customerPhone}</p>
            </div>
            {order.customerEmail && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="text-foreground break-words">{order.customerEmail}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">District</Label>
              <p className="text-foreground">{order.district}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Road/Street</Label>
              <p className="text-foreground break-words">{order.road}</p>
            </div>
            {order.additionalLandmark && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Additional Landmark</Label>
                <p className="text-foreground break-words">{order.additionalLandmark}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Special Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{order.specialInstructions}</p>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items && order.items.length > 0 ? (
              order.items.map((item: any) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border border-border rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground break-words">{item.productName}</h4>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className="font-medium text-foreground">{formatPrice(parseFloat(item.productPrice))}</p>
                    <p className="text-sm text-muted-foreground">each</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No items found for this order</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-lg font-bold border-t border-border pt-3">
              <span>Total Amount</span>
              <span className="text-foreground">{formatPrice(order.total || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Payment Method</span>
              <span>Cash on Delivery (COD)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
