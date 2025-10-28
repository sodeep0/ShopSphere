import { Box } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminStatsProps {
  stats: {
    totalProducts?: number;
    lowStock?: number;
    categories?: number;
    totalValue?: string;
  } | null;
}

export function AdminStats({ stats }: AdminStatsProps) {
  if (!stats || stats.totalProducts === undefined) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Products</p>
              <p className="text-2xl font-bold text-foreground">{stats?.totalProducts || 0}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Box className="text-primary w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Low Stock</p>
              <p className="text-2xl font-bold text-destructive">{stats?.lowStock || 0}</p>
            </div>
            <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
              <Box className="text-destructive w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Categories</p>
              <p className="text-2xl font-bold text-foreground">{stats?.categories || 0}</p>
            </div>
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
              <Box className="text-accent-foreground w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Value</p>
              <p className="text-2xl font-bold text-foreground">{stats?.totalValue || 'NPR 0'}</p>
            </div>
            <div className="w-12 h-12 bg-chart-1/10 rounded-xl flex items-center justify-center">
              <Box className="text-chart-1 w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
