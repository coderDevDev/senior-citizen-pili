# Benefits Management System Setup

This document provides comprehensive setup instructions for the Benefits Management system, which allows senior citizens to apply for various benefits including social pensions, health assistance, food assistance, transportation, and utility subsidies.

## 🎯 Features

### Core Functionality

- **Benefit Applications**: Senior citizens can apply for various types of benefits
- **Senior Selection**: Reuse the same senior citizen selection system from documents
- **Status Tracking**: Visual timeline tracking for benefit application progress
- **File Attachments**: Upload supporting documents for benefit applications
- **Scheduling**: Schedule benefit distributions and appointments
- **Notifications**: SMS/Email notifications for status updates

### Benefit Types

- **Social Pension**: Monthly pension benefits for eligible seniors
- **Health Assistance**: Medical and healthcare support
- **Food Assistance**: Food aid and nutrition programs
- **Transportation**: Transportation subsidies and support
- **Utility Subsidy**: Electricity, water, and other utility assistance
- **Other**: Custom benefit types as needed

### Status Workflow

1. **Pending** → Application submitted, awaiting review
2. **Approved** → Application approved, ready for processing
3. **In Progress** → Benefit is being processed
4. **Completed** → Benefit has been distributed
5. **Cancelled** → Application cancelled
6. **Rejected** → Application rejected

## 🗄️ Database Schema

### Tables Created

#### `benefit_applications`

- Stores all benefit applications from senior citizens
- Links to senior citizens and tracks application status
- Includes amount tracking (requested vs approved)
- Supports scheduling and priority levels

#### `benefit_attachments`

- Stores file attachments for benefit applications
- Links to benefit applications and tracks file metadata
- Supports various file types (PDF, images, documents)

#### `benefit_schedules`

- Manages scheduled benefit distributions
- Tracks appointment times and locations
- Supports status updates for scheduled events

### Views for Reporting

- **`benefit_applications_summary`**: Comprehensive view with senior citizen details
- **`monthly_benefit_stats`**: Monthly statistics by benefit type and status
- **`barangay_benefit_distribution`**: Distribution analysis by barangay

## 🚀 Setup Instructions

### 1. Apply Database Migration

#### Option A: Automated Script (Recommended)

```bash
node scripts/apply-benefits-migration.js
```

#### Option B: Manual Migration

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20241201000001_create_benefits.sql`
4. Run the SQL script
5. Verify tables were created successfully

### 2. Verify Setup

Check that the following tables were created:

- `benefit_applications`
- `benefit_attachments`
- `benefit_schedules`

Check that the storage bucket was created:

- `benefit-attachments`

### 3. Test the System

1. Navigate to `/dashboard/osca/benefits`
2. Create a new benefit application
3. Test the senior citizen selection
4. Upload a file attachment
5. Change application status
6. Verify notifications are sent

## 📊 Usage Guide

### Creating Benefit Applications

1. **Select Senior Citizen**: Use the same senior selection system as documents
2. **Choose Benefit Type**: Select from available benefit types
3. **Set Amount**: Specify requested amount (if applicable)
4. **Describe Purpose**: Provide detailed purpose for the benefit
5. **Set Priority**: Choose priority level (low, medium, high, urgent)
6. **Schedule**: Set scheduled date/time for benefit distribution
7. **Add Attachments**: Upload supporting documents

### Managing Applications

#### Status Updates

- **Pending** → **Approved**: Review and approve applications
- **Approved** → **In Progress**: Start processing the benefit
- **In Progress** → **Completed**: Mark as completed when distributed
- **Any Status** → **Cancelled**: Cancel if needed

#### File Management

- Upload supporting documents
- Download and view attachments
- Delete unnecessary files
- Refresh attachment list

### Scheduling Benefits

1. **Set Schedule**: Choose date, time, and location
2. **Add Notes**: Include special instructions
3. **Track Status**: Monitor scheduled distributions
4. **Update Status**: Mark as completed, cancelled, or rescheduled

## 🔧 Configuration

### Benefit Types Configuration

Edit the benefit types in `lib/api/benefits.ts`:

```typescript
export interface BenefitApplication {
  benefit_type:
    | 'social_pension'
    | 'health_assistance'
    | 'food_assistance'
    | 'transportation'
    | 'utility_subsidy'
    | 'other';
  // ... other fields
}
```

### Notification Settings

Configure notifications in `lib/services/notifications.ts`:

```typescript
// SMS and Email notification settings
const notificationConfig = {
  sms: {
    enabled: true,
    provider: 'your_sms_provider'
  },
  email: {
    enabled: true,
    provider: 'your_email_provider'
  }
};
```

### Storage Configuration

The system uses Supabase storage for file attachments:

- Bucket: `benefit-attachments`
- Public access: Enabled
- File types: PDF, DOC, DOCX, JPG, JPEG, PNG

## 📈 Reporting and Analytics

### Available Reports

1. **Monthly Statistics**: Track applications by month and benefit type
2. **Barangay Distribution**: Analyze benefit distribution by location
3. **Amount Tracking**: Monitor requested vs approved amounts
4. **Status Reports**: Track application status progression

### Custom Queries

Use the provided views for custom reporting:

```sql
-- Monthly benefit statistics
SELECT * FROM monthly_benefit_stats
WHERE month >= '2024-01-01';

