## Technologies: Next JS (Full-Stack Framework) + Tailwind CSS (UI Design) + Supabase (Database)

A complete Next.js application implementing CRUD (Create, Read, Update, Delete) operations with Supabase database.

## Tutorial

https://youtu.be/ahGR7dtIgto

## Important

Do not clone this repository or run the template directly from GitHub, as any changes you make could affect the original version. Instead, download the template as a ZIP file, extract it, and rename the folder to something different from the repository name such as 'my-project' or any name you prefer. Then, open it in Visual Studio Code to run and customize the template according to your preferences.

## Setup Instructions

1. Getting Started

(a): Download the project code ZIP file, extract it, and move it to your preferred location.

(b): Open the project in Visual Studio Code and open the terminal.

(c): Run the following commands in the terminal:

Note: The first command verifies the path. Before running it, right-click the project folder, select 'Copy Path,' and paste it in place of path/to/your/project. The second command installs dependencies, creating the node_modules folder. The third command runs the project, generating the .next folder. Both node_modules and .next are temporary folders created during the build process. They can be safely deleted once the project is completed and deployed or is no longer needed. However, they will be recreated if you run npm install, npm run dev, or npm run build again.

```bash

# Verify the path to your project directory
cd path/to/your/project

# Install dependencies
npm install

# Run the development server
npm run dev
```

2. Set up environment variables:

   In the root directory of your project, create a new file named .env

   a. Open the existing file env.txt and copy all its contents.

   b. Paste the copied content into your new .env file.

   c. Your .env file should contain the following variables:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```
   d. Go to your Supabase account:

      If you already have a project named next-ecommerce-web-app, open it.

      If not, create a new Supabase project named next-ecommerce-web-app.

   e. In your Supabase dashboard:

      Go to Settings.

      Under API Keys, copy the key and paste it into:

      ```bash
      NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
      ```
      Under Data API, copy the project URL and paste it into:

      ```bash
      NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
      ```
      
      ✅ Example (.env)
      ```bash
      NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
      ```

## 🔄 Stripe Integration

**Current Status**: Using placeholder keys for testing

**To enable real payments:**
1. Get your Stripe API keys from https://dashboard.stripe.com/apikeys
2. Update `.env`:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
   STRIPE_SECRET_KEY=sk_live_xxxxx
   ```
3. Restart the application
4. Set up Stripe webhook for payment confirmations (optional but recommended)

### Database Schema (Supabase)

**Tables:**
1. **products**
   - id (UUID, primary key)
   - name, description, price, category, stock
   - image_url
   - created_at

2. **user_profiles**
   - id (UUID, references auth.users)
   - role (admin/customer)
   - created_at

3. **cart_items**
   - id (UUID)
   - user_id (references auth.users)
   - product_id (references products)
   - quantity
   - created_at

4. **orders**
   - id (UUID)
   - user_id (references auth.users)
   - total, status
   - stripe_session_id
   - created_at

5. **order_items**
   - id (UUID)
   - order_id (references orders)
   - product_id (references products)
   - quantity, price
   - created_at

### Database Setup
1. Run the SQL script in `/app/supabase-schema.sql` in your Supabase SQL Editor
2. This will create all tables, policies, and seed 10 sample products

### Running the Application
The application is already running at:
- **Frontend**: https://buyflow-62.preview.emergentagent.com
- **API**: https://buyflow-62.preview.emergentagent.com/api

To restart:
```bash
sudo supervisorctl restart nextjs
```

## 📱 User Guide

### For Customers

1. **Sign Up / Sign In**
   - Create an account or sign in with existing credentials
   - Your session is automatically saved

2. **Browse Products**
   - View all products on the home page
   - Use search to find specific products
   - Filter by category
   - Click "View" to see product details

3. **Shopping Cart**
   - Click "Add to Cart" to add products
   - Click the cart icon (top right) to view cart
   - Update quantities or remove items
   - Click "Proceed to Checkout" to pay

4. **Checkout**
   - Redirects to Stripe checkout
   - Enter payment details
   - Confirm payment
   - Redirected to success page

5. **View Orders**
   - Click "Orders" in navigation
   - See all your past orders
   - View order status and items

### For Admins

**Note**: To make a user an admin, you need to update the `user_profiles` table:
```sql
UPDATE user_profiles SET role = 'admin' WHERE id = '<user-id>';
```

1. **Admin Dashboard**
   - Click "Admin" in navigation (only visible to admins)
   - View two tabs: Products and All Orders

2. **Manage Products**
   - Add new products with name, description, price, stock, category, and image URL
   - Delete existing products
   - Products are immediately visible to all users

3. **Manage Orders**
   - View all customer orders
   - Update order status (pending → paid → shipped → delivered)
   - View order items and customer details

## 🔐 Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Authentication required** for cart, orders, and admin actions
- **Role-based access control** for admin features
- **Secure cookie-based sessions** via Supabase SSR
- **CORS headers** properly configured
- 
## 🐛 Troubleshooting

### Issue: User can't sign in
- Check Supabase authentication settings
- Ensure email confirmation is disabled or handled
- Check browser console for errors

### Issue: Products not showing
- Verify database connection
- Check if products exist in Supabase table
- Look at browser network tab for API errors

### Issue: Cart not working
- Ensure user is signed in
- Check cart_items table in Supabase
- Verify RLS policies are set correctly

### Issue: Checkout fails
- Currently using placeholder Stripe keys
- Replace with real keys to enable payments
- Check Stripe dashboard for session creation

## 🚀 Deployment Ready

The application is already deployed and running at:
**https://buyflow-62.preview.emergentagent.com**

For production deployment to Vercel:
1. Connect your GitHub repository
2. Add environment variables
3. Deploy

