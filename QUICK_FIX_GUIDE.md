# Quick Fix Guide - Step by Step

## ✅ Already Done
1. ✓ Senior status dropdown with API
2. ✓ Document types updated (constants created)
3. ✓ Benefit types updated (constants created)
4. ✓ Time format utilities created
5. ✓ Barangay constants created
6. ✓ Column renamed to "Senior Status"

---

## 🔥 Priority Fixes (Do These First)

### Fix #6: System-Wide Announcements
**Problem:** Announcements not showing to all seniors when system-wide

**Solution:**
```typescript
// In announcement fetch queries (search for announcement queries)
// Change from:
.eq('target_barangay', userBarangay)

// To:
.or(`target_barangay.is.null,target_barangay.eq.${userBarangay}`)
```

**Files to check:**
- `lib/api/announcements.ts`
- `app/dashboard/senior/announcements/page.tsx`
- Any component fetching announcements

---

### Fix #19: Email Duplicate Validation
**Add to all registration forms**

```typescript
// Add this function
const checkEmailExists = async (email: string): Promise<boolean> => {
  const { data } = await supabase
    .from('users')
    .select('email')
    .eq('email', email)
    .maybeSingle();
  return !!data;
};

// In form submission (before creating user)
if (await checkEmailExists(formData.email)) {
  toast.error('This email already exists.');
  return;
}
```

**Files to update:**
- `components/register-screen.tsx`
- `components/seniors/add-senior-modal.tsx`
- `components/basca/add-basca-member-modal.tsx`

---

### Fix #5 & #8: Barangay Dropdowns
**Replace all barangay text inputs with dropdowns**

```tsx
import { PILI_BARANGAYS } from '@/lib/constants/barangays';

// Replace Input with Select:
<Select value={barangay} onValueChange={setBarangay}>
  <SelectTrigger>
    <SelectValue placeholder="Select Barangay" />
  </SelectTrigger>
  <SelectContent>
    {PILI_BARANGAYS.map((brgy) => (
      <SelectItem key={brgy} value={brgy}>
        {brgy}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Files to update:**
- Search for: `barangay` + `Input` or `TextField`
- Update in all registration forms

---

## 🛡️ Permission Fixes

### Fix #9: BASCA Can't Edit OSCA Announcements

```typescript
// In BASCA announcement page/component
const canEditAnnouncement = (announcement: Announcement, currentUserId: string) => {
  // BASCA can only edit their own announcements
  return announcement.created_by === currentUserId;
};

// In render:
{canEditAnnouncement(announcement, userId) && (
  <Button onClick={() => handleEdit(announcement)}>Edit</Button>
)}
```

**File:** `app/dashboard/basca/announcements/page.tsx`

---

### Fix #10: Seniors Can't Edit Others' Appointments

```typescript
// In senior appointment edit handler
const handleEditAppointment = (appointment) => {
  if (userRole === 'senior' && appointment.senior_citizen_id !== currentSeniorId) {
    toast.error('You can only edit your own appointments');
    return;
  }
  // Continue with edit...
};
```

**File:** `app/dashboard/senior/appointments/page.tsx`

---

### Fix #11: Seniors Can't Edit Announcements

```tsx
// In senior announcements page
// Simply remove edit/delete buttons for role='senior'
{role !== 'senior' && (
  <>
    <Button onClick={onEdit}>Edit</Button>
    <Button onClick={onDelete}>Delete</Button>
  </>
)}
```

**File:** `app/dashboard/senior/announcements/page.tsx`

---

## 📝 Form Improvements

### Fix #3: Remove Amount from Pension Benefits

```typescript
// In benefit form, conditionally hide amount field
{benefitType !== 'social_pension' && (
  <Input
    label="Amount Requested"
    name="amount_requested"
    type="number"
  />
)}
```

**Files:** Search for benefit forms with `amount_requested`

---

### Fix #12: Senior Benefit Application Cleanup

```tsx
// In senior benefits page, remove these:
// 1. Search bar - delete it
// 2. Barangay dropdown - delete it
// 3. Auto-fill senior_citizen_id from session

// Add at top:
const [currentSeniorId, setCurrentSeniorId] = useState('');

useEffect(() => {
  const fetchSeniorId = async () => {
    const { data: user } = await supabase.auth.getUser();
    const { data: senior } = await supabase
      .from('senior_citizens')
      .select('id')
      .eq('user_id', user.user?.id)
      .single();
    setCurrentSeniorId(senior?.id || '');
  };
  fetchSeniorId();
}, []);

