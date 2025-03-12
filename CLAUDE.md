# Marketing Calendar SAAS - Development Guide

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Code Style Guidelines
- **TypeScript**: Use strict typing throughout
- **React**: Functional components with hooks (no class components)
- **Imports Order**: React first, third-party libraries, then local imports
- **Component Naming**: PascalCase for components and their files
- **Component Structure**: Props interface first, then component definition
- **Styling**: Use Tailwind CSS with class-variance-authority for variants
- **Utils**: Use cn() from utils.ts for class merging
- **Forms**: Use react-hook-form with zod for validation
- **Error Handling**: Try/catch with appropriate error states
- **API Calls**: Use Supabase client for all database operations
- **State Management**: Context API for global state, useState for local state

## Database Guidelines
- Follow RLS policies for data access
- Add migration scripts to /supabase/migrations/