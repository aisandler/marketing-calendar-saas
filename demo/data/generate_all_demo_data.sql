-- Master Script for Demo Data Generation
-- This script runs all the individual demo data generation scripts in the correct order

\echo '======== Starting Demo Data Generation ========'
\echo 'This will create a rich set of demo data with history to demonstrate the application features.'
\echo 'The process may take a few minutes to complete.'
\echo ''

\echo '1. Setting up environment and helper functions...'
\i demo/data/01_setup.sql

\echo '2. Creating demo users...'
\i demo/data/02_users.sql

\echo '3. Creating teams and resources...'
\i demo/data/03_teams_resources.sql

\echo '4. Creating brands...'
\i demo/data/04_brands.sql

\echo '5. Creating campaigns...'
\i demo/data/05_campaigns.sql

\echo '6. Creating briefs (part 1)...'
\i demo/data/06_briefs_part1.sql

\echo '7. Creating briefs (part 2)...'
\i demo/data/06_briefs_part2.sql

\echo '8. Creating brief history records...'
\i demo/data/07_brief_history.sql

\echo ''
\echo '======== Demo Data Generation Complete ========'
\echo 'The database now contains a rich set of demo data with:'
\echo '- Multiple demo users with different roles'
\echo '- Teams and resources with realistic properties'
\echo '- Brands with distinct identities'
\echo '- Campaigns spanning past, present, and future'
\echo '- Briefs in various states with specifications'
\echo '- History records showing brief progression'
\echo ''
\echo 'You can now use the application with this realistic data to demonstrate features.' 