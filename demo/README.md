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

1. A local Supabase instance running
2. The database schema already set up (tables, functions, etc.)
3. RLS temporarily disabled (for easier data insertion)

### Configuration

1. Ensure your local environment is properly set up with the `.env.local` file pointing to your local Supabase instance:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

2. Start your local Supabase instance:

```bash
supabase start
```

### Running the Demo Data Generation

You can run the complete demo data generation in two ways:

#### Option 1: Run the master script

```bash
psql -h localhost -p 54321 -U postgres -d postgres -f demo/data/generate_all_demo_data.sql
```

#### Option 2: Run individual scripts sequentially

If you prefer to run scripts individually or need to debug specific steps:

```bash
psql -h localhost -p 54321 -U postgres -d postgres -f demo/data/01_setup.sql
psql -h localhost -p 54321 -U postgres -d postgres -f demo/data/02_users.sql
psql -h localhost -p 54321 -U postgres -d postgres -f demo/data/03_teams_resources.sql
psql -h localhost -p 54321 -U postgres -d postgres -f demo/data/04_brands.sql
psql -h localhost -p 54321 -U postgres -d postgres -f demo/data/05_campaigns.sql
psql -h localhost -p 54321 -U postgres -d postgres -f demo/data/06_briefs_part1.sql
psql -h localhost -p 54321 -U postgres -d postgres -f demo/data/06_briefs_part2.sql
psql -h localhost -p 54321 -U postgres -d postgres -f demo/data/07_brief_history.sql
```

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