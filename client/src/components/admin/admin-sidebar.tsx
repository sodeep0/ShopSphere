import { ShieldQuestion, Box, ShoppingBag, Settings, Upload, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  return (
    <div className="w-64 bg-card border-r border-border h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShieldQuestion className="text-primary-foreground w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Krisha Krafts</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2 flex-1">
        <Button
          variant={activeTab === 'products' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => onTabChange('products')}
          data-testid="button-nav-products"
        >
          <Box className="w-4 h-4 mr-3" />
          Products
        </Button>
        <Button
          variant={activeTab === 'orders' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => onTabChange('orders')}
          data-testid="button-nav-orders"
        >
          <ShoppingBag className="w-4 h-4 mr-3" />
          Orders
        </Button>
        <Button
          variant={activeTab === 'categories' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => onTabChange('categories')}
          data-testid="button-nav-categories"
        >
          <Settings className="w-4 h-4 mr-3" />
          Categories
        </Button>
        <Button
          variant={activeTab === 'import' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => onTabChange('import')}
          data-testid="button-nav-import"
        >
          <Upload className="w-4 h-4 mr-3" />
          CSV Import
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => onTabChange('analytics')}
          data-testid="button-nav-analytics"
        >
          <BarChart2 className="w-4 h-4 mr-3" />
          Analytics
        </Button>
      </nav>
    </div>
  );
}
