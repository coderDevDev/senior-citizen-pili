# Remaining Tasks - Quick Reference

## 🔥 QUICK WINS (< 15 min each)

### 1. Apply Email Validation (3 files)

**File 1: `components/seniors/add-senior-modal.tsx`**
```typescript
// Add import at top
import { validateEmail } from '@/lib/utils/emailValidation';

// In handleSubmit, before creating senior:
const emailValidation = await validateEmail(formData.email);
if (!emailValidation.isValid) {
  toast.error(emailValidation.error);
  return;
}
```

**File 2: `components/basca/add-basca-member-modal.tsx`**
```typescript
// Same as above - add before member creation
```

**File 3: `components/register-screen.tsx`**
```typescript
// Same pattern - validate before user registration
```

---

### 2. Hide Amount for Social Pension (1 file)

**Search for:** Benefit application forms with `amount_requested`

**Add condition:**
```typescript
{formData.benefit_type !== 'social_pension' && (
  <div>
    <Label>Amount Requested</Label>
    <Input
      name="amount_requested"
      type="number"
      value={formData.amount_requested}
      onChange={handleChange}
    />
  </div>
)}
```

---

### 3. Permission Check - BASCA Announcements (1 file)

**File: `app/dashboard/basca/announcements/page.tsx`**

**Find:** Edit/Delete buttons

**Wrap with:**
```typescript
{announcement.created_by === currentUserId && (
  <>
    <Button onClick={() => handleEdit(announcement)}>
      <Edit className="w-4 h-4 mr-2" />
      Edit
    </Button>
    <Button onClick={() => handleDelete(announcement)}>
      <Trash2 className="w-4 h-4 mr-2" />
      Delete
    </Button>
  </>
)}
```

---

### 4. Permission Check - Senior Appointments (1 file)

**File: `app/dashboard/senior/appointments/page.tsx`**

**In handleEdit function, add at top:**
```typescript
const handleEdit = async (appointment) => {
  // Get current senior's ID
  const { data: user } = await supabase.auth.getUser();
  const { data: senior } = await supabase
    .from('senior_citizens')
    .select('id')
    .eq('user_id', user.user?.id)
    .single();
    
  if (appointment.senior_citizen_id !== senior?.id) {
    toast.error('You can only edit your own appointments');
    return;
  }
  
  // Continue with edit...
};
```

---

### 5. Remove Edit for Senior Announcements (1 file)

**File: `app/dashboard/senior/announcements/page.tsx`**

**Find and remove:**
- Edit button
- Delete button
- Any action buttons except "View"

**Keep only:**
```typescript
<Button onClick={() => handleView(announcement)}>
  <Eye className="w-4 h-4 mr-2" />
  View
</Button>
```

---

## ⏱️ MEDIUM TASKS (30 min - 1 hour)

### 6. Apply Barangay Dropdowns

**Files to search:**
```bash
# Find all files with barangay text inputs
grep -r "barangay.*Input" components/
grep -r "Barangay.*input" components/
```

**Replace pattern:**
```typescript
// OLD:
<Input
  label="Barangay"
  value={barangay}
  onChange={(e) => setBarangay(e.target.value)}
/>

// NEW:
import { PILI_BARANGAYS } from '@/lib/constants/barangays';

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

---

### 7. Apply 12-Hour Time Format

**Files to search:**
```bash
grep -r "appointment_time" app/
grep -r 'type="time"' components/
```

**For Display:**
```typescript
import { format24To12Hour } from '@/lib/utils/timeFormat';

// OLD:
<p>{appointment.appointment_time}</p>

// NEW:
<p>{format24To12Hour(appointment.appointment_time)}</p>
```

**For Input:**
```typescript
import { format12To24Hour, generateTimeOptions } from '@/lib/utils/timeFormat';

// OLD:
<input type="time" value={time} onChange={handleChange} />

