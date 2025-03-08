# Marketing Calendar SaaS

A comprehensive marketing calendar application for managing marketing briefs, resources, and tradeshows.

![Marketing Calendar](https://i.imgur.com/JKgXPpL.png)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Database Setup](#database-setup)
  - [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Development](#development)
  - [Available Scripts](#available-scripts)
  - [Code Style](#code-style)
- [Data Models](#data-models)
- [Component Architecture](#component-architecture)
- [API Integration](#api-integration)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

Marketing Calendar is a SaaS application designed to help marketing teams plan, organize, and track their marketing activities. It provides a centralized platform for managing marketing briefs, resources, and tradeshows, with a visual calendar interface for timeline management.

## Features

- **User Management**: Role-based access control with admin, manager, and contributor roles
- **Marketing Briefs**: Create, edit, and manage marketing briefs with detailed specifications
- **Resource Management**: Assign and track internal and external resources
- **Calendar View**: Visual Gantt chart for timeline management
- **Tradeshow Planning**: Manage tradeshow events and related marketing activities
- **Dashboard**: Overview of key metrics and upcoming deadlines
- **History Tracking**: Track changes to briefs for accountability

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI Components**: Custom components with Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router
- **Form Handling**: React Hook Form with Zod validation
- **Backend**: Supabase (Backend as a Service)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Calendar**: DHTMLX Gantt
- **Icons**: Lucide React

## Project Structure

```
marketing-calendar-saas/
├── public/                  # Static assets
├── src/                     # Source code
│   ├── components/          # Reusable UI components
│   │   ├── auth/            # Authentication-related components
│   │   └── ui/              # UI components (Button, Input, etc.)
│   ├── contexts/            # React context providers
│   │   └── AuthContext.tsx  # Authentication context
│   ├── layouts/             # Page layout components
│   │   ├── AuthLayout.tsx   # Layout for auth pages
│   │   └── DashboardLayout.tsx # Layout for dashboard pages
│   ├── lib/                 # Utility functions and services
│   │   ├── supabase.ts      # Supabase client configuration
│   │   └── utils.ts         # Utility functions
│   ├── pages/               # Application pages
│   │   ├── auth/            # Authentication pages
│   │   ├── BriefDetail.tsx  # Brief detail page
│   │   ├── BriefsList.tsx   # Briefs list page
│   │   ├── CalendarView.tsx # Calendar view page
│   │   ├── CreateBrief.tsx  # Create brief page
│   │   ├── Dashboard.tsx    # Dashboard page
│   │   ├── ResourceManagement.tsx # Resource management page
│   │   ├── TradeshowsList.tsx # Tradeshows list page
│   │   └── UserManagement.tsx # User management page
│   ├── types/               # TypeScript type definitions
│   │   ├── index.ts         # Common types
│   │   └── supabase.ts      # Supabase database types
│   ├── App.tsx              # Main application component
│   ├── index.css            # Global CSS
│   ├── main.tsx             # Application entry point
│   └── vite-env.d.ts        # Vite environment types
├── .env                     # Environment variables
├── .gitignore               # Git ignore file
├── add_sample_data.sql      # SQL script to add sample data
├── eslint.config.js         # ESLint configuration
├── fix_auth_issues.sql      # SQL script to fix auth issues
├── fix_rls_policy.sql       # SQL script to fix RLS policies
├── index.html               # HTML entry point
├── package.json             # NPM package configuration
├── postcss.config.js        # PostCSS configuration
├── supabase_setup.sql       # SQL script to set up Supabase
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- A Supabase account (free tier works fine)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/aisandler/marketing-calendar-saas.git
   cd marketing-calendar-saas
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Database Setup

1. Create a new Supabase project at [https://app.supabase.com](https://app.supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the `supabase_setup.sql` script to create the necessary tables and policies
4. Run the `add_sample_data.sql` script to add sample data for testing

#### Database Schema

The application uses the following tables:

- `users`: User accounts with role-based permissions
- `resources`: Internal and external resources for marketing activities
- `briefs`: Marketing briefs with detailed specifications
- `tradeshows`: Tradeshow events
- `history`: Change history for briefs

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under API.

## Authentication

The application uses Supabase Authentication for user management. There are three user roles:

- **Admin**: Full access to all features, including user management
- **Manager**: Can create and manage briefs, resources, and tradeshows
- **Contributor**: Limited access to view and update assigned briefs

### Setting Up Authentication

1. Go to Authentication > Settings in your Supabase dashboard
2. Enable Email/Password sign-in method
3. (Optional) Disable email confirmation for development
4. Create an admin user:
   - Go to Authentication > Users
   - Click "Add User"
   - Enter email and password
   - Run the following SQL to set the user as admin:
     ```sql
     UPDATE public.users SET role = 'admin' WHERE email = 'your_email@example.com';
     ```

## Development

### Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run preview`: Preview the production build locally
- `npm run lint`: Run ESLint to check for code issues

### Code Style

The project uses ESLint for code linting and follows modern React and TypeScript best practices:

- Functional components with hooks
- TypeScript for type safety
- React Context for state management
- Tailwind CSS for styling

## Data Models

### User

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'contributor';
  created_at: string;
  avatar_url: string | null;
}
```

### Resource

```typescript
interface Resource {
  id: string;
  name: string;
  type: 'internal' | 'agency' | 'freelancer';
  created_at: string;
}
```

### Brief

```typescript
interface Brief {
  id: string;
  title: string;
  channel: string;
  start_date: string;
  due_date: string;
  resource_id: string | null;
  approver_id: string | null;
  status: 'draft' | 'pending_approval' | 'approved' | 'in_progress' | 'review' | 'complete' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string | null;
  specifications: any | null;
  estimated_hours: number | null;
  expenses: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

### Tradeshow

```typescript
interface Tradeshow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  description: string | null;
  created_at: string;
}
```

### History

```typescript
interface History {
  id: string;
  brief_id: string;
  changed_by: string;
  previous_state: any;
  new_state: any;
  created_at: string;
}
```

## Component Architecture

### Auth Flow

The authentication flow is managed by the `AuthContext` provider, which:

1. Checks for an existing session on load
2. Provides sign-in, sign-up, and sign-out functions
3. Maintains the current user state
4. Listens for auth state changes

Protected routes are implemented using the `ProtectedRoute` component, which redirects unauthenticated users to the login page.

### Layout Structure

The application uses two main layouts:

- `AuthLayout`: Used for login and registration pages
- `DashboardLayout`: Used for all authenticated pages, includes the sidebar navigation

### Page Components

Each page component follows a similar pattern:

1. Fetch data in a `useEffect` hook
2. Manage loading and error states
3. Provide CRUD operations for the relevant data
4. Render the UI based on the current state

## API Integration

The application uses Supabase for all data operations. The Supabase client is configured in `src/lib/supabase.ts` and used throughout the application for:

- Authentication (sign-in, sign-up, sign-out)
- Data fetching (SELECT queries)
- Data manipulation (INSERT, UPDATE, DELETE operations)

Example of a data fetch operation:

```typescript
const fetchBriefs = async () => {
  try {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('briefs')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    
    setBriefs(data);
  } catch (error) {
    console.error('Error fetching briefs:', error);
    setError('Failed to load briefs.');
  } finally {
    setLoading(false);
  }
};
```

## Deployment

### Build for Production

1. Run the build command:
   ```bash
   npm run build
   ```

2. The build output will be in the `dist` directory, which can be deployed to any static hosting service.

### Hosting Options

- **Vercel**: Easy deployment with GitHub integration
- **Netlify**: Similar to Vercel, with automatic deployments
- **GitHub Pages**: Free hosting for static sites
- **Firebase Hosting**: Google's hosting service with good free tier

## Troubleshooting

### Common Issues

#### Authentication Issues

If you're having trouble with authentication:

1. Check that your Supabase URL and anon key are correct in the `.env` file
2. Ensure that Email/Password sign-in is enabled in Supabase
3. Check that the user exists in both the auth system and the `users` table
4. Run the `fix_auth_issues.sql` script to fix common auth issues

#### Database Issues

If you're having issues with database operations:

1. Check that the tables are created correctly using the `supabase_setup.sql` script
2. Ensure that Row Level Security (RLS) policies are set up correctly
3. Run the `fix_rls_policy.sql` script to fix common RLS issues
4. Check that the user has the appropriate role for the operation they're trying to perform

#### Calendar View Issues

If the Gantt chart in the Calendar view isn't working:

1. Check that the dhtmlx-gantt library is installed
2. Ensure that the Gantt chart is properly initialized in the `CalendarView` component
3. Check the browser console for any JavaScript errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

If you have any questions or need help with the application, please open an issue on the GitHub repository.

## Acknowledgements

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [DHTMLX Gantt](https://dhtmlx.com/docs/products/dhtmlxGantt/)
- [Lucide Icons](https://lucide.dev/) 