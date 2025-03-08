# Supabase Authentication Setup Guide

This guide will walk you through setting up authentication for the Marketing Calendar SaaS application using Supabase.

## 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com) and sign in or create an account
2. Click "New Project"
3. Enter a name for your project (e.g., "Marketing Calendar")
4. Set a secure database password (save this somewhere safe)
5. Choose a region closest to your users
6. Click "Create new project"
7. Wait for your project to be created (this may take a few minutes)

## 2. Set Up Database Tables

1. In your Supabase project dashboard, go to the SQL Editor
2. Copy the contents of the `supabase_setup.sql` file from this project
3. Paste the SQL into the SQL Editor
4. Click "Run" to execute the SQL and create all necessary tables and policies

## 3. Configure Authentication Settings

1. In your Supabase project dashboard, go to Authentication > Settings
2. Under "Email Auth", make sure "Enable Email Signup" is turned on
3. Configure other settings as needed:
   - You may want to disable "Confirm email" for development
   - Set a custom SMTP server for production use

## 4. Create an Admin User

The SQL script creates a user record, but you need to create the corresponding auth user:

1. Go to Authentication > Users
2. Click "Invite user"
3. Enter the email "admin@example.com" (or whatever email you used in the SQL script)
4. Click "Invite"
5. You'll receive an email with a link to set your password
6. Follow the link and set a secure password for the admin account

## 5. Get Your API Keys

1. Go to Project Settings > API
2. Copy the "URL" and "anon" key
3. Update your `.env` file with these values:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## 6. Link Auth Users with Database Users

For this application to work correctly, each authenticated user needs a corresponding record in the `users` table. The application handles this in the `AuthContext.tsx` file, but you should be aware of this relationship.

When a new user signs up:
1. A new auth user is created in Supabase Auth
2. The application creates a corresponding record in the `users` table
3. The user's UUID from Auth is used as the ID in the `users` table

## 7. Testing Authentication

1. Start your application with `npm run dev`
2. Navigate to the login page
3. Log in with the admin credentials you set up
4. You should be redirected to the dashboard
5. Try creating a new user through the application's user management interface

## Troubleshooting

### User Can't Log In

1. Check that the email exists in both Supabase Auth and the `users` table
2. Verify that the `.env` file has the correct Supabase URL and anon key
3. Check browser console for any errors

### Permission Issues

1. Verify that Row Level Security (RLS) policies are correctly set up
2. Check that the user has the appropriate role in the `users` table
3. Review the SQL setup script to ensure all policies are created correctly

### Database Connection Issues

1. Verify that your Supabase project is active
2. Check that your anon key has the necessary permissions
3. Ensure your IP is not blocked by any firewall settings 