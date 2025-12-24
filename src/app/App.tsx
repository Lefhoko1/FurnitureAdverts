import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Scene3D from './components/Scene3D';
import AuthDialog from './components/AuthDialog';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Card } from './components/ui/card';
import { Separator } from './components/ui/separator';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { User, LogOut, Play, Pause, Heart, House, Bed, UtensilsCrossed, Bath, Car, ChefHat } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-7d31b1b3`;

const ROOMS = [
  { id: 'living', name: 'Living Room', icon: House },
  { id: 'bedroom', name: 'Bedroom', icon: Bed },
  { id: 'dining', name: 'Dining Room', icon: UtensilsCrossed },
  { id: 'kitchen', name: 'Kitchen', icon: ChefHat },
  { id: 'bathroom', name: 'Bathroom', icon: Bath },
  { id: 'garage', name: 'Garage', icon: Car },
];

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('living');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [autoTour, setAutoTour] = useState(false);
  const [shops, setShops] = useState<any[]>([]);
  const [likedShops, setLikedShops] = useState<string[]>([]);
  
  const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );

  // Check for existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setAccessToken(session.access_token);
        loadLikedShops(session.access_token);
      }
    });
  }, []);

  // Load products and shops
  useEffect(() => {
    loadProducts();
    loadShops();
  }, [currentRoom]);

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products?room=${currentRoom}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      
      // Demo products if none exist
      if (!data.products || data.products.length === 0) {
        setProducts(generateDemoProducts(currentRoom));
      } else {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts(generateDemoProducts(currentRoom));
    }
  };

  const loadShops = async () => {
    try {
      const response = await fetch(`${API_BASE}/shops`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      
      // Demo shops if none exist
      if (!data.shops || data.shops.length === 0) {
        setShops(generateDemoShops());
      } else {
        setShops(data.shops);
      }
    } catch (error) {
      console.error('Error loading shops:', error);
      setShops(generateDemoShops());
    }
  };

  const loadLikedShops = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/user/liked-shops`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setLikedShops(data.likedShops || []);
    } catch (error) {
      console.error('Error loading liked shops:', error);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error('Login failed: ' + error.message);
      throw error;
    }

    if (data.session) {
      setUser(data.session.user);
      setAccessToken(data.session.access_token);
      loadLikedShops(data.session.access_token);
      toast.success('Welcome back!');
    }
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error('Signup failed: ' + data.error);
        throw new Error(data.error);
      }

      // Now sign in
      await handleLogin(email, password);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken('');
    setLikedShops([]);
    toast.info('Logged out');
  };

  const toggleLikeShop = async (shopId: string) => {
    if (!user) {
      toast.error('Please sign in to like shops');
      setAuthDialogOpen(true);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/user/toggle-like/${shopId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();
      setLikedShops(data.likedShops || []);
      toast.success(data.likedShops.includes(shopId) ? 'Shop liked!' : 'Shop unliked');
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update preference');
    }
  };

  // Get shops for current room products
  const roomShops = shops.filter(shop => 
    products.some(p => p.shopId === shop.id)
  );

  return (
    <div className="size-full flex flex-col bg-background overflow-hidden">
      {/* Top banner with shops */}
      <div className="w-full bg-card/80 backdrop-blur-sm border-b border-primary/20 px-6 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 flex-1 overflow-x-auto">
          {roomShops.length > 0 ? (
            roomShops.map((shop) => (
              <div
                key={shop.id}
                className={`flex items-center gap-2 px-4 py-1 rounded-full border transition-all ${
                  selectedProduct?.shopId === shop.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                    : 'bg-secondary/50 border-border hover:border-primary/40'
                }`}
              >
                <span className="text-sm font-[var(--font-accent)] whitespace-nowrap">
                  {shop.name}
                </span>
                {user && (
                  <button
                    onClick={() => toggleLikeShop(shop.id)}
                    className="ml-1"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        likedShops.includes(shop.id)
                          ? 'fill-current text-red-500'
                          : 'text-muted-foreground hover:text-red-400'
                      }`}
                    />
                  </button>
                )}
              </div>
            ))
          ) : (
            <span className="text-sm text-muted-foreground font-[var(--font-body)]">
              No shops available for this room
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user.user_metadata?.name || user.email}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogout}
                className="border-primary/30"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => setAuthDialogOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <User className="w-4 h-4 mr-1" />
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* 3D Scene */}
        <div className="flex-1 relative">
          <Scene3D
            currentRoom={currentRoom}
            products={products}
            selectedProduct={selectedProduct}
            onProductSelect={setSelectedProduct}
            autoTour={autoTour}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-card/80 backdrop-blur-sm border-l border-primary/20 p-6 flex flex-col gap-6 overflow-y-auto">
          {/* Room selector */}
          <Card className="p-4 bg-secondary/30">
            <h3 className="font-[var(--font-heading)] mb-3">Select Room</h3>
            <div className="grid grid-cols-2 gap-2">
              {ROOMS.map((room) => {
                const Icon = room.icon;
                return (
                  <Button
                    key={room.id}
                    variant={currentRoom === room.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setCurrentRoom(room.id);
                      setSelectedProduct(null);
                    }}
                    className={currentRoom === room.id ? 'bg-primary' : 'border-primary/30'}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {room.name}
                  </Button>
                );
              })}
            </div>
          </Card>

          {/* Auto tour */}
          <Card className="p-4 bg-secondary/30">
            <div className="flex items-center justify-between">
              <h3 className="font-[var(--font-heading)]">Auto Tour</h3>
              <Button
                size="sm"
                variant={autoTour ? 'default' : 'outline'}
                onClick={() => setAutoTour(!autoTour)}
                className={autoTour ? 'bg-primary' : 'border-primary/30'}
              >
                {autoTour ? (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Start
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Automatically showcase products in this room
            </p>
          </Card>

          {/* Product details */}
          {selectedProduct && (
            <Card className="p-4 bg-gradient-to-br from-primary/5 to-secondary/30">
              <h3 className="font-[var(--font-heading)] text-xl mb-2">
                {selectedProduct.name}
              </h3>
              <Separator className="my-3" />
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Shop</p>
                  <p className="font-medium">{selectedProduct.shopName || 'Unknown Shop'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Price</p>
                  <p className="text-lg font-[var(--font-accent)]">
                    ${selectedProduct.price || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedProduct.description || 'No description available'}</p>
                </div>
                {selectedProduct.features && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Features</p>
                    <ul className="text-sm space-y-1">
                      {selectedProduct.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="text-primary mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Info */}
          <Card className="p-4 bg-secondary/20 mt-auto">
            <p className="text-xs text-muted-foreground text-center">
              Explore curated furniture and decor in a 3D home environment
            </p>
          </Card>
        </div>
      </div>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onLogin={handleLogin}
        onSignup={handleSignup}
      />
    </div>
  );
}

// Demo data generators
function generateDemoProducts(room: string) {
  const productsByRoom: Record<string, any[]> = {
    living: [
      { id: '1', name: 'Velvet Sofa', room: 'living', shopId: 'shop1', shopName: 'Elegant Home', price: 1299, color: '#8b7355', description: 'Luxurious velvet sofa with deep cushioning', features: ['Premium velvet fabric', 'Solid wood frame', 'Deep seating'] },
      { id: '2', name: 'Coffee Table', room: 'living', shopId: 'shop2', shopName: 'Modern Living', price: 499, color: '#a0826d', description: 'Contemporary glass-top coffee table', features: ['Tempered glass', 'Metal frame', 'Easy to clean'] },
    ],
    bedroom: [
      { id: '3', name: 'Platform Bed', room: 'bedroom', shopId: 'shop1', shopName: 'Elegant Home', price: 899, color: '#8b6f47', description: 'Modern platform bed with upholstered headboard', features: ['Queen size', 'Upholstered headboard', 'Solid construction'] },
      { id: '4', name: 'Nightstand', room: 'bedroom', shopId: 'shop3', shopName: 'Bedroom Bliss', price: 249, color: '#9d8777', description: 'Two-drawer nightstand with soft-close', features: ['Soft-close drawers', 'Two drawers', 'Matching hardware'] },
    ],
    dining: [
      { id: '5', name: 'Dining Table', room: 'dining', shopId: 'shop2', shopName: 'Modern Living', price: 1099, color: '#8b7d6b', description: 'Extendable dining table for 6-8 people', features: ['Extendable design', 'Seats 6-8', 'Solid oak'] },
    ],
    kitchen: [
      { id: '6', name: 'Bar Stools', room: 'kitchen', shopId: 'shop3', shopName: 'Bedroom Bliss', price: 349, color: '#a89968', description: 'Set of 2 adjustable bar stools', features: ['Adjustable height', 'Swivel seat', 'Footrest'] },
    ],
    bathroom: [
      { id: '7', name: 'Vanity Unit', room: 'bathroom', shopId: 'shop1', shopName: 'Elegant Home', price: 799, color: '#9a9a9a', description: 'Modern vanity with integrated sink', features: ['Integrated sink', 'Storage drawers', 'Soft-close doors'] },
    ],
    garage: [
      { id: '8', name: 'Storage Cabinet', room: 'garage', shopId: 'shop2', shopName: 'Modern Living', price: 299, color: '#7f8c8d', description: 'Heavy-duty storage cabinet', features: ['Heavy-duty', 'Lockable', 'Adjustable shelves'] },
    ],
  };

  return productsByRoom[room] || [];
}

function generateDemoShops() {
  return [
    { id: 'shop1', name: 'Elegant Home', subscriptionActive: true },
    { id: 'shop2', name: 'Modern Living', subscriptionActive: true },
    { id: 'shop3', name: 'Bedroom Bliss', subscriptionActive: true },
  ];
}