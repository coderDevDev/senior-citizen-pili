# Implementation Guide for Remaining Bug Fixes

## Priority 1: Critical UI/UX Fixes

### Fix #5: Apply Barangay List System-Wide
**Files to Update:**
1. `components/seniors/add-senior-modal.tsx` - Use PILI_BARANGAYS for address selector
2. `components/basca/add-basca-member-modal.tsx` - Replace text input with dropdown
3. `components/register-screen.tsx` - Add barangay dropdown for BASCA registration
4. All forms with barangay selection

**Implementation:**
```typescript
import { PILI_BARANGAYS } from '@/lib/constants/barangays';

// In Select component
{PILI_BARANGAYS.map((barangay) => (
  <SelectItem key={barangay} value={barangay}>
    {barangay}
  </SelectItem>
))}
```

### Fix #13 & #14: Update Document & Benefit Types
**Files to Update:**
1. Find all document type dropdowns and replace with:
```typescript
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from '@/lib/constants/documents';
```

2. Find all benefit type dropdowns and replace with:
```typescript
import { BENEFIT_TYPES, BENEFIT_TYPE_LABELS } from '@/lib/constants/benefits';
```

**Search Pattern:**
- Search for: `"osca_id" | "medical_certificate" | "birth_certificate"`
- Search for: `"social_pension" | "health_assistance" | "food_assistance"`

### Fix #18: Apply 12-Hour Time Format
**Files to Update:**
1. All appointment forms
2. Appointment displays/tables
3. Any time picker components

**Implementation:**
```typescript
import { format24To12Hour, format12To24Hour, generateTimeOptions } from '@/lib/utils/timeFormat';

// For display
<span>{format24To12Hour(appointment.appointment_time)}</span>

// For time picker
const timeOptions = generateTimeOptions(30); // 30-minute intervals
```

## Priority 2: Permission & Security Fixes

### Fix #9: Prevent BASCA from Editing OSCA Announcements
**File:** `app/dashboard/basca/announcements/page.tsx` or announcement components

**Implementation:**
```typescript
// In announcement actions
const canEdit = (announcement, userRole, userId) => {
  if (userRole === 'basca') {
    // BASCA can only edit their own announcements
    return announcement.created_by === userId;
  }
  return true; // OSCA can edit all
};
```

### Fix #10: Prevent Seniors from Editing Other Seniors' Appointments
**File:** `app/dashboard/senior/appointments/page.tsx`

**Implementation:**
```typescript
// In appointment edit handler
if (userRole === 'senior' && appointment.senior_citizen_id !== userSeniorId) {
  toast.error('You can only edit your own appointments');
  return;
}
```

### Fix #11: Prevent Seniors from Editing Announcements
**File:** `app/dashboard/senior/announcements/page.tsx`

**Implementation:**
- Remove edit/delete buttons for senior role
- Make announcements read-only

## Priority 3: Form Improvements

### Fix #3: Remove Amount Requested from Pension Form
**Files:**
- Search for pension benefit forms
- Comment out or remove `amount_requested` field
- Keep form submission working

### Fix #12: Senior Benefit Application Cleanup
**File:** `app/dashboard/senior/benefits/page.tsx` or benefit application component

**Changes:**
1. Remove search bar
2. Remove barangay dropdown
3. Auto-fill senior_citizen_id from logged-in user
4. Remove amount_requested field (if not pension specific)

### Fix #16: Add Asterisk to Required Photo Fields
**Files:** All senior registration/edit forms

**Implementation:**
```tsx
<label>Profile Picture <span className="text-red-500">*</span></label>
<label>Valid ID Document <span className="text-red-500">*</span></label>
```

## Priority 4: Data & API Fixes

### Fix #4: BASCA Account Approval System
**Steps:**
1. Add `is_approved` column to users table (if not exists)
2. Create API method:
```typescript
// In lib/api/basca-members.ts or create lib/api/user-approval.ts
static async approveBascaAccount(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_approved: true })
    .eq('id', userId);
  return { success: !error, data, error };
}
```

3. Update BASCA members table to show approval status and actions

### Fix #6: Fix System-Wide Announcements
**File:** `lib/api/announcements.ts` or announcement query logic

**Fix:**
```typescript
// When fetching announcements for seniors
let query = supabase
  .from('announcements')
  .select('*')
  .or(`target_barangay.is.null,target_barangay.eq.${userBarangay}`);
```

### Fix #7: Fix Excel Export in Appointments
**File:** Search for appointment export functions

**Debug:**
1. Check XLSX library usage
2. Verify data transformation
3. Test with console.log before export

### Fix #19: Email Duplicate Validation
**Files:** All registration/account creation forms

**Implementation:**
```typescript
const checkEmailExists = async (email: string) => {
  const { data } = await supabase
    .from('users')
    .select('email')
    .eq('email', email)
    .single();
  return !!data;
};

// In form submission
if (await checkEmailExists(formData.email)) {
  toast.error('This email already exists.');
  return;
}
```

## Priority 5: Dashboard Improvements

### Fix #2: Fix View Details in Documents
**Action:**
1. Find document request review page/modal
2. Check if onClick handler is properly connected
3. Verify data is being passed correctly

### Fix #15: Remove 'New This Month' from OSCA Dashboard
**File:** `app/dashboard/osca/page.tsx` or dashboard stats component

**Action:**
- Remove or comment out the "New This Month" stats card
- Keep the +X indicator in Total Seniors card

## Files to Search and Update

### Search Terms:
1. `"birth_certificate"` - Remove from document types
2. `"barangay_clearance"` - Remove from document types
3. `"health_assistance"` - Remove from benefit types
4. `"food_assistance"` - Remove from benefit types
5. `"transportation"` - Remove from benefit types
6. `"utility_subsidy"` - Remove from benefit types
7. `type="time"` - Update to 12-hour format
8. `target_barangay` - Fix announcement queries
9. `New This Month` - Remove from OSCA dashboard

### Common File Patterns:
- `**/add-*-modal.tsx` - Forms with dropdowns
- `**/benefits/**` - Benefit-related pages
- `**/documents/**` - Document-related pages
- `**/appointments/**` - Appointment pages with time
- `**/announcements/**` - Announcement permission fixes

## Testing Checklist
After implementing all fixes:

- [ ] Senior status dropdown works and updates stats
- [ ] Document types match new list
- [ ] Benefit types match new list
- [ ] Barangays limited to 26 official ones
- [ ] Time displays in 12-hour format
- [ ] BASCA can't edit OSCA announcements
- [ ] Seniors can't edit others' appointments
- [ ] Seniors can't edit announcements
- [ ] System-wide announcements appear for all
- [ ] Email validation prevents duplicates
- [ ] Excel export works in appointments
- [ ] Required photo fields have asterisks
- [ ] BASCA approval system works
- [ ] Benefit forms don't show amount for pension
- [ ] Senior benefit app has no search/barangay fields

## Notes
- Always test after each major change
- Keep backups of original files
- Use git commits for each completed fix
- Test with different user roles (OSCA, BASCA, Senior)
