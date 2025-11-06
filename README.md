## Technologies: Next JS (Full-Stack Framework) + Tailwind CSS (UI Design) + Supabase (Database)

A complete Next.js application implementing CRUD (Create, Read, Update, Delete) operations with Supabase database.

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

   In the root directory of your project, create a new file named .env.local

   a. Open the existing file .env.local.example and copy all its contents.

   b. Paste the copied content into your new .env.local file.

   c. Your .env.local file should contain the following variables:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```
   d. Go to your Supabase account:

      If you already have a project named next-crud-web-app, open it.

      If not, create a new Supabase project named next-crud-web-app.

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
      
      ✅ Example (.env.local)
      ```bash
      NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
      ```

3. Set up Supabase database:
   - Create a table named `users` in your Supabase project
   - Add a column named `username` (text/varchar type)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Supabase Table Setup

### Step 1: Create the Table

Create a table in your Supabase SQL editor:

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### Step 2: Set up Row-Level Security (RLS) Policies

**Important:** After creating the table, you need to create four policies if not created:

1. **SELECT Policy** - Allows reading data from the users table (required for fetching and displaying data)
2. **INSERT Policy** - Allows inserting data into the users table (required for adding new records)
3. **UPDATE Policy** - Allows updating data in the users table (required for updating username)
4. **DELETE Policy** - Allows deleting data from the users table (required for deleting records)

**Make sure Target Roles is set to "Defaults to all (public) roles" (or `public`) for all policies.**

You can create these policies in Supabase using the UI or SQL Editor.

## CRUD Operations

### Create (Add Data)
- Click "Add Data" button
- Enter username in the form
- Click "Submit"
- Data is inserted into database and table updates automatically

### Read (View Data)
- All users are automatically fetched and displayed in the table on page load
- Table shows ID, Username, and Action columns

### Update
- Click "Update" button for any row
- Form appears with current username pre-filled
- Edit the username and click "Update"
- Data is updated in database and table refreshes immediately

### Delete
- Click "Delete" button for any row
- Confirm deletion
- Record is deleted from database and removed from table immediately