// NEW:
<Select value={time} onValueChange={(val) => setTime(format12To24Hour(val))}>
  <SelectTrigger>
    <SelectValue placeholder="Select Time" />
  </SelectTrigger>
  <SelectContent>
    {generateTimeOptions(30).map((timeOption) => (
      <SelectItem key={timeOption} value={timeOption}>
        {timeOption}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

### 8. Clean Up Senior Benefit Application

**File: `app/dashboard/senior/benefits/page.tsx`**

**Remove:**
1. Search bar component
2. Barangay dropdown filter
3. Any filters that don't apply to individual seniors

**Auto-fill senior_citizen_id:**
```typescript
const [currentSeniorId, setCurrentSeniorId] = useState('');

useEffect(() => {
  const fetchSeniorId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: senior } = await supabase
      .from('senior_citizens')
      .select('id')
      .eq('user_id', user?.id)
      .single();
    setCurrentSeniorId(senior?.id || '');
  };
  fetchSeniorId();
}, []);

// In form submission:
const formData = {
  ...otherFields,
  senior_citizen_id: currentSeniorId // Auto-filled
};
```

---

## 🔍 DEBUG TASKS (1-2 hours)

### 9. Fix Excel Export in Appointments

**File to check:** Search for `XLSX` or `exportToExcel` in appointments pages

**Debug steps:**
1. Check if XLSX library is imported correctly
2. Test data transformation before export
3. Add console.log to see data structure
4. Verify file download triggers

**Common fix:**
```typescript
import * as XLSX from 'xlsx';

const exportToExcel = () => {
  try {
    const data = appointments.map(apt => ({
      'Senior Name': apt.senior_name,
      'Date': apt.appointment_date,
      'Time': format24To12Hour(apt.appointment_time), // Use new format
      'Type': apt.appointment_type,
      'Status': apt.status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Appointments');
    XLSX.writeFile(wb, `appointments-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel file exported successfully');
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Failed to export Excel file');
  }
};
```

---

### 10. Fix Document View Details

**Files to check:**
- `app/dashboard/*/documents/page.tsx`
- Document modal components

**Debug steps:**
1. Check if modal state is properly managed
2. Verify data is passed to modal
3. Check onClick handler connection
4. Test with console.log

**Pattern to look for:**
```typescript
const handleViewDocument = (document: DocumentRequest) => {
  console.log('Viewing document:', document); // Add this
  setSelectedDocument(document);
  setIsViewModalOpen(true);
};

// In table/list:
<Button onClick={() => handleViewDocument(doc)}>
  View Details
</Button>

// Modal:
{isViewModalOpen && selectedDocument && (
  <ViewDocumentModal
    document={selectedDocument}
    isOpen={isViewModalOpen}
    onClose={() => setIsViewModalOpen(false)}
  />
)}
```

---

## 🏗️ COMPLEX TASK (2-4 hours)

### 11. BASCA Approval System

**Step 1: Database Migration**
```sql
-- Add columns to users table
ALTER TABLE users 
ADD COLUMN is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approved_by UUID REFERENCES users(id),
ADD COLUMN rejection_reason TEXT,
ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE;

-- Add index
CREATE INDEX idx_users_is_approved ON users(is_approved);
```

**Step 2: Create API File**
```typescript
// lib/api/user-approval.ts
import { supabase } from '@/lib/supabase';

export class UserApprovalAPI {
  static async approveBascaAccount(userId: string, approvedByUserId: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_approved: true, 
        approved_at: new Date().toISOString(),
        approved_by: approvedByUserId
      })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) throw error;
    return { success: true, data };
  }
  
  static async rejectBascaAccount(
    userId: string, 
    reason: string,
    rejectedByUserId: string
  ) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_approved: false, 
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
        approved_by: rejectedByUserId
      })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) throw error;
    return { success: true, data };
  }
}
```

**Step 3: Update BASCA Members Table**
```typescript
// In components/basca/basca-members-table.tsx

// Add approval status badge
{member.is_approved ? (
  <Badge className="bg-green-100 text-green-800">Approved</Badge>
) : (
  <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>
)}

// Add actions in dropdown menu
{!member.is_approved && userRole === 'osca' && (
  <>
    <DropdownMenuItem onClick={() => handleApprove(member)}>
      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
      Approve Account
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleReject(member)}>
      <XCircle className="w-4 h-4 mr-2 text-red-600" />
      Reject Account
    </DropdownMenuItem>
  </>
)}
```

---

## ✅ Testing Checklist

After implementing each fix:

- [ ] Test with OSCA role
- [ ] Test with BASCA role  
- [ ] Test with Senior role
- [ ] Test form submissions
- [ ] Test data displays
- [ ] Check console for errors
- [ ] Verify existing features still work

---

## 📦 Quick Commands

```bash
# Search for specific patterns
grep -r "type=\"time\"" app/
grep -r "target_barangay" lib/
grep -r "amount_requested" components/
grep -r "barangay.*Input" components/

# Build check
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

---

**Use this guide as a checklist. Complete each task, test, and mark as done!**
