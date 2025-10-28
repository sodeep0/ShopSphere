import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  getSalesAnalytics, 
  getRevenueReport, 
  getProductPerformance, 
  getInventoryReport,
  getCustomerAnalytics
} from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";

function formatCurrency(n: number) {
  return `NPR ${Number(n || 0).toLocaleString()}`;
}

export default function AnalyticsTab() {
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('day');
  const [range, setRange] = useState({ from: '', to: '' });

  const params = useMemo(() => ({
    ...(range.from ? { from: range.from } : {}),
    ...(range.to ? { to: range.to } : {}),
  }), [range]);

  const { data: sales } = useQuery({
    queryKey: ['/api/admin/analytics/sales', interval, params],
    queryFn: () => getSalesAnalytics({ ...params, interval }),
  }) as { data: any };

  const { data: revenue } = useQuery({
    queryKey: ['/api/admin/analytics/revenue', params],
    queryFn: () => getRevenueReport({ ...params, groupBy: 'month' }),
  }) as { data: any };

  const { data: productPerf = [] } = useQuery({
    queryKey: ['/api/admin/analytics/products', params],
    queryFn: () => getProductPerformance({ ...params, limit: 10 }),
  }) as { data: any[] };

  const { data: inventory } = useQuery({
    queryKey: ['/api/admin/analytics/inventory'],
    queryFn: () => getInventoryReport(),
  }) as { data: any };

  const { data: customers } = useQuery({
    queryKey: ['/api/admin/analytics/customers', params],
    queryFn: () => getCustomerAnalytics({ ...params, limit: 10 }),
  }) as { data: any };

  return (
    <div className="space-y-6" data-testid="analytics-tab">
      <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-3 md:space-y-0">
        <div>
          <label className="text-sm text-muted-foreground">Interval</label>
          <Select value={interval} onValueChange={(v: any) => setInterval(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">From</label>
          <Input type="date" value={range.from} onChange={(e) => setRange(r => ({ ...r, from: e.target.value }))} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">To</label>
          <Input type="date" value={range.to} onChange={(e) => setRange(r => ({ ...r, to: e.target.value }))} />
        </div>
        <Button variant="outline" onClick={() => setRange({ from: '', to: '' })}>Clear Range</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Orders</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{sales?.totals?.orders ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatCurrency(sales?.totals?.revenue ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Items Sold</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{sales?.totals?.items ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Low Stock</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{inventory?.lowStockCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">No Stock</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{inventory?.outOfStockCount ?? 0}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sales?.series || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodStart" />
              <YAxis />
              <Tooltip formatter={(v: any, n: any) => n === 'revenue' ? formatCurrency(v) : v} />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#8884d8" name="Orders" />
              <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productPerf}>
                <XAxis dataKey="name" hide={false} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip formatter={(v: any, n: any) => n === 'revenue' ? formatCurrency(v) : v} />
                <Legend />
                <Bar dataKey="totalSold" fill="#8884d8" name="Units Sold" />
                <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue (Monthly)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue?.series || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodStart" />
                <YAxis />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-right text-sm text-muted-foreground mt-2">
              Total: <span className="font-semibold text-foreground">{formatCurrency(revenue?.totalRevenue || 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Customers</div>
              <div className="text-2xl font-bold">{customers?.totalCustomers ?? 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">New Customers</div>
              <div className="text-2xl font-bold">{customers?.newCustomers ?? 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Returning</div>
              <div className="text-2xl font-bold">{customers?.returningCustomers ?? 0}</div>
            </div>
          </div>
          <Separator className="my-2" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-left">
                  <th className="p-2">Customer</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Orders</th>
                  <th className="p-2">Spend</th>
                </tr>
              </thead>
              <tbody>
                {(customers?.topCustomers || []).map((c: any) => (
                  <tr key={`${c.userId}-${c.phone}`} className="border-t border-border">
                    <td className="p-2">{c.name || 'Guest'}</td>
                    <td className="p-2">{c.phone}</td>
                    <td className="p-2">{c.orders}</td>
                    <td className="p-2">{formatCurrency(c.spend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


