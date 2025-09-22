# Document Request System Setup Guide

This guide will help you set up the Document Request System for the OSCA application.

## 🚀 Quick Setup

### 1. Apply Database Migration

Run the migration script to create the necessary database tables:

```bash
node scripts/apply-documents-migration.js
```

Or manually apply the migration:

```bash
npx supabase db push
```

### 2. Verify Tables Created

After running the migration, the following tables should be created:

- `document_requests` - Main table for document requests
- `document_attachments` - Table for file attachments
- `document-attachments` - Storage bucket for files

### 3. Test the System

1. Navigate to `/dashboard/osca/documents` in your application
2. Try creating a new document request
3. Test the status workflow
4. Test file uploads

## 📋 System Features

### ✅ Implemented Features

- **Complete CRUD Operations**: Create, Read, Update, Delete document requests
- **Senior Citizen Selection**: Auto-barangay selection matching appointments page
- **Status Workflow**: Complete document processing workflow
- **File Upload/Download**: Document attachments with secure storage
- **Real-time Notifications**: SMS/Email alerts for status changes
- **Advanced Filtering**: Filter by status, type, barangay, priority
- **Statistics Dashboard**: Real-time stats and analytics
- **Responsive UI**: Mobile-friendly design

### 🔄 Status Workflow

```
Pending → Approved → In Progress → Completed/Ready for Pickup
   ↓         ↓           ↓              ↓
Cancel    Cancel     Cancel/Ready    Mark as Picked Up
```

### 📁 Supported File Types

- PDF documents
- Microsoft Word (.doc, .docx)
- Images (.jpg, .jpeg, .png)

### 🔔 Notification System

The system supports both SMS and email notifications:

#### SMS Notifications

- Configure via environment variables:
  - `SMS_API_KEY`
  - `SMS_SENDER_ID`
  - `NEXT_PUBLIC_SMS_ENABLED=true`

#### Email Notifications

- Configure via environment variables:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USERNAME`
  - `SMTP_PASSWORD`
  - `NEXT_PUBLIC_EMAIL_ENABLED=true`

## 🛠️ Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# SMS Configuration (Optional)
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=OSCA_PILI
NEXT_PUBLIC_SMS_ENABLED=false

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
NEXT_PUBLIC_EMAIL_ENABLED=false
```

### Database Schema

The system creates the following database structure:

```sql
-- Document Requests Table
CREATE TABLE document_requests (
  id UUID PRIMARY KEY,
  senior_citizen_id UUID REFERENCES senior_citizens(id),
  document_type VARCHAR(50),
  purpose TEXT,
  notes TEXT,
  priority_level VARCHAR(20),
  status VARCHAR(30),
  required_by_date DATE,
  requirements TEXT[],
  follow_up_required BOOLEAN,
  assigned_staff UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Document Attachments Table
CREATE TABLE document_attachments (
  id UUID PRIMARY KEY,
  document_request_id UUID REFERENCES document_requests(id),
  file_name VARCHAR(255),
  file_url TEXT,
  file_type VARCHAR(100),
  file_size BIGINT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP
);
```

## 🎯 Usage Guide

### Creating Document Requests

1. Navigate to the Documents page
2. Click "New Document Request"
3. Select a senior citizen (auto-selects their barangay)
4. Choose document type and priority
5. Add purpose and notes
6. Set required date (optional)
7. Submit the request

### Managing Status

1. View document requests in the table
2. Use the status dropdown to change status
3. Available status changes depend on current status
4. System automatically sends notifications

### File Attachments

1. Open a document request
2. Click "Upload Document" in the attachments section
3. Select files (PDF, DOC, DOCX, JPG, PNG)
4. Files are securely stored and accessible
5. Download or delete attachments as needed

## 🔧 Troubleshooting

### Common Issues

#### Tables Don't Exist Error

```
Error: Could not find a relationship between 'document_requests' and 'attachments'
```

**Solution**: Run the migration script:

```bash
node scripts/apply-documents-migration.js
```

#### Permission Errors

```
Error: User not authenticated
```

**Solution**: Make sure you're logged in and have proper permissions.

#### File Upload Errors

##### Row Level Security Policy Error

```
Error: new row violates row-level security policy
```

**Solution**: Apply the storage policy fix:

**Option 1 - Quick Fix (Recommended):**

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run this command:

```sql
UPDATE storage.buckets SET public = true WHERE id = 'document-attachments';
```

**Option 2 - Manual Fix:**

1. Go to Supabase Dashboard > Storage > Policies
2. Find the "document-attachments" bucket
3. Delete all existing policies
4. Create new policies allowing authenticated users

**Option 3 - Script Fix:**

```bash
node scripts/fix-document-storage.js
```

##### General File Upload Errors

```
Error: Failed to upload file
```

**Solution**: Check storage bucket permissions and file size limits.

### Migration Issues

If the migration fails:

1. Check Supabase connection:

   ```bash
   npx supabase status
   ```

2. Verify project linking:

   ```bash
   npx supabase projects list
   ```

3. Re-link project if needed:
   ```bash
   npx supabase link --project-ref your-project-ref
   ```

## 📞 Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify database tables exist
3. Check environment variables
4. Review the migration logs

## 🎉 Success!

Once setup is complete, you'll have a fully functional document request system that:

- ✅ Integrates seamlessly with the existing OSCA application
- ✅ Provides a complete workflow from request to completion
- ✅ Includes file management and notifications
- ✅ Matches the UI/UX of the appointments system
- ✅ Is production-ready with proper security and error handling

The system is now ready to handle real document requests for senior citizens! 🚀
