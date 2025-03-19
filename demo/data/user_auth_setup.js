// Demo User Authentication Setup
// This script creates the demo users in Supabase Auth to enable login

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

// Configuration from .env.local
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// If no service key is found, provide instructions
if (!SUPABASE_SERVICE_KEY) {
  console.error('\x1b[31mError: SUPABASE_SERVICE_ROLE_KEY not found in .env.local\x1b[0m');
  console.log('\nPlease add your service role key to .env.local file:');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
  console.log('\nYou can find this key in the output when you run: supabase start');
  process.exit(1);
}

// Demo user data from 02_users.sql
const demoUsers = [
  { email: 'admin.demo@example.com', name: 'Alex Director', role: 'admin' },
  { email: 'cmo.demo@example.com', name: 'Taylor Johnson', role: 'admin' },
  { email: 'manager1.demo@example.com', name: 'Jordan Smith', role: 'manager' },
  { email: 'manager2.demo@example.com', name: 'Casey Wilson', role: 'manager' },
  { email: 'manager3.demo@example.com', name: 'Morgan Davis', role: 'manager' },
  { email: 'manager4.demo@example.com', name: 'Riley Roberts', role: 'manager' },
  { email: 'manager5.demo@example.com', name: 'Avery Martin', role: 'manager' },
  { email: 'designer1.demo@example.com', name: 'Sam Thompson', role: 'contributor' },
  { email: 'designer2.demo@example.com', name: 'Jamie Garcia', role: 'contributor' },
  { email: 'copywriter1.demo@example.com', name: 'Drew Anderson', role: 'contributor' },
  { email: 'copywriter2.demo@example.com', name: 'Finley Cooper', role: 'contributor' },
  { email: 'developer1.demo@example.com', name: 'Quinn Evans', role: 'contributor' },
  { email: 'developer2.demo@example.com', name: 'Parker Nelson', role: 'contributor' },
  { email: 'video1.demo@example.com', name: 'Robin Carter', role: 'contributor' },
  { email: 'social1.demo@example.com', name: 'Skyler Wright', role: 'contributor' },
  { email: 'social2.demo@example.com', name: 'Charlie Baker', role: 'contributor' },
  { email: 'analyst1.demo@example.com', name: 'Blake Mitchell', role: 'contributor' },
];

// Password for all demo users
const defaultPassword = 'password123';

// Function to create a user in Supabase Auth
async function createUser(user) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        email: user.email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role
        }
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Created user: ${user.email} (${user.role})`);
      return true;
    } else {
      if (data.msg && data.msg.includes('already exists')) {
        console.log(`⚠️ User already exists: ${user.email}`);
        return true;
      } else {
        console.error(`❌ Failed to create user ${user.email}:`, data);
        return false;
      }
    }
  } catch (error) {
    console.error(`❌ Error creating user ${user.email}:`, error.message);
    return false;
  }
}

// Main function to create all demo users
async function setupDemoUsers() {
  console.log('\n🔧 Setting up demo users in Supabase Auth...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const user of demoUsers) {
    const success = await createUser(user);
    if (success) successCount++;
    else failCount++;
  }
  
  console.log('\n✨ Demo user setup complete!');
  console.log(`✅ Successfully processed ${successCount} users`);
  if (failCount > 0) {
    console.log(`❌ Failed to process ${failCount} users`);
  }
  console.log(`\n🔑 All users have the password: ${defaultPassword}`);
  console.log('\nYou can now log in to the application with any of these users.');
}

// Run the main function
setupDemoUsers().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 