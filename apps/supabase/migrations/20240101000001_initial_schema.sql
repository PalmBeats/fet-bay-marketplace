-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'banned');
CREATE TYPE listing_status AS ENUM ('active', 'sold', 'hidden');
CREATE TYPE order_status AS ENUM ('requires_payment', 'paid', 'shipped', 'refunded');

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'user' CHECK (role IN ('user', 'admin', 'banned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create listings table
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price_amount INTEGER NOT NULL CHECK (price_amount > 0),
    currency TEXT DEFAULT 'DKK',
    images TEXT[] DEFAULT '{}',
    status listing_status DEFAULT 'active' CHECK (status IN ('active', 'sold', 'hidden')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE,
    status order_status DEFAULT 'requires_payment' CHECK (status IN ('requires_payment', 'paid', 'shipped', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipping_addresses table
CREATE TABLE shipping_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    line1 TEXT NOT NULL,
    line2 TEXT,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    UNIQUE(order_id)
);

-- Create connect_accounts table
CREATE TABLE connect_accounts (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_account_id TEXT UNIQUE NOT NULL,
    charges_enabled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bans table
CREATE TABLE bans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    banned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_listings_seller_id ON listings(seller_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_created_at ON listings(created_at);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_listing_id ON orders(listing_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_shipping_addresses_order_id ON shipping_addresses(order_id);
CREATE INDEX idx_shipping_addresses_buyer_id ON shipping_addresses(buyer_id);
CREATE INDEX idx_connect_accounts_stripe_account_id ON connect_accounts(stripe_account_id);
CREATE INDEX idx_bans_user_id ON bans(user_id);

-- Create admin analytics views
CREATE VIEW v_sales_overview AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as total_orders,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM orders 
WHERE status = 'paid'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

CREATE VIEW v_top_sellers AS
SELECT 
    l.seller_id,
    p.email as seller_email,
    COUNT(o.id) as total_orders,
    SUM(o.amount) as total_sales,
    AVG(o.amount) as avg_sale_amount
FROM listings l
JOIN orders o ON l.id = o.listing_id
JOIN profiles p ON l.seller_id = p.id
WHERE o.status = 'paid'
GROUP BY l.seller_id, p.email
ORDER BY total_sales DESC;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (is_admin());

-- RLS Policies for listings
CREATE POLICY "Anyone can view active listings" ON listings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Sellers can view own listings" ON listings
    FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Admins can view all listings" ON listings
    FOR SELECT USING (is_admin());

CREATE POLICY "Sellers can insert own listings" ON listings
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own listings" ON listings
    FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own listings" ON listings
    FOR DELETE USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all listings" ON listings
    FOR ALL USING (is_admin());

-- RLS Policies for orders
CREATE POLICY "Buyers can view own orders" ON orders
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view orders for their listings" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE id = orders.listing_id AND seller_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (is_admin());

CREATE POLICY "Buyers can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update order status to shipped" ON orders
    FOR UPDATE USING (
        status = 'shipped' AND
        EXISTS (
            SELECT 1 FROM listings 
            WHERE id = orders.listing_id AND seller_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update all orders" ON orders
    FOR UPDATE USING (is_admin());

-- RLS Policies for shipping_addresses
CREATE POLICY "Buyers can view own shipping addresses" ON shipping_addresses
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view shipping addresses for their orders" ON shipping_addresses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o
            JOIN listings l ON o.listing_id = l.id
            WHERE o.id = shipping_addresses.order_id AND l.seller_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all shipping addresses" ON shipping_addresses
    FOR SELECT USING (is_admin());

CREATE POLICY "Buyers can create shipping addresses" ON shipping_addresses
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update own shipping addresses" ON shipping_addresses
    FOR UPDATE USING (auth.uid() = buyer_id);

CREATE POLICY "Admins can update all shipping addresses" ON shipping_addresses
    FOR UPDATE USING (is_admin());

-- RLS Policies for connect_accounts
CREATE POLICY "Users can view own connect account" ON connect_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own connect account" ON connect_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connect account" ON connect_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all connect accounts" ON connect_accounts
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all connect accounts" ON connect_accounts
    FOR UPDATE USING (is_admin());

-- RLS Policies for bans
CREATE POLICY "Admins can view all bans" ON bans
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can create bans" ON bans
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update bans" ON bans
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete bans" ON bans
    FOR DELETE USING (is_admin());

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- RLS Policies for profiles INSERT

-- Allow trigger functions to create profiles for new users
CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
