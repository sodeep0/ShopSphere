import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/components/auth/user-profile";
import { OrderHistory } from "@/components/auth/order-history";
import { useState } from "react";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="flex space-x-4 mb-6">
            <Button
              variant={activeTab === 'profile' ? 'default' : 'outline'}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </Button>
            <Button
              variant={activeTab === 'orders' ? 'default' : 'outline'}
              onClick={() => setActiveTab('orders')}
            >
              Order History
            </Button>
          </div>
        </div>

        {activeTab === 'profile' ? (
          <UserProfile onViewOrders={() => setActiveTab('orders')} />
        ) : (
          <OrderHistory />
        )}
      </div>
    </div>
  );
}
