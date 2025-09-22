# Benefits Management System Setup

## Overview

The Benefits Management System allows senior citizens to apply for various benefits including social pension, health assistance, food assistance, transportation, utility subsidies, and other benefits.

## Features

### Core Functionality

- **Benefit Applications**: Senior citizens can apply for available benefits
- **Benefit Scheduling**: Schedule benefit distribution appointments
- **Status Tracking**: Track application progress with visual timeline
- **File Attachments**: Upload supporting documents
- **Notifications**: SMS/Email notifications for status updates
- **Reports**: Generate reports for monitoring services and benefits

### Benefit Types

1. **Social Pension** - Monthly pension for senior citizens
2. **Health Assistance** - Medical and healthcare support
3. **Food Assistance** - Food aid and nutrition support
4. **Transportation** - Transport assistance and subsidies
5. **Utility Subsidy** - Electricity, water, and other utility support
6. **Other** - Miscellaneous benefits and assistance

### Application Status Flow

```
Pending → Approved → In Progress → Completed
   ↓         ↓           ↓
Cancelled  Rejected   Rescheduled
```

## Database Schema

### Tables Created

- `benefit_applications` - Main benefit application records
- `benefit_attachments` - File attachments for applications
- `benefit_schedules` - Scheduled benefit distributions
- `benefit-attachments` - Storage bucket for files

### Key Fields

- Senior citizen information (linked to existing users)
- Benefit type and amount requested/approved
- Application status and priority level
- Scheduling information (date, time, location)
- Supporting documents and notes

## Setup Instructions

### 1. Apply Database Migration

```bash
node scripts/apply-benefits-migration.js
```

### 2. Verify Tables

- Check Supabase Dashboard → Table Editor
- Verify all tables are created with proper relationships
- Test RLS policies are working

### 3. Create Benefits Page

- Copy structure from documents page
- Adapt for benefit-specific fields
- Implement senior citizen selection
- Add benefit scheduling features

### 4. Test CRUD Operations

- Create benefit applications
- Update application status
- Upload/download attachments
- Schedule benefit distributions

## API Endpoints

### BenefitsAPI Methods

- `getBenefitApplications(filters)` - Get applications with filtering
- `getBenefitApplicationById(id)` - Get single application
- `createBenefitApplication(data)` - Create new application
- `updateBenefitApplication(id, data)` - Update application
- `updateBenefitApplicationStatus(id, status)` - Change status
- `deleteBenefitApplication(id)` - Delete application
- `getBenefitApplicationStats()` - Get statistics
- `uploadBenefitAttachment(id, file)` - Upload files
- `deleteBenefitAttachment(id)` - Delete files
- `getBenefitSchedules()` - Get schedules
- `createBenefitSchedule(data)` - Create schedule
- `updateBenefitSchedule(id, data)` - Update schedule
- `deleteBenefitSchedule(id)` - Delete schedule

## UI Components

### Main Page Features

- Statistics dashboard (total, pending, approved, completed)
- Filter system (status, type, barangay, priority, date range)
- Application list with status tracking
- Create/Edit/View/Delete modals
- File upload/download functionality
- Status change workflow with notifications

### Senior Citizen Selection

- Reuse existing senior citizen selection from documents
- Filter by barangay
- Search by name
- Auto-populate senior information

### Status Tracking

- Visual timeline similar to documents
- Progress indicators
- Status change options
- Notification system

## Integration Points

### Existing Systems

- **Senior Citizens**: Links to existing senior citizen records
- **Users**: Authentication and user management
- **Notifications**: SMS/Email notification system
- **Storage**: File upload/download system

### New Features

- **Benefit Scheduling**: Calendar-based scheduling system
- **Amount Tracking**: Financial tracking for benefits
- **Priority Management**: Urgent benefit handling
- **Reporting**: Analytics and monitoring reports

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] All tables created with proper relationships
- [ ] RLS policies working correctly
- [ ] Storage bucket created and accessible
- [ ] API endpoints responding correctly
- [ ] Senior citizen selection working
- [ ] CRUD operations functional
- [ ] File upload/download working
- [ ] Status tracking displaying correctly
- [ ] Notifications sending properly
- [ ] Scheduling system operational
- [ ] Reports generating correctly

## Troubleshooting

### Common Issues

1. **Migration Errors**: Check Supabase connection and permissions
2. **RLS Policy Issues**: Verify policies allow authenticated users
3. **Storage Issues**: Check bucket permissions and policies
4. **API Errors**: Verify table relationships and data types
5. **UI Issues**: Check component imports and state management

### Support

- Check Supabase Dashboard for database issues
- Review browser console for frontend errors
- Verify API responses in Network tab
- Test with sample data first
