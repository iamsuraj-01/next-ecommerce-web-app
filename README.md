# CRUD Operation App

A complete Next.js application implementing CRUD (Create, Read, Update, Delete) operations with Supabase database.

## Features

- **Create**: Add new username to database
- **Read**: Fetch and display all users in a data table
- **Update**: Edit existing username
- **Delete**: Remove user from database
- Real-time table updates without page refresh
- Simple and minimal interface
- Comprehensive code comments for beginners

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase project URL and anon key

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