// In form data:
const formData = {
  ...otherFields,
  senior_citizen_id: currentSeniorId // Auto-filled
};
```

**File:** `app/dashboard/senior/benefits/page.tsx`

---

### Fix #16: Asterisks for Required Fields

```tsx
// Find photo upload labels and add:
<label>
  Profile Picture <span className="text-red-500">*</span>
</label>

<label>
  Valid ID Document <span className="text-red-500">*</span>
</label>
```

**Files:** All senior registration/edit forms

---

## ⏰ Time Format Fixes

### Fix #18: Apply 12-Hour Time Format

```tsx
import { format24To12Hour, format12To24Hour, generateTimeOptions } from '@/lib/utils/timeFormat';

// For display:
<p>Time: {format24To12Hour(appointment.appointment_time)}</p>

// For time picker:
<Select value={time} onValueChange={setTime}>
  <SelectTrigger>
    <SelectValue placeholder="Select Time" />
  </SelectTrigger>
  <SelectContent>
    {generateTimeOptions(30).map((timeOption) => (
      <SelectItem key={timeOption} value={format12To24Hour(timeOption)}>
        {timeOption}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// When saving, use format12To24Hour() if user inputs 12hr format
```

**Files to update:**
- All appointment forms
- Appointment displays/tables
- Search for: `type="time"` or `appointment_time`

---

## 🎨 Dashboard Fixes

### Fix #15: Remove "New This Month" from OSCA Dashboard

```tsx
// In OSCA dashboard stats array, remove or comment out:
// {
//   title: 'New This Month',
//   value: newThisMonth.toLocaleString(),
//   ...
// }

// Keep the indicator in Total Seniors card if desired
```

**File:** `app/dashboard/osca/page.tsx` or dashboard stats component

---

### Fix #2: Fix View Details in Documents

```tsx
// Find the document view handler
// Make sure it's properly connected:

const handleViewDocument = (document: DocumentRequest) => {
  setSelectedDocument(document);
  setIsViewModalOpen(true);
};

// In table:
<Button onClick={() => handleViewDocument(doc)}>
  View Details
</Button>
```

**Files:** Document pages and modals

---

## 🔐 BASCA Approval System

### Fix #4: Add BASCA Account Approval

**Step 1: Create API method**
```typescript
// In lib/api/basca-members.ts or create lib/api/user-approval.ts

export class UserApprovalAPI {
  static async approveBascaAccount(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ is_approved: true, approved_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) throw error;
    return { success: true, data };
  }
  
  static async rejectBascaAccount(userId: string, reason?: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_approved: false, 
        rejection_reason: reason,
        rejected_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) throw error;
    return { success: true, data };
  }
}
```

**Step 2: Update BASCA members table**
```tsx
// In actions dropdown:
{!member.is_approved && (
  <>
    <DropdownMenuItem onClick={() => handleApprove(member)}>
      <CheckCircle className="w-4 h-4 mr-2" />
      Approve Account
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleReject(member)}>
      <XCircle className="w-4 h-4 mr-2" />
      Reject Account
    </DropdownMenuItem>
  </>
)}
```

**Step 3: Add approval status badge**
```tsx
{member.is_approved ? (
  <Badge className="bg-green-100 text-green-800">Approved</Badge>
) : (
  <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>
)}
```

---

## 🧪 Testing Checklist

After implementing each fix:

- [ ] Test with OSCA role
- [ ] Test with BASCA role
- [ ] Test with Senior role
- [ ] Test on different barangays
- [ ] Test form submissions
- [ ] Test data displays
- [ ] Test permissions
- [ ] Check console for errors
- [ ] Verify existing features still work

---

## 📦 Quick Commands

```bash
# Search for files that need updates
grep -r "type=\"time\"" app/
grep -r "target_barangay" lib/
grep -r "barangay.*Input" components/
grep -r "New This Month" app/dashboard/osca/

# Run linter
npm run lint

# Build to check for errors
npm run build
```

---

## ⚠️ Important Notes

1. **Always test after each fix**
2. **Keep database schema in mind**
3. **Check RLS policies if data access issues**
4. **Use toast notifications for user feedback**
5. **Validate all form inputs**
6. **Handle loading and error states**

---

**This guide provides the exact code needed for each remaining fix. Implement them one by one, test, and mark complete.**
