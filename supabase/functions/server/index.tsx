import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Supabase client for auth
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-7d31b1b3/health", (c) => {
  return c.json({ status: "ok" });
});

// ============= AUTH ROUTES =============

// Sign up route
app.post("/make-server-7d31b1b3/signup", async (c) => {
  try {
    const { email, password, name, role = 'user' } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });
    
    if (error) {
      console.log('Sign up error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ user: data.user });
  } catch (error) {
    console.log('Sign up exception:', error);
    return c.json({ error: 'Sign up failed' }, 500);
  }
});

// ============= SHOP ROUTES =============

// Get all shops
app.get("/make-server-7d31b1b3/shops", async (c) => {
  try {
    const shops = await kv.getByPrefix('shop:');
    return c.json({ shops: shops.map(s => s.value) });
  } catch (error) {
    console.log('Get shops error:', error);
    return c.json({ error: 'Failed to fetch shops' }, 500);
  }
});

// Create a shop (requires auth)
app.post("/make-server-7d31b1b3/shops", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const shopData = await c.req.json();
    const shopId = `shop:${Date.now()}`;
    
    await kv.set(shopId, {
      ...shopData,
      id: shopId,
      userId: user.id,
      createdAt: new Date().toISOString(),
      subscriptionActive: true
    });
    
    return c.json({ shop: await kv.get(shopId) });
  } catch (error) {
    console.log('Create shop error:', error);
    return c.json({ error: 'Failed to create shop' }, 500);
  }
});

// ============= PRODUCT ROUTES =============

// Get all products (optionally filter by room)
app.get("/make-server-7d31b1b3/products", async (c) => {
  try {
    const room = c.req.query('room');
    const products = await kv.getByPrefix('product:');
    
    let filteredProducts = products.map(p => p.value);
    
    if (room) {
      filteredProducts = filteredProducts.filter(p => p.room === room);
    }
    
    return c.json({ products: filteredProducts });
  } catch (error) {
    console.log('Get products error:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

// Create a product (admin only)
app.post("/make-server-7d31b1b3/products", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Check if user is admin
    const userMeta = user.user_metadata;
    if (userMeta.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const productData = await c.req.json();
    const productId = `product:${Date.now()}`;
    
    await kv.set(productId, {
      ...productData,
      id: productId,
      createdAt: new Date().toISOString()
    });
    
    return c.json({ product: await kv.get(productId) });
  } catch (error) {
    console.log('Create product error:', error);
    return c.json({ error: 'Failed to create product' }, 500);
  }
});

// Update a product (admin only)
app.put("/make-server-7d31b1b3/products/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError || user.user_metadata.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const productId = c.req.param('id');
    const productData = await c.req.json();
    
    await kv.set(productId, {
      ...productData,
      id: productId,
      updatedAt: new Date().toISOString()
    });
    
    return c.json({ product: await kv.get(productId) });
  } catch (error) {
    console.log('Update product error:', error);
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

// Delete a product (admin only)
app.delete("/make-server-7d31b1b3/products/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError || user.user_metadata.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const productId = c.req.param('id');
    await kv.del(productId);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete product error:', error);
    return c.json({ error: 'Failed to delete product' }, 500);
  }
});

// ============= USER PREFERENCES =============

// Get user's liked shops
app.get("/make-server-7d31b1b3/user/liked-shops", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const likedShops = await kv.get(`user:${user.id}:liked`) || [];
    return c.json({ likedShops });
  } catch (error) {
    console.log('Get liked shops error:', error);
    return c.json({ error: 'Failed to fetch liked shops' }, 500);
  }
});

// Toggle liked shop
app.post("/make-server-7d31b1b3/user/toggle-like/:shopId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const shopId = c.req.param('shopId');
    const likedShops = (await kv.get(`user:${user.id}:liked`)) || [];
    
    const index = likedShops.indexOf(shopId);
    if (index > -1) {
      likedShops.splice(index, 1);
    } else {
      likedShops.push(shopId);
    }
    
    await kv.set(`user:${user.id}:liked`, likedShops);
    
    return c.json({ likedShops });
  } catch (error) {
    console.log('Toggle like error:', error);
    return c.json({ error: 'Failed to toggle like' }, 500);
  }
});

Deno.serve(app.fetch);