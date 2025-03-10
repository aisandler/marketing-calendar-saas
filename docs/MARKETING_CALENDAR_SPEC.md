# Marketing Calendar Technical Specification

## Overview
This document outlines the technical specifications for the Marketing Calendar project pivot, focusing on brief-centric organization with optional campaign associations and brand management.

## Background
The original implementation assumed campaigns as the primary organizational unit. Based on actual client needs, we're pivoting to a brief-centric model where briefs (creative development requirements) are the primary entities that can optionally be associated with campaigns and must be associated with brands.

## Core Entities

### Brands
Represents different brands within the client's portfolio.

```sql
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,  -- Short code for visual display (e.g., "DD")
    color TEXT NOT NULL, -- Hex color code for visualization
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Media Types
Predefined set of media types for briefs.

```sql
CREATE TYPE media_type AS ENUM (
    'PRINT_MEDIA',
    'DIGITAL_MEDIA',
    'SOCIAL_MEDIA',
    'EMAIL_MARKETING',
    'TRADESHOW',
    'EVENT',
    'OTHER'
);
```

### Briefs
Primary entity representing creative development requirements.

```sql
ALTER TABLE briefs 
    ADD COLUMN brand_id UUID REFERENCES brands(id),
    ADD COLUMN media_type media_type NOT NULL;
```

Note: Existing campaign_id remains as an optional field.

## User Interface Components

### 1. Calendar View
Primary interface for viewing and managing briefs.

#### Visual Indicators
- **Brand**: Primary color of the brief card
- **Media Type**: Icon or shape representing the type
- **Campaign Association**: Dashed border for briefs associated with campaigns
- **Label Format**: "{BrandCode}: {BriefTitle}"

#### Filtering Options
- By Brand
- By Media Type
- By Campaign (optional)
- By Date Range
- By Status

#### Grouping Options
- By Brand
- By Media Type
- By Campaign
- By Week/Month

### 2. Brand Management Interface
Admin interface for managing brands.

#### Features
- List view of existing brands
- Add new brands
- Edit existing brands
- Set brand colors and codes
- (Optional) Activate/deactivate brands

### 3. Brief Creation/Edit Form
Form for creating and editing briefs.

#### Required Fields
- Title
- Description
- Brand (dropdown)
- Media Type (dropdown)
- Start Date
- End Date
- Campaign (optional dropdown)
- Status

## Workflow

### Brief Status Flow
All briefs follow the same status flow:
1. Draft
2. In Review
3. Approved
4. In Progress
5. Completed

### Approval Workflow
Single approval workflow for all brief types (may be expanded in future).

## Technical Implementation Details

### Database Changes
1. Create brands table
2. Add media_type enum
3. Add brand_id and media_type to briefs table
4. Ensure proper indexing on brand_id and media_type columns

### API Endpoints

#### Brands
```
GET    /api/brands
POST   /api/brands
GET    /api/brands/:id
PUT    /api/brands/:id
DELETE /api/brands/:id
```

#### Briefs
```
GET    /api/briefs
POST   /api/briefs
GET    /api/briefs/:id
PUT    /api/briefs/:id
DELETE /api/briefs/:id
GET    /api/briefs/calendar  # Calendar view specific endpoint
```

### Performance Considerations
1. Index on brand_id and media_type for efficient filtering
2. Implement pagination for calendar view
3. Cache brand data for frequent access
4. Optimize calendar view queries with proper joins

## Migration Plan

### Phase 1: Data Model Updates
1. Create brands table
2. Add media_type enum
3. Update briefs table schema
4. Create necessary indexes

### Phase 2: Admin Interface
1. Implement brand management UI
2. Add brand CRUD operations
3. Implement media type management

### Phase 3: Brief Management Updates
1. Update brief creation/edit forms
2. Implement brand and media type selection
3. Update validation rules

### Phase 4: Calendar View Enhancement
1. Update visual representation
2. Implement new filtering options
3. Add grouping functionality
4. Enhance performance optimizations

## Future Considerations

### Potential Enhancements
1. Different approval workflows by brand/media type
2. Custom brief templates by media type
3. Advanced campaign management
4. Enhanced reporting and analytics
5. Integration with other marketing tools

### Technical Debt
1. Monitor performance of calendar view with large datasets
2. Consider implementing caching layer if needed
3. Plan for potential need to archive old briefs

## Testing Requirements

### Unit Tests
1. Brand CRUD operations
2. Brief creation with brand association
3. Calendar view filtering and grouping
4. Status workflow transitions

### Integration Tests
1. End-to-end brief creation flow
2. Calendar view data loading
3. Brand management operations
4. Filter and group operations

### Performance Tests
1. Calendar view with large datasets
2. Multiple simultaneous users
3. Filter and group operation response times

## Documentation Requirements

1. Update API documentation
2. Update user guides
3. Create admin documentation
4. Document migration procedures

## Security Considerations

1. Brand management restricted to admin users
2. Proper validation of brand-brief associations
3. Audit logging for brand changes
4. Input sanitization for brand codes and colors 