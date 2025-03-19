# Setting Up Your Demo Environment

This guide provides detailed step-by-step instructions for setting up a local demo environment with a full dataset for the Marketing Calendar application.

## Prerequisites

Before starting, ensure you have:
- Docker installed and running
- Node.js and npm installed
- Git installed
- Basic knowledge of terminal commands

## Step 1: Clone and Set Up the Project

Skip this step if you already have the project repository on your machine.

```bash
# Clone the repository
git clone [YOUR_REPOSITORY_URL]
cd marketing-cal-bolt

# Install dependencies
npm install
```

## Step 2: Install Supabase CLI

The Supabase CLI is required to manage your local Supabase instance.

### macOS
```bash
brew install supabase/tap/supabase
```

### Windows (using Scoop)
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Linux/Windows WSL
```bash
curl -s https://raw.githubusercontent.com/supabase/supabase/master/bin/supabase-linux-amd64 | sudo tar -xz -C /usr/local/bin
```

Verify the installation:
```bash
supabase --version
```

## Step 3: Initialize and Start Local Supabase

```bash
# From your project root directory
supabase init
```

This will create a `.supabase` directory in your project with configuration files.

Next, start the Supabase services:

```bash
supabase start
```

The command may take a few minutes to complete as it pulls Docker images and starts the services. When finished, you'll see output similar to:

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

**Note:** Save these URLs and keys for the next steps.

## Step 4: Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Create .env.local file with your Supabase credentials
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF
```

Replace the anon key and service role key with those from your Supabase startup output.

## Step 5: Initialize Database Schema

There are two ways to set up your database schema:

### Option 1: Using migration scripts (if available)

```bash
npm run migrate:local
```

### Option 2: Manually running schema SQL

```bash
# Find and run your schema SQL files
psql -h localhost -p 54321 -U postgres -d postgres -f supabase/migrations/schema.sql
```

To verify the schema is set up correctly:

```bash
psql -h localhost -p 54321 -U postgres -d postgres -c "\dt"
```

You should see a list of tables including `users`, `resources`, `briefs`, etc.

## Step 6: Generate Demo Data

Run the demo data generation script:

```bash
psql -h localhost -p 54321 -U postgres -d postgres -f demo/data/generate_all_demo_data.sql
```

This script:
1. Temporarily disables Row Level Security
2. Creates helper functions
3. Generates users, teams, resources, brands, campaigns, and briefs
4. Creates historical records

The script will output progress information as it runs, and should complete in 1-2 minutes.

## Step 7: Set Up Authentication

For the demo users to work, you need to set them up in Supabase Authentication. We've provided a helper script to automate this process:

### Using the Automated Script (Recommended)

First, ensure that your `.env.local` file includes the `SUPABASE_SERVICE_ROLE_KEY` as shown in Step 4.

Then install the required dependency:

```bash
npm install node-fetch
```

Run the authentication setup script:

```bash
node demo/data/user_auth_setup.js
```

This script will:
1. Create all demo users with the password `password123`
2. Skip any users that already exist
3. Provide a summary of the user creation process

### Manual Setup in Supabase Studio

If you prefer to set up users manually:

1. Open Supabase Studio at http://127.0.0.1:54323
2. Go to Authentication → Users
3. Click "Add User"
4. Add each demo user (you can find the full list in `demo/data/02_users.sql`)
   - Email: `admin.demo@example.com`
   - Password: Create a simple password like `password123`
5. Repeat for other users you want to test with

## Step 8: Start the Application

```bash
npm run dev
```

Open your browser to http://localhost:3000 and log in with one of the demo users:

- Admin: `admin.demo@example.com`
- Manager: `manager1.demo@example.com`
- Contributor: `designer1.demo@example.com`

Use the password `password123` (or whichever password you set in the previous step).

## Troubleshooting

### Docker Issues
- Ensure Docker is running before starting Supabase
- If services fail to start, try stopping and restarting: `supabase stop` then `supabase start`

### Database Connection Issues
- Check if Supabase is running with `supabase status`
- Verify PostgreSQL port 54321 is accessible: `telnet localhost 54321`

### Schema/Data Issues
- If you encounter SQL errors during data generation, check for existing data with `SELECT count(*) FROM users;`
- To reset the database: `supabase db reset`

### Authentication Issues
- If login fails, check the Studio User Management panel to ensure users exist
- Verify the correct password is being used
- Check for any errors in the browser console
- If using the automation script, ensure the service role key is correctly set in your `.env.local` file

## Re-enabling RLS (if needed)

After testing with the demo data, you may want to re-enable Row Level Security:

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_history ENABLE ROW LEVEL SECURITY;
```

## Shutting Down

When you're done with the demo:

```bash
# Stop the Next.js development server (Ctrl+C)

# Stop Supabase services
supabase stop
```

## Advanced: Customizing Demo Data

If you want to modify or extend the demo data:

1. Edit the SQL files in the `demo/data/` directory
2. Run specific script files individually or regenerate all data

For example, to add more brands:

```bash
# Edit the brands SQL file
nano demo/data/04_brands.sql

# Run just that file to update brands
psql -h localhost -p 54321 -U postgres -d postgres -f demo/data/04_brands.sql
``` 