-- Barangay distribution analysis
SELECT * FROM barangay_benefit_distribution
ORDER BY total_approved DESC;
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Database Tables Not Found

**Error**: `PGRST200` - Tables not found
**Solution**: Run the migration script or apply the SQL manually

#### 2. File Upload Permission Denied

**Error**: Row-level security policy violation
**Solution**: Check storage bucket policies in Supabase dashboard

#### 3. Senior Citizens Not Loading

**Error**: Senior citizen selection not working
**Solution**: Verify the appointments API is working and senior citizens table exists

#### 4. Notifications Not Sending

**Error**: Notification service errors
**Solution**: Check notification configuration and provider settings

### Debug Steps

1. **Check Database**: Verify all tables exist
2. **Check Storage**: Ensure benefit-attachments bucket exists
3. **Check API**: Test API endpoints in browser dev tools
4. **Check Logs**: Review console logs for errors

## 🔐 Security

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **benefit_applications**: Full CRUD access for authenticated users
- **benefit_attachments**: Full CRUD access for authenticated users
- **benefit_schedules**: Full CRUD access for authenticated users

### File Upload Security

- File type validation
- File size limits
- Secure file storage with public URLs
- User authentication required

## 📱 Mobile Responsiveness

The benefits system is fully responsive and works on:

- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes

## 🎨 UI/UX Features

### Visual Elements

- **Progress Tracking**: Visual timeline for application status
- **Status Badges**: Color-coded status indicators
- **File Management**: Drag-and-drop file upload
- **Real-time Updates**: Live data refresh
- **Responsive Design**: Works on all devices

### User Experience

- **Senior Selection**: Same familiar interface as documents
- **Auto-completion**: Smart search and filtering
- **Validation**: Real-time form validation
- **Notifications**: Toast notifications for actions
- **Loading States**: Visual feedback during operations

## 🚀 Future Enhancements

### Planned Features

- **Bulk Operations**: Process multiple applications
- **Advanced Reporting**: More detailed analytics
- **Integration**: Connect with external benefit systems
- **Mobile App**: Native mobile application
- **Automated Workflows**: Rule-based processing

### Customization Options

- **Custom Benefit Types**: Add new benefit categories
- **Workflow Customization**: Modify status progression
- **Notification Templates**: Customize notification messages
- **Report Generation**: Export data in various formats

## 📞 Support

For technical support or questions:

1. Check this documentation first
2. Review the troubleshooting section
3. Check console logs for errors
4. Contact the development team

## 📝 Changelog

### Version 1.0.0 (Initial Release)

- Basic benefit application system
- Senior citizen selection integration
- File attachment support
- Status tracking and notifications
- Database schema and migrations
- Responsive UI/UX design
