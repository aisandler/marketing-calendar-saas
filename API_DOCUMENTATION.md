# API Documentation: Marketing Calendar SaaS

This document provides comprehensive documentation for the API endpoints used in the Marketing Calendar SaaS application. It covers all interactions with the Supabase backend, including authentication, data operations, and error handling.

## Table of Contents

- [Authentication API](#authentication-api)
- [Users API](#users-api)
- [Resources API](#resources-api)
- [Briefs API](#briefs-api)
- [Tradeshows API](#tradeshows-api)
- [History API](#history-api)
- [Error Handling](#error-handling)
- [TypeScript Interfaces](#typescript-interfaces)

## Authentication API

The application uses Supabase Authentication for user management.

### Sign Up

Creates a new user account and adds the user to the `users` table.

```typescript
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
```

**Parameters:**
- `email`: User's email address
- `password`: User's password
- `name`: User's display name

**Returns:**
- `error`: Any error that occurred during sign-up
- `user`: The created user object if successful

### Sign In

Authenticates a user with email and password.

```typescript
const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
};
```

**Parameters:**
- `email`: User's email address
- `password`: User's password

**Returns:**
- `error`: Any error that occurred during sign-in

### Sign Out

Logs out the current user.

```typescript
const signOut = async () => {
  await supabase.auth.signOut();
};
```

**Returns:**
- No explicit return value

### Get Current User

Retrieves the currently authenticated user.

```typescript
const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { user: null };
  }
  
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  return { user: userData, error };
};
```

**Returns:**
- `user`: The current user object if authenticated
- `error`: Any error that occurred during the operation

## Users API

### Get All Users

Retrieves all users from the database.

```typescript
const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name');
  
  return { users: data, error };
};
```

**Returns:**
- `users`: Array of user objects
- `error`: Any error that occurred during the operation

### Get User by ID

Retrieves a specific user by their ID.

```typescript
const getUserById = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { user: data, error };
};
```

**Parameters:**
- `userId`: The UUID of the user to retrieve

**Returns:**
- `user`: The user object if found
- `error`: Any error that occurred during the operation

### Update User

Updates a user's information.

```typescript
const updateUser = async (userId: string, updates: Partial<User>) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select();
  
  return { user: data?.[0], error };
};
```

**Parameters:**
- `userId`: The UUID of the user to update
- `updates`: Object containing the fields to update

**Returns:**
- `user`: The updated user object
- `error`: Any error that occurred during the operation

## Resources API

### Get All Resources

Retrieves all resources from the database.

```typescript
const getAllResources = async () => {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('name');
  
  return { resources: data, error };
};
```

**Returns:**
- `resources`: Array of resource objects
- `error`: Any error that occurred during the operation

### Get Resource by ID

Retrieves a specific resource by its ID.

```typescript
const getResourceById = async (resourceId: string) => {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', resourceId)
    .single();
  
  return { resource: data, error };
};
```

**Parameters:**
- `resourceId`: The UUID of the resource to retrieve

**Returns:**
- `resource`: The resource object if found
- `error`: Any error that occurred during the operation

### Create Resource

Creates a new resource.

```typescript
const createResource = async (resource: Omit<Resource, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('resources')
    .insert([{
      ...resource,
      created_at: new Date().toISOString(),
    }])
    .select();
  
  return { resource: data?.[0], error };
};
```

**Parameters:**
- `resource`: Object containing the resource data (without id and created_at)

**Returns:**
- `resource`: The created resource object
- `error`: Any error that occurred during the operation

### Update Resource

Updates a resource's information.

```typescript
const updateResource = async (resourceId: string, updates: Partial<Resource>) => {
  const { data, error } = await supabase
    .from('resources')
    .update(updates)
    .eq('id', resourceId)
    .select();
  
  return { resource: data?.[0], error };
};
```

**Parameters:**
- `resourceId`: The UUID of the resource to update
- `updates`: Object containing the fields to update

**Returns:**
- `resource`: The updated resource object
- `error`: Any error that occurred during the operation

### Delete Resource

Deletes a resource.

```typescript
const deleteResource = async (resourceId: string) => {
  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', resourceId);
  
  return { error };
};
```

**Parameters:**
- `resourceId`: The UUID of the resource to delete

**Returns:**
- `error`: Any error that occurred during the operation

## Briefs API

### Get All Briefs

Retrieves all briefs with related data.

```typescript
const getAllBriefs = async () => {
  const { data, error } = await supabase
    .from('briefs')
    .select(`
      *,
      resources:resource_id (id, name, type),
      approver:approver_id (id, name, email),
      creator:created_by (id, name, email)
    `)
    .order('due_date');
  
  return { briefs: data, error };
};
```

**Returns:**
- `briefs`: Array of brief objects with related data
- `error`: Any error that occurred during the operation

### Get Brief by ID

Retrieves a specific brief by its ID with related data.

```typescript
const getBriefById = async (briefId: string) => {
  const { data, error } = await supabase
    .from('briefs')
    .select(`
      *,
      resources:resource_id (id, name, type),
      approver:approver_id (id, name, email),
      creator:created_by (id, name, email),
      history:history (*)
    `)
    .eq('id', briefId)
    .single();
  
  return { brief: data, error };
};
```

**Parameters:**
- `briefId`: The UUID of the brief to retrieve

**Returns:**
- `brief`: The brief object with related data if found
- `error`: Any error that occurred during the operation

### Create Brief

Creates a new brief.

```typescript
const createBrief = async (brief: Omit<Brief, 'id' | 'created_at'>, userId: string) => {
  const { data, error } = await supabase
    .from('briefs')
    .insert([{
      ...brief,
      created_by: userId,
      created_at: new Date().toISOString(),
    }])
    .select();
  
  return { brief: data?.[0], error };
};
```

**Parameters:**
- `brief`: Object containing the brief data (without id and created_at)
- `userId`: The UUID of the user creating the brief

**Returns:**
- `brief`: The created brief object
- `error`: Any error that occurred during the operation

### Update Brief

Updates a brief's information and creates a history record.

```typescript
const updateBrief = async (
  briefId: string, 
  updates: Partial<Brief>, 
  userId: string,
  previousState: Brief
) => {
  // Start a transaction
  const { data, error } = await supabase.rpc('update_brief_with_history', {
    p_brief_id: briefId,
    p_updates: updates,
    p_user_id: userId,
    p_previous_state: previousState
  });
  
  return { brief: data, error };
};
```

**Parameters:**
- `briefId`: The UUID of the brief to update
- `updates`: Object containing the fields to update
- `userId`: The UUID of the user making the update
- `previousState`: The previous state of the brief for history tracking

**Returns:**
- `brief`: The updated brief object
- `error`: Any error that occurred during the operation

### Delete Brief

Deletes a brief.

```typescript
const deleteBrief = async (briefId: string) => {
  const { error } = await supabase
    .from('briefs')
    .delete()
    .eq('id', briefId);
  
  return { error };
};
```

**Parameters:**
- `briefId`: The UUID of the brief to delete

**Returns:**
- `error`: Any error that occurred during the operation

## Tradeshows API

### Get All Tradeshows

Retrieves all tradeshows from the database.

```typescript
const getAllTradeshows = async () => {
  const { data, error } = await supabase
    .from('tradeshows')
    .select('*')
    .order('start_date');
  
  return { tradeshows: data, error };
};
```

**Returns:**
- `tradeshows`: Array of tradeshow objects
- `error`: Any error that occurred during the operation

### Get Tradeshow by ID

Retrieves a specific tradeshow by its ID.

```typescript
const getTradeShowById = async (tradeshowId: string) => {
  const { data, error } = await supabase
    .from('tradeshows')
    .select('*')
    .eq('id', tradeshowId)
    .single();
  
  return { tradeshow: data, error };
};
```

**Parameters:**
- `tradeshowId`: The UUID of the tradeshow to retrieve

**Returns:**
- `tradeshow`: The tradeshow object if found
- `error`: Any error that occurred during the operation

### Create Tradeshow

Creates a new tradeshow.

```typescript
const createTradeshow = async (tradeshow: Omit<Tradeshow, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('tradeshows')
    .insert([{
      ...tradeshow,
      created_at: new Date().toISOString(),
    }])
    .select();
  
  return { tradeshow: data?.[0], error };
};
```

**Parameters:**
- `tradeshow`: Object containing the tradeshow data (without id and created_at)

**Returns:**
- `tradeshow`: The created tradeshow object
- `error`: Any error that occurred during the operation

### Update Tradeshow

Updates a tradeshow's information.

```typescript
const updateTradeshow = async (tradeshowId: string, updates: Partial<Tradeshow>) => {
  const { data, error } = await supabase
    .from('tradeshows')
    .update(updates)
    .eq('id', tradeshowId)
    .select();
  
  return { tradeshow: data?.[0], error };
};
```

**Parameters:**
- `tradeshowId`: The UUID of the tradeshow to update
- `updates`: Object containing the fields to update

**Returns:**
- `tradeshow`: The updated tradeshow object
- `error`: Any error that occurred during the operation

### Delete Tradeshow

Deletes a tradeshow.

```typescript
const deleteTradeshow = async (tradeshowId: string) => {
  const { error } = await supabase
    .from('tradeshows')
    .delete()
    .eq('id', tradeshowId);
  
  return { error };
};
```

**Parameters:**
- `tradeshowId`: The UUID of the tradeshow to delete

**Returns:**
- `error`: Any error that occurred during the operation

## History API

### Get History for Brief

Retrieves the history records for a specific brief.

```typescript
const getBriefHistory = async (briefId: string) => {
  const { data, error } = await supabase
    .from('history')
    .select(`
      *,
      user:changed_by (id, name, email)
    `)
    .eq('brief_id', briefId)
    .order('created_at', { ascending: false });
  
  return { history: data, error };
};
```

**Parameters:**
- `briefId`: The UUID of the brief to get history for

**Returns:**
- `history`: Array of history records with user information
- `error`: Any error that occurred during the operation

## Error Handling

The application uses a consistent error handling pattern across all API calls:

```typescript
try {
  const { data, error } = await someSupabaseOperation();
  
  if (error) {
    // Handle the error
    console.error('Operation failed:', error.message);
    // Optionally show user-friendly error message
    return { error: error.message };
  }
  
  // Process successful response
  return { data };
} catch (err) {
  // Handle unexpected errors
  console.error('Unexpected error:', err);
  return { error: 'An unexpected error occurred' };
}
```

### Common Error Types

1. **Authentication Errors**
   - Invalid credentials
   - Session expired
   - Insufficient permissions

2. **Validation Errors**
   - Missing required fields
   - Invalid data formats
   - Constraint violations

3. **Database Errors**
   - Record not found
   - Duplicate entries
   - Foreign key violations

4. **Network Errors**
   - Connection timeout
   - Server unavailable

## TypeScript Interfaces

The application uses TypeScript interfaces to define the shape of data objects:

### User Interface

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'contributor';
  created_at: string;
  avatar_url?: string;
}
```

### Resource Interface

```typescript
interface Resource {
  id: string;
  name: string;
  type: 'designer' | 'developer' | 'writer' | 'marketer' | 'other';
  created_at: string;
}
```

### Brief Interface

```typescript
interface Brief {
  id: string;
  title: string;
  description?: string;
  channel: string;
  start_date: string;
  due_date: string;
  status: 'draft' | 'in_progress' | 'review' | 'approved' | 'completed';
  priority: 'low' | 'medium' | 'high';
  resource_id?: string;
  approver_id?: string;
  created_by: string;
  created_at: string;
  
  // Joined fields (not in the actual database table)
  resources?: Resource;
  approver?: User;
  creator?: User;
  history?: History[];
}
```

### Tradeshow Interface

```typescript
interface Tradeshow {
  id: string;
  name: string;
  location?: string;
  description?: string;
  start_date: string;
  end_date: string;
  created_at: string;
}
```

### History Interface

```typescript
interface History {
  id: string;
  brief_id: string;
  changed_by: string;
  previous_state: Partial<Brief>;
  new_state: Partial<Brief>;
  created_at: string;
  
  // Joined fields
  user?: User;
}
```

---

This API documentation provides a comprehensive reference for all backend interactions in the Marketing Calendar SaaS application. Developers should refer to this document when working with the application's data layer. 