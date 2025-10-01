-- Seed data for development and testing
-- Note: These are test users with fake emails

-- Insert test profiles (these would normally be created by auth trigger)
INSERT INTO profiles (id, email, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin@test.com', 'admin'),
    ('22222222-2222-2222-2222-222222222222', 'seller1@test.com', 'user'),
    ('33333333-3333-3333-3333-333333333333', 'seller2@test.com', 'user'),
    ('44444444-4444-4444-4444-444444444444', 'buyer1@test.com', 'user'),
    ('55555555-5555-5555-5555-555555555555', 'buyer2@test.com', 'user')
ON CONFLICT (id) DO NOTHING;

-- Insert test listings
INSERT INTO listings (id, seller_id, title, description, price_amount, currency, images, status) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Vintage Læderjakke', 'Smuk vintage læderjakke i størrelse M. Perfekt til efteråret.', 150000, 'DKK', ARRAY['https://example.com/jacket1.jpg', 'https://example.com/jacket2.jpg'], 'active'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Gaming Headset', 'Professionelt gaming headset med mikrofon. Kun brugt få gange.', 80000, 'DKK', ARRAY['https://example.com/headset1.jpg'], 'active'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Bog: "Clean Code"', 'Robert C. Martins klassiker om ren kode. Paperback udgave.', 25000, 'DKK', ARRAY['https://example.com/book1.jpg'], 'active'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'Køkkenkniv Sæt', 'Professionelt knivsæt med 6 knive og skærebræt.', 450000, 'DKK', ARRAY['https://example.com/knives1.jpg', 'https://example.com/knives2.jpg'], 'active'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'Cykel', 'Mountain bike i god stand. Perfekt til terrænkørsel.', 320000, 'DKK', ARRAY['https://example.com/bike1.jpg', 'https://example.com/bike2.jpg', 'https://example.com/bike3.jpg'], 'sold')
ON CONFLICT (id) DO NOTHING;

-- Insert test orders
INSERT INTO orders (id, listing_id, buyer_id, amount, currency, stripe_payment_intent_id, status) VALUES
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '44444444-4444-4444-4444-444444444444', 320000, 'DKK', 'pi_test_1234567890', 'paid'),
    ('gggggggg-gggg-gggg-gggg-gggggggggggg', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555', 25000, 'DKK', 'pi_test_0987654321', 'paid')
ON CONFLICT (id) DO NOTHING;

-- Insert test shipping addresses
INSERT INTO shipping_addresses (id, order_id, buyer_id, name, line1, line2, postal_code, city, country) VALUES
    ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '44444444-4444-4444-4444-444444444444', 'Lars Hansen', 'Hovedgade 123', '2. tv', '2100', 'København Ø', 'Danmark'),
    ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'gggggggg-gggg-gggg-gggg-gggggggggggg', '55555555-5555-5555-5555-555555555555', 'Anna Nielsen', 'Strandvejen 45', '', '2920', 'Charlottenlund', 'Danmark')
ON CONFLICT (id) DO NOTHING;

-- Insert test connect accounts (simulated Stripe accounts)
INSERT INTO connect_accounts (user_id, stripe_account_id, charges_enabled) VALUES
    ('22222222-2222-2222-2222-222222222222', 'acct_test_seller1', true),
    ('33333333-3333-3333-3333-333333333333', 'acct_test_seller2', true)
ON CONFLICT (user_id) DO NOTHING;
