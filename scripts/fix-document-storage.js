#!/usr/bin/env node

/**
 * Fix Document Storage Script
 *
 * This script fixes the storage bucket policies for document attachments.
 * Run this script to resolve the "row-level security policy" error.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Document Storage Policies...\n');

try {
  // Check if we're in the right directory
  if (!fs.existsSync('supabase')) {
    console.error(
      '❌ Error: supabase directory not found. Please run this script from the project root.'
    );
    process.exit(1);
  }

  console.log('📁 Found supabase directory');
  console.log('🔄 Applying storage policy fixes...\n');

  // Apply the storage policy fixes
  execSync('npx supabase db push --file scripts/fix-storage-policies.sql', {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('\n✅ Storage policies fixed successfully!');
  console.log('📋 The following changes have been applied:');
  console.log('   - Simplified storage bucket policies');
  console.log('   - Allow authenticated users to upload/view/delete files');
  console.log('   - Fixed Row Level Security (RLS) issues');
  console.log('\n🎉 Document file uploads should now work!');
  console.log('\n💡 Test the fix by:');
  console.log('   1. Go to the documents page');
  console.log('   2. Create or view a document request');
  console.log('   3. Try uploading a file');
} catch (error) {
  console.error('\n❌ Error fixing storage policies:', error.message);
  console.log('\n🔧 Manual Fix Instructions:');
  console.log('   1. Go to your Supabase Dashboard');
  console.log('   2. Navigate to Storage > Policies');
  console.log('   3. Find the "document-attachments" bucket');
  console.log('   4. Delete existing policies');
  console.log('   5. Create new policies with these settings:');
  console.log('      - INSERT: Allow authenticated users');
  console.log('      - SELECT: Allow authenticated users');
  console.log('      - DELETE: Allow authenticated users');
  console.log('   6. Or run this SQL in the SQL Editor:');
  console.log(
    "      UPDATE storage.buckets SET public = true WHERE id = 'document-attachments';"
  );
  process.exit(1);
}
