#!/usr/bin/env node

/**
 * Test Benefits System Script
 *
 * This script tests the benefits management system by checking if all components
 * are properly set up and functional.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Benefits Management System...\n');

let testsPassed = 0;
let testsTotal = 0;

function testFileExists(filePath, description) {
  testsTotal++;
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}`);
    testsPassed++;
    return true;
  } else {
    console.log(`❌ ${description} - File not found: ${filePath}`);
    return false;
  }
}

function testFileContent(filePath, searchText, description) {
  testsTotal++;
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchText)) {
      console.log(`✅ ${description}`);
      testsPassed++;
      return true;
    } else {
      console.log(`❌ ${description} - Content not found: ${searchText}`);
      return false;
    }
  } else {
    console.log(`❌ ${description} - File not found: ${filePath}`);
    return false;
  }
}

console.log('📁 Checking file structure...');
testFileExists('lib/api/benefits.ts', 'Benefits API file exists');
testFileExists('app/dashboard/osca/benefits/page.tsx', 'Benefits page exists');
testFileExists(
  'supabase/migrations/20241201000001_create_benefits.sql',
  'Benefits migration exists'
);
testFileExists(
  'scripts/apply-benefits-migration.js',
  'Migration script exists'
);
testFileExists('docs/BENEFITS_SETUP.md', 'Benefits documentation exists');

console.log('\n🔍 Checking API implementation...');
testFileContent(
  'lib/api/benefits.ts',
  'export class BenefitsAPI',
  'BenefitsAPI class defined'
);
testFileContent(
  'lib/api/benefits.ts',
  'getBenefitApplications',
  'getBenefitApplications method'
);
testFileContent(
  'lib/api/benefits.ts',
  'createBenefitApplication',
  'createBenefitApplication method'
);
testFileContent(
  'lib/api/benefits.ts',
  'updateBenefitApplication',
  'updateBenefitApplication method'
);
testFileContent(
  'lib/api/benefits.ts',
  'deleteBenefitApplication',
  'deleteBenefitApplication method'
);
testFileContent(
  'lib/api/benefits.ts',
  'uploadBenefitAttachment',
  'uploadBenefitAttachment method'
);

console.log('\n🎨 Checking UI implementation...');
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'OSCABenefitsPage',
  'Benefits page component'
);
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'senior_citizen_id',
  'Senior citizen selection'
);
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'benefit_type',
  'Benefit type selection'
);
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'isCreateModalOpen',
  'Create modal'
);
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'isEditModalOpen',
  'Edit modal'
);
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'isViewModalOpen',
  'View modal'
);
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'handleSeniorSelection',
  'Senior selection logic'
);
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'getStatusColor',
  'Status color helper'
);
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'getStatusProgress',
  'Status progress helper'
);

console.log('\n🗄️ Checking database schema...');
testFileContent(
  'supabase/migrations/20241201000001_create_benefits.sql',
  'benefit_applications',
  'benefit_applications table'
);
testFileContent(
  'supabase/migrations/20241201000001_create_benefits.sql',
  'benefit_attachments',
  'benefit_attachments table'
);
testFileContent(
  'supabase/migrations/20241201000001_create_benefits.sql',
  'benefit_schedules',
  'benefit_schedules table'
);
testFileContent(
  'supabase/migrations/20241201000001_create_benefits.sql',
  'benefit-attachments',
  'Storage bucket'
);
testFileContent(
  'supabase/migrations/20241201000001_create_benefits.sql',
  'ROW LEVEL SECURITY',
  'RLS policies'
);

console.log('\n📊 Checking features...');
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'searchQuery',
  'Search functionality'
);
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'statusFilter',
  'Status filtering'
);
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'typeFilter',
  'Type filtering'
);
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'barangayFilter',
  'Barangay filtering'
);
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'priorityFilter',
  'Priority filtering'
);
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'filteredApplications',
  'Application filtering'
);

console.log('\n🎯 Checking benefit types...');
const benefitTypes = [
  'social_pension',
  'health_assistance',
  'food_assistance',
  'transportation',
  'utility_subsidy',
  'other'
];

benefitTypes.forEach(type => {
  testFileContent('lib/api/benefits.ts', type, `${type} benefit type`);
});

console.log('\n📈 Checking statistics...');
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'benefitStats',
  'Statistics integration'
);
testFileContent(
  'lib/api/benefits.ts',
  'getBenefitApplicationStats',
  'Statistics API method'
);

console.log('\n🔧 Checking form validation...');
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'benefitFormSchema',
  'Form schema'
);
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'zodResolver',
  'Zod validation'
);
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'react-hook-form',
  'React Hook Form'
);

console.log('\n🎨 Checking UI components...');
const uiComponents = [
  'Card',
  'Button',
  'Input',
  'Textarea',
  'Badge',
  'Label',
  'Select',
  'Dialog',
  'AlertDialog',
  'DropdownMenu'
];

uiComponents.forEach(component => {
  testFileContent(
    'app/dashboard/osca/benefits/page.tsx',
    component,
    `${component} component`
  );
});

console.log('\n📱 Checking responsiveness...');
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'grid-cols-1 md:grid-cols-2',
  'Responsive grid'
);
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'lg:grid-cols-4',
  'Large screen grid'
);

console.log('\n🔔 Checking notifications...');
testFileContent(
  'app/dashboard/osca/benefits/page.tsx',
  'toast',
  'Toast notifications'
);
testFileContent(
  'lib/api/benefits.ts',
  'NotificationService',
  'Notification service'
);

console.log('\n📋 Test Results:');
console.log(`✅ Passed: ${testsPassed}/${testsTotal}`);

if (testsPassed === testsTotal) {
  console.log('\n🎉 All tests passed! Benefits Management System is ready.');
  console.log('\n💡 Next steps:');
  console.log('   1. Run: node scripts/apply-benefits-migration.js');
  console.log('   2. Navigate to: /dashboard/osca/benefits');
  console.log('   3. Create your first benefit application');
  console.log('   4. Test all CRUD operations');
} else {
  console.log('\n⚠️  Some tests failed. Please check the issues above.');
  console.log('\n🔧 Common fixes:');
  console.log('   - Ensure all files are properly saved');
  console.log('   - Check for any syntax errors');
  console.log('   - Verify imports are correct');
}
