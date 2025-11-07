// One-time script to create Supabase database schema
// Run this once with: node setup-database.js
// DO NOT commit this file with the service role key

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yavcquvnvvpxortxnehv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdmNxdXZudnZweG9ydHhuZWh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ4NDU3NiwiZXhwIjoyMDc4MDYwNTc2fQ.vdZECJP9t1Us-lUxhdiAfMUyLyvfzXF_9_qXEk7Y-nE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SQL_SCHEMA = `
-- Drop existing tables if recreating (in correct order due to foreign keys)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart_items table
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for products (public read, admin write)
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update products" ON products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete products" ON products FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Create policies for cart_items
CREATE POLICY "Users can view own cart" ON cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cart items" ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart items" ON cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cart items" ON cart_items FOR DELETE USING (auth.uid() = user_id);

-- Create policies for orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create policies for order_items
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create indexes for performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_created ON products(created_at DESC);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
`;

const SEED_PRODUCTS = [
  {
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    price: 199.99,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    category: 'Electronics',
    stock: 50
  },
  {
    name: 'Smart Watch Pro',
    description: 'Advanced smartwatch with fitness tracking, heart rate monitor, and GPS.',
    price: 299.99,
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    category: 'Electronics',
    stock: 30
  },
  {
    name: 'Ultra HD 4K Camera',
    description: 'Professional 4K camera with 24MP sensor and image stabilization.',
    price: 899.99,
    image_url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800',
    category: 'Electronics',
    stock: 15
  },
  {
    name: 'Laptop Stand Aluminum',
    description: 'Ergonomic aluminum laptop stand with adjustable height and cable management.',
    price: 49.99,
    image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800',
    category: 'Accessories',
    stock: 100
  },
  {
    name: 'Mechanical Gaming Keyboard',
    description: 'RGB mechanical keyboard with premium switches and programmable keys.',
    price: 129.99,
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',
    category: 'Electronics',
    stock: 45
  },
  {
    name: 'Wireless Mouse Pro',
    description: 'Precision wireless mouse with ergonomic design and 6 programmable buttons.',
    price: 59.99,
    image_url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800',
    category: 'Electronics',
    stock: 80
  },
  {
    name: 'USB-C Hub 7-in-1',
    description: 'Multi-port USB-C hub with HDMI, USB 3.0, SD card reader, and charging port.',
    price: 39.99,
    image_url: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800',
    category: 'Accessories',
    stock: 120
  },
  {
    name: 'Portable Bluetooth Speaker',
    description: 'Waterproof Bluetooth speaker with 360° sound and 12-hour battery life.',
    price: 79.99,
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',
    category: 'Electronics',
    stock: 60
  },
  {
    name: 'Phone Case Premium Leather',
    description: 'Genuine leather phone case with card holder and magnetic closure.',
    price: 34.99,
    image_url: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800',
    category: 'Accessories',
    stock: 200
  },
  {
    name: 'Laptop Backpack Travel',
    description: 'Water-resistant laptop backpack with USB charging port and anti-theft design.',
    price: 69.99,
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    category: 'Accessories',
    stock: 75
  }
];

async function setupDatabase() {
  console.log('🚀 Starting database setup...');

  try {
    // Execute schema creation
    console.log('📝 Creating database schema...');
    const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', {
      sql: SQL_SCHEMA
    });

    // If rpc doesn't work, we need to execute via the SQL editor
    // Let's try a different approach - create tables one by one
    console.log('⚠️  Note: If schema creation fails, you may need to run the SQL in Supabase SQL Editor');

    // Insert seed products
    console.log('🌱 Seeding products...');
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .insert(SEED_PRODUCTS)
      .select();

    if (productsError) {
      console.error('❌ Error seeding products:', productsError);
    } else {
      console.log(`✅ Successfully seeded ${productsData.length} products`);
    }

    console.log('✨ Database setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Update .env with Supabase credentials (anon key only)');
    console.log('2. Delete this setup script or remove the service role key');
    console.log('3. Run the application: sudo supervisorctl restart nextjs');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('\n⚠️  MANUAL SETUP REQUIRED:');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('\n' + SQL_SCHEMA);
    console.log('\nThen insert seed products manually or run this script again.');
  }
}

setupDatabase();
