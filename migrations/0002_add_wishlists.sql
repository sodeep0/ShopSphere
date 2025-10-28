-- Create wishlists table to store user-product favorites
CREATE TABLE IF NOT EXISTS "wishlists" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "product_id" varchar NOT NULL REFERENCES "products"("id"),
  "created_at" timestamp DEFAULT now()
);

-- Ensure a user can wishlist a product only once
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wishlists_user_product_unique'
  ) THEN
    ALTER TABLE "wishlists"
      ADD CONSTRAINT "wishlists_user_product_unique" UNIQUE ("user_id", "product_id");
  END IF;
END $$;


