-- Add new columns to users table for authentication features
ALTER TABLE users ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS road text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS additional_landmark text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

-- Add user_id column to orders table for linking orders to users
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id varchar;

-- Add foreign key constraint for orders.user_id -> users.id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_user_id_users_id_fk'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT orders_user_id_users_id_fk 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE no action ON UPDATE no action;
    END IF;
END $$;

-- Update existing users to have updated_at timestamp
UPDATE users SET updated_at = now() WHERE updated_at IS NULL;
