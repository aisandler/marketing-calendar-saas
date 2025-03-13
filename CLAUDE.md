# Marketing Calendar SAAS - Development Guide

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run typecheck` - Run TypeScript type checking
- Tests - Currently no test commands defined in package.json

## Code Style Guidelines
- **TypeScript**: Use strict typing with explicit interfaces/types for all props, state, and functions
- **React**: Functional components with hooks (no class components)
- **Imports Order**: React first, third-party libraries, then local imports alphabetically
- **Component Naming**: PascalCase for components and their files
- **Variable Naming**: camelCase for variables, functions, and instances
- **Component Structure**: Props interface first, then component definition
- **Styling**: Tailwind CSS with class-variance-authority for variants; use cn() utility for class merging
- **Forms**: react-hook-form with zod schemas for validation
- **Error Handling**: Try/catch blocks with specific error states in UI; always log errors to console
- **API Calls**: Use Supabase client for all database operations with proper error handling
- **State Management**: Context API for global state, useState/useReducer for local component state

## Database Guidelines
- Follow RLS (Row Level Security) policies for all data access
- Add migration scripts to /supabase/migrations/ for schema changes
- Use TypeScript types from supabase.ts for database entities