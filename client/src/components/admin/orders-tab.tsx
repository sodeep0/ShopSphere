import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Order } from "@shared/schema";

interface OrdersTabProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: string) => void;
  onViewOrderDetails: (order: Order) => void;
}

export function OrdersTab({ orders, onUpdateOrderStatus, onViewOrderDetails }: OrdersTabProps) {
  const formatPrice = (price: number) => {
    return `NPR ${price.toLocaleString()}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 hover:bg-yellow-100';
      case 'confirmed':
        return 'bg-blue-50 hover:bg-blue-100';
      case 'delivered':
        return 'bg-green-50 hover:bg-green-100';
      case 'cancelled':
        return 'bg-red-50 hover:bg-red-100';
      default:
        return 'bg-gray-50 hover:bg-gray-100';
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-6">Orders</h2>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order: any) => (
              <TableRow key={order.id} className={getStatusBackgroundColor(order.status)}>
                <TableCell className="font-mono text-sm">
                  {order.id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {order.items?.length || 0} items
                </TableCell>
                <TableCell>{formatPrice(parseFloat(order.total))}</TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    onValueChange={(status) => onUpdateOrderStatus(order.id, status)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onViewOrderDetails(order)}
                    data-testid={`button-view-order-${order.id}`}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
