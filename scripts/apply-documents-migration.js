#!/usr/bin/env node

/**
 * Apply Documents Migration Script
 *
 * This script applies the document_requests migration to the Supabase database.
 * Run this script to create the necessary tables for the document request system.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Applying Documents Migration...\n');

try {
  // Check if we're in the right directory
  if (!fs.existsSync('supabase')) {
    console.error(
      '❌ Error: supabase directory not found. Please run this script from the project root.'
    );
    process.exit(1);
  }

  // Check if migration file exists
  const migrationPath = path.join(
    'supabase',
    'migrations',
    '20241201000000_create_document_requests.sql'
  );
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Error: Migration file not found at:', migrationPath);
    process.exit(1);
  }

  console.log('📁 Migration file found:', migrationPath);
  console.log('🔄 Applying migration to Supabase...\n');

  // Apply the migration
  execSync('npx supabase db push', {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('\n✅ Migration applied successfully!');
  console.log('📋 The following tables have been created:');
  console.log('   - document_requests');
  console.log('   - document_attachments');
  console.log('   - Storage bucket: document-attachments');
  console.log('\n🎉 Document request system is now ready to use!');
  console.log('\n💡 Next steps:');
  console.log('   1. Test creating a document request');
  console.log('   2. Test uploading attachments');
  console.log('   3. Test status changes and notifications');
} catch (error) {
  console.error('\n❌ Error applying migration:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log(
    '   1. Make sure Supabase CLI is installed: npm install -g supabase'
  );
  console.log('   2. Make sure you are logged in: npx supabase login');
  console.log('   3. Make sure your project is linked: npx supabase link');
  console.log(
    '   4. Check your .env file has the correct Supabase credentials'
  );
  process.exit(1);
}
