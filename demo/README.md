# Demo Data Generation

This directory contains scripts to generate a rich set of demo data for the Marketing Calendar application. The generated data simulates historical usage of the system with realistic patterns.

## Purpose

The generated demo data provides:

- Data that spans over a year of simulated usage
- Realistic resource allocations and utilization patterns
- Briefs in various states of completion
- Campaign timelines across multiple brands
- Historical progression of briefs through their lifecycle

This enables effective demonstration of the application's resource management features and reporting capabilities.

## Setup Instructions

### Prerequisites

1. Node.js and npm installed on your machine
2. Git installed on your machine
3. Docker installed (required for local Supabase)

### Step 1: Install Supabase CLI

First, you need to install the Supabase CLI which will manage your local Supabase instance:

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Windows (using Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Linux/Windows WSL:**
```bash
curl -s https://raw.githubusercontent.com/supabase/supabase/master/bin/supabase-linux-amd64 | sudo tar -xz -C /usr/local/bin
```

### Step 2: Initialize and Start Local Supabase

Navigate to your project root directory and initialize a local Supabase project:

```bash
# Navigate to your project directory if not already there
cd marketing-cal-bolt

# Initialize Supabase project locally
supabase init

# Start the Supabase services
supabase start
```

This will start a local Supabase instance with:
- PostgreSQL database
- API server
- Studio (web UI for managing your database)

When the instance starts, it will output:
- The local API URL (typically http://127.0.0.1:54321)
- The anon key and service role key
- The Studio URL (typically http://127.0.0.1:54323)

### Step 3: Set Up Local Environment Variables

Create or update your `.env.local` file with the Supabase credentials:

```bash
# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY_FROM_PREVIOUS_STEP]
EOF
```

### Step 4: Initialize Database Schema

The Supabase instance needs the application schema before we can add demo data. Run migrations to set up the tables:

```bash
# If you have a migrations script, run it:
npm run migrate:local

# Alternatively, if you have SQL files for schema setup:
psql -h localhost -p 54321 -U postgres -d postgres -f supabase/migrations/schema.sql
```

### Step 5: Run Demo Data Generation

Now you're ready to run the demo data generation scripts:

```bash
# Run the master script that will generate all demo data
psql -h localhost -p 54321 -U postgres -d postgres -f demo/data/generate_all_demo_data.sql
```

### Step 6: Access the Application with Demo Data

1. Start your application:
```bash
npm run dev
```

2. Open your browser and go to `http://localhost:3000`

3. Log in with one of the demo users:
   - Admin: `admin.demo@example.com` 
   - Manager: `manager1.demo@example.com`
   - Contributor: `designer1.demo@example.com`

   Password for all demo users: `password123` (or the default development password for your Supabase setup)

### Troubleshooting

- **Database connection issues**: Ensure Docker is running and the Supabase services are up with `supabase status`
- **Migration errors**: Check if tables already exist with `psql -h localhost -p 54321 -U postgres -d postgres -c "\dt"`
- **Login issues**: You may need to create the users in Supabase Auth. Visit the Supabase Studio at http://127.0.0.1:54323 and add the users manually

### Re-enabling RLS (if needed)

If you want to re-enable Row Level Security after data generation, run:

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_history ENABLE ROW LEVEL SECURITY;
```

## Generated Demo Data

The scripts will create:

- **Users**: Admin, manager, and contributor roles with realistic names and avatars
- **Teams**: Design, Content, Digital Marketing, Video Production, and Web Development
- **Resources**: Internal team members, agency resources, and freelancers with different capacities and rates
- **Brands**: 7 demo brands with distinct identities and purposes
- **Campaigns**: Multiple campaigns per brand spanning past, present, and future timeframes
- **Briefs**: 150-200 briefs with realistic specifications and varied statuses
- **History**: Records showing progression of briefs through workflow stages

All demo data is prefixed with "Demo" in names and titles for easy identification.

## Login Information

You can log in with any of the demo users created:

- Admin: `admin.demo@example.com` (password: use your local Supabase development password)
- Manager: `manager1.demo@example.com` (password: use your local Supabase development password)
- Contributor: `designer1.demo@example.com`, etc. (password: use your local Supabase development password)

## Cleanup

If you need to remove all demo data, you can run:

```sql
DELETE FROM public.brief_history WHERE brief_id IN (SELECT id FROM public.briefs WHERE title LIKE 'Demo%');
DELETE FROM public.briefs WHERE title LIKE 'Demo%';
DELETE FROM public.campaigns WHERE name LIKE 'Demo%';
DELETE FROM public.brands WHERE name LIKE 'Demo%';
DELETE FROM public.resources WHERE name LIKE 'Demo%';
DELETE FROM public.teams WHERE name LIKE 'Demo%';
DELETE FROM public.users WHERE email LIKE '%.demo@example.com';
``` 