# Marketing Calendar SaaS

A comprehensive marketing calendar application for managing marketing briefs, resources, and tradeshows.

## Features

- User management with role-based access control (admin, manager, contributor)
- Marketing brief creation and management
- Resource allocation and management
- Tradeshow planning
- Calendar view for marketing activities
- History tracking for briefs

## Setup Instructions

### Prerequisites

- Node.js (latest LTS version recommended)
- npm or yarn
- A Supabase account (free tier works fine)

### Supabase Setup

1. Create a new Supabase project at [https://app.supabase.com](https://app.supabase.com)
2. Once your project is created, go to the SQL Editor in the Supabase dashboard
3. Copy the contents of the `supabase_setup.sql` file from this project
4. Paste and run the SQL in the Supabase SQL Editor to create all necessary tables and policies
5. Go to Authentication > Settings and enable Email/Password sign-in method
6. Go to Project Settings > API to get your Supabase URL and anon key

### Application Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the development server:
   ```
   npm run dev
   ```
5. Access the application at the URL provided by Vite (typically http://localhost:5173)

### Initial Login

The database setup script creates an initial admin user:
- Email: admin@example.com
- Password: You need to set this up manually in the Supabase Authentication dashboard

To set up the admin password:
1. Go to your Supabase dashboard > Authentication > Users
2. Find the admin user
3. Click on the three dots menu and select "Reset password"
4. Set a password for the admin user

## Development

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check for code issues

## Technologies Used

- React
- TypeScript
- Vite
- Supabase (Backend as a Service)
- React Router
- React Hook Form
- Zod (form validation)
- Tailwind CSS
- Lucide React (icons)
- DHTMLX Gantt (for calendar view)

## Project Structure

- `src/components` - Reusable UI components
- `src/contexts` - React context providers
- `src/layouts` - Page layout components
- `src/lib` - Utility functions and Supabase client
- `src/pages` - Application pages
- `src/types` - TypeScript type definitions

## License

MIT 