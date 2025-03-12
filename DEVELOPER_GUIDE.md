# Developer Guide: Marketing Calendar SaaS

This guide provides detailed technical information for developers working on the Marketing Calendar SaaS application. It covers architecture, code organization, key components, and development workflows.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Development Environment Setup](#development-environment-setup)
- [Key Components and Files](#key-components-and-files)
- [Authentication System](#authentication-system)
- [Database Schema and Relationships](#database-schema-and-relationships)
- [State Management](#state-management)
- [UI Component System](#ui-component-system)
- [Form Handling](#form-handling)
- [API Integration](#api-integration)
- [Common Development Tasks](#common-development-tasks)
- [Testing](#testing)
- [Performance Considerations](#performance-considerations)
- [Known Issues and Workarounds](#known-issues-and-workarounds)

## Architecture Overview

The Marketing Calendar SaaS application follows a modern React architecture with the following key characteristics:

### Frontend Architecture

- **Component-Based Structure**: The UI is built using reusable React components
- **Functional Components**: All components are functional components using React Hooks
- **TypeScript**: Strong typing throughout the application
- **Context API**: Used for global state management (auth, themes, etc.)
- **React Router**: Handles routing and navigation

### Backend Architecture

- **Supabase**: Backend as a Service (BaaS) providing:
  - PostgreSQL database
  - Authentication system
  - Row Level Security (RLS) for data protection
  - Real-time subscriptions (not currently used but available)

### Data Flow

1. User interacts with the UI
2. React components update local state or call API functions
3. Supabase client makes API calls to the Supabase backend
4. Data is fetched/updated in the PostgreSQL database
5. UI is updated with the new data

## Development Environment Setup

### Required Tools

- **Node.js**: v16 or later
- **npm** or **yarn**: For package management
- **Git**: For version control
- **VS Code** (recommended): With the following extensions:
  - ESLint
  - Prettier
  - TypeScript
  - Tailwind CSS IntelliSense

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/aisandler/marketing-calendar-saas.git
   cd marketing-calendar-saas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Supabase Setup

1. Create a Supabase account at [https://app.supabase.com](https://app.supabase.com)
2. Create a new project
3. Run the SQL scripts in the following order:
   - `supabase_setup.sql`: Creates tables and RLS policies
   - `fix_rls_policy.sql`: Fixes RLS policies for initial setup
   - `add_sample_data.sql`: Adds sample data for development

4. Set up authentication:
   - Go to Authentication > Settings
   - Enable Email/Password sign-in
   - Disable email confirmation for development

## Key Components and Files

### Core Files

- `src/main.tsx`: Application entry point
- `src/App.tsx`: Main application component with routing
- `src/contexts/AuthContext.tsx`: Authentication context provider
- `src/lib/supabase.ts`: Supabase client configuration

### Important Directories

- `src/components/`: Reusable UI components
- `src/contexts/`: Context providers for state management
- `src/layouts/`: Page layout components
- `src/pages/`: Application pages
- `src/lib/`: Utility functions and services
- `src/types/`: TypeScript type definitions

### Key Components

- `AuthProvider`: Manages authentication state and provides auth functions
- `ProtectedRoute`: Protects routes from unauthenticated access
- `DashboardLayout`: Layout for authenticated pages with navigation
- `AuthLayout`: Layout for authentication pages

## Authentication System

The authentication system is built on Supabase Auth and implemented through the `AuthContext` provider.

### AuthContext

Located in `src/contexts/AuthContext.tsx`, this context provider:

1. Initializes the auth state by checking for an existing session
2. Provides functions for sign-in, sign-up, and sign-out
3. Maintains the current user state
4. Listens for auth state changes using Supabase's `onAuthStateChange`

```typescript
// Key functions in AuthContext
const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
};

const signUp = async (email: string, password: string, name: string) => {
  // Create auth user
  const { data, error } = await supabase.auth.signUp({ email, password });
  
  if (error || !data.user) {
    return { error, user: null };
  }
  
  // Create user record in the users table
  const { error: userError } = await supabase
    .from('users')
    .insert([
      {
        id: data.user.id,
        email,
        name,
        role: 'contributor',
        created_at: new Date().toISOString(),
      },
    ]);
  
  return { error: userError, user: data.user };
};

const signOut = async () => {
  await supabase.auth.signOut();
};
```

### Protected Routes

Protected routes are implemented using the `ProtectedRoute` component in `src/components/auth/ProtectedRoute.tsx`. This component:

1. Checks if the user is authenticated
2. Shows a loading indicator while checking
3. Redirects to the login page if not authenticated
4. Optionally checks for specific roles

```typescript
// Usage of ProtectedRoute
<Route element={
  <ProtectedRoute>
    <DashboardLayout />
  </ProtectedRoute>
}>
  <Route path="/dashboard" element={<Dashboard />} />
  {/* Other protected routes */}
</Route>
```

## Database Schema and Relationships

The application uses a PostgreSQL database with the following tables:

### Tables

1. **users**
   - Primary key: `id` (UUID)
   - Key fields: `email`, `name`, `role`
   - Relationships: One-to-many with briefs (as creator and approver)

2. **resources**
   - Primary key: `id` (UUID)
   - Key fields: `name`, `type`
   - Relationships: One-to-many with briefs

3. **briefs**
   - Primary key: `id` (UUID)
   - Key fields: `title`, `channel`, `start_date`, `due_date`, `status`, `priority`
   - Foreign keys:
     - `resource_id` → resources.id
     - `approver_id` → users.id
     - `created_by` → users.id
   - Relationships: One-to-many with history

4. **tradeshows**
   - Primary key: `id` (UUID)
   - Key fields: `name`, `start_date`, `end_date`
   - No foreign keys

5. **history**
   - Primary key: `id` (UUID)
   - Foreign keys:
     - `brief_id` → briefs.id
     - `changed_by` → users.id

### Entity Relationship Diagram

```
users
+----+------+-------+------+-----------+------------+
| id | name | email | role | created_at | avatar_url |
+----+------+-------+------+-----------+------------+
     ↑         ↑
     |         |
     |         |
briefs         |
+----+-------+----------+------------+-------------+--------+----------+
| id | title | resource_id | approver_id | created_by | ... | history_id |
+----+-------+----------+------------+-------------+--------+----------+
               ↑
               |
resources      |
+----+------+------+-----------+
| id | name | type | created_at |
+----+------+------+-----------+

history
+----+----------+------------+---------------+-----------+-----------+
| id | brief_id | changed_by | previous_state | new_state | created_at |
+----+----------+------------+---------------+-----------+-----------+

tradeshows
+----+------+------------+----------+-------------+-----------+
| id | name | start_date | end_date | description | created_at |
+----+------+------------+----------+-------------+-----------+
```

### Row Level Security (RLS)

The database uses Row Level Security to control access to data:

- **users**: Only admins can insert/update/delete users
- **resources**: Only admins and managers can insert/update/delete resources
- **briefs**: Users can view all briefs, but only update/delete their own or if they're admin/manager
- **tradeshows**: Only admins and managers can insert/update/delete tradeshows
- **history**: All users can view history, but it cannot be updated or deleted

## State Management

The application uses a combination of local component state and React Context for state management:

### Local State

Most components use React's `useState` and `useEffect` hooks for local state management:

```typescript
const [briefs, setBriefs] = useState<Brief[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchBriefs = async () => {
    try {
      setLoading(true);
      // Fetch data from Supabase
      // ...
      setBriefs(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  fetchBriefs();
}, []);
```

### Global State

The application uses React Context for global state:

- `AuthContext`: Manages authentication state
- Future expansion could include:
  - `ThemeContext`: For theme management
  - `NotificationContext`: For global notifications

## UI Component System

The UI is built using custom components styled with Tailwind CSS:

### Base Components

- `Button`: Customizable button component with variants
- `Input`: Form input component
- `Modal`: Reusable modal component

### Layout Components

- `AuthLayout`: Layout for authentication pages
- `DashboardLayout`: Layout for authenticated pages with navigation

### Page Components

Each page is a standalone component that:
1. Fetches its own data
2. Manages its own state
3. Handles its own business logic
4. Renders the UI

## Form Handling

Forms are built using React Hook Form with Zod for validation:

```typescript
// Example from CreateBrief.tsx
const briefSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  channel: z.string().min(1, 'Channel is required'),
  // Other fields...
});

type BriefFormData = z.infer<typeof briefSchema>;

const {
  register,
  handleSubmit,
  watch,
  control,
  formState: { errors },
} = useForm<BriefFormData>({
  resolver: zodResolver(briefSchema),
  defaultValues: {
    // Default values...
  },
});

const onSubmit = async (data: BriefFormData) => {
  // Submit form data...
};
```

## API Integration

The application uses the Supabase client for all API operations:

### Authentication

```typescript
// Sign in
const { error } = await supabase.auth.signInWithPassword({ email, password });

// Sign up
const { data, error } = await supabase.auth.signUp({ email, password });

// Sign out
await supabase.auth.signOut();
```

### Data Operations

```typescript
// Select data
const { data, error } = await supabase
  .from('briefs')
  .select('*')
  .order('due_date', { ascending: true });

// Insert data
const { data, error } = await supabase
  .from('briefs')
  .insert([{ title, channel, /* other fields */ }])
  .select();

// Update data
const { data, error } = await supabase
  .from('briefs')
  .update({ status: 'approved' })
  .eq('id', briefId)
  .select();

// Delete data
const { error } = await supabase
  .from('briefs')
  .delete()
  .eq('id', briefId);
```

## Common Development Tasks

### Adding a New Page

1. Create a new file in `src/pages/`
2. Import necessary components and hooks
3. Create a functional component with the page logic
4. Add the route in `src/App.tsx`

### Adding a New Component

1. Create a new file in `src/components/`
2. Define the component's props using TypeScript
3. Implement the component using functional component syntax
4. Export the component

### Adding a New Database Table

1. Add the table definition to `supabase_setup.sql`
2. Add the corresponding TypeScript interface in `src/types/index.ts`
3. Add the table type to `src/types/supabase.ts`
4. Set up appropriate RLS policies

## Testing

The application currently doesn't have automated tests, but here's how you could add them:

### Unit Testing

Use Jest and React Testing Library for unit tests:

```typescript
// Example test for Button component
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Integration Testing

Use Cypress for integration tests:

```typescript
// Example Cypress test for login
describe('Login', () => {
  it('should log in successfully', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

## Performance Considerations

### Database Queries
- Use appropriate indexes for frequently queried columns
- Implement pagination for large result sets
- Use efficient joins and avoid N+1 queries

### React Components
- Implement proper memoization for expensive computations
- Use virtual scrolling for long lists
- Lazy load components when appropriate

### State Management
- Keep state as local as possible
- Use appropriate caching strategies
- Implement optimistic updates where applicable

## TypeScript Tips

### Type Definitions
- Keep types in dedicated files under `src/types`
- Use strict type checking
- Implement proper interface segregation

### Best Practices
- Use type inference where possible
- Implement proper error handling with type guards
- Keep type definitions DRY

## Known Issues and Workarounds

### Gantt Chart TypeScript Issues

The DHTMLX Gantt library doesn't have proper TypeScript definitions. The workaround is to use type assertions:

```typescript
// In CalendarView.tsx
import gantt from 'dhtmlx-gantt';
// ...
(gantt as any).init(ganttContainer.current);
```

### Authentication Flow Issues

There can be issues with the authentication flow if the user exists in Supabase Auth but not in the `users` table. The workaround is to:

1. Use the `fix_auth_issues.sql` script to clean up inconsistent users
2. Ensure that when a user signs up, a record is created in both Auth and the `users` table

### Row Level Security (RLS) Issues

When setting up the application for the first time, RLS policies can prevent the creation of the first admin user. The workaround is to:

1. Temporarily disable RLS using the `fix_rls_policy.sql` script
2. Create the initial admin user
3. Re-enable RLS with proper policies

---

This developer guide should provide a comprehensive overview of the technical aspects of the Marketing Calendar SaaS application. For specific questions or issues, please refer to the codebase or open an issue on the GitHub repository. 