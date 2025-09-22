#!/usr/bin/env node

/**
 * Apply Benefits Migration Script
 *
 * This script applies the benefits database migration to create all necessary tables
 * for the benefits management system.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Applying Benefits Database Migration...\n');

try {
  // Check if we're in the right directory
  if (!fs.existsSync('supabase')) {
    console.error(
      '❌ Error: supabase directory not found. Please run this script from the project root.'
    );
    process.exit(1);
  }

  console.log('📁 Found supabase directory');
  console.log('🔄 Applying benefits migration...\n');

  // Apply the migration
  execSync(
    'npx supabase db push --file supabase/migrations/20241201000001_create_benefits.sql',
    {
      stdio: 'inherit',
      cwd: process.cwd()
    }
  );

  console.log('\n✅ Benefits migration applied successfully!');
  console.log('📋 The following tables have been created:');
  console.log('   - benefit_applications');
  console.log('   - benefit_attachments');
  console.log('   - benefit_schedules');
  console.log('   - Storage bucket: benefit-attachments');
  console.log('   - RLS policies for all tables');
  console.log('   - Indexes for better performance');
  console.log('   - Views for reporting');
  console.log('\n🎉 Benefits management system is now ready!');
  console.log('\n💡 Next steps:');
  console.log('   1. Go to the benefits page');
  console.log('   2. Create your first benefit application');
  console.log('   3. Test the CRUD operations');
} catch (error) {
  console.error('\n❌ Error applying benefits migration:', error.message);
  console.log('\n🔧 Manual Setup Instructions:');
  console.log('   1. Go to your Supabase Dashboard');
  console.log('   2. Navigate to SQL Editor');
  console.log(
    '   3. Copy and paste the contents of supabase/migrations/20241201000001_create_benefits.sql'
  );
  console.log('   4. Run the SQL script');
  console.log('   5. Verify the tables were created successfully');
  process.exit(1);
}
