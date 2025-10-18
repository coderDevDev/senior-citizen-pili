# 🔐 BASCA Approval System - Implementation Guide

## 📋 **OVERVIEW**

This guide provides everything needed to implement the BASCA approval system where OSCA administrators can approve or reject BASCA member accounts.

---

## ✅ **COMPLETED**

### **1. Database Migration** ✓
**File Created:** `DATABASE_MIGRATION_BASCA_APPROVAL.sql`

**What it does:**
- Adds `is_approved` column (Boolean, default FALSE)
- Adds `approved_at` timestamp
- Adds `approved_by` (references users table)
- Adds `rejection_reason` (text field)
- Adds `rejected_at` timestamp
- Creates indexes for performance
- Auto-approves existing OSCA and senior accounts

**To Execute:**
```sql
-- Run the SQL file in your Supabase SQL Editor
-- Or execute via command line:
psql -U your_username -d your_database -f DATABASE_MIGRATION_BASCA_APPROVAL.sql
```

### **2. API Methods** ✓
**File Created:** `lib/api/user-approval.ts`

**Methods Available:**
```typescript
import { UserApprovalAPI } from '@/lib/api/user-approval';

// Approve an account
await UserApprovalAPI.approveBascaAccount(userId, approvedByUserId);

// Reject an account
await UserApprovalAPI.rejectBascaAccount(userId, reason, rejectedByUserId);

// Get pending accounts
await UserApprovalAPI.getPendingAccounts();

// Check if account is approved
await UserApprovalAPI.isAccountApproved(userId);
```

---

## 📝 **UI IMPLEMENTATION NEEDED**

### **Step 1: Update BASCA Members Table Component**

**File to Modify:** Find your BASCA members table component (likely in `components/basca/` or `components/shared-components/`)

**Add Import:**
```typescript
import { UserApprovalAPI } from '@/lib/api/user-approval';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
```

**Add State:**
```typescript
const [isApproving, setIsApproving] = useState(false);
const [selectedMember, setSelectedMember] = useState<any | null>(null);
const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
const [rejectionReason, setRejectionReason] = useState('');
```

**Add Approval Functions:**
```typescript
const handleApprove = async (member: any) => {
  try {
    setIsApproving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    const result = await UserApprovalAPI.approveBascaAccount(
      member.id,
      user.id
    );

    if (result.success) {
      toast.success('BASCA account approved successfully!');
      // Refresh the members list
      loadMembers();
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    console.error('Error approving account:', error);
    toast.error('Failed to approve account');
  } finally {
    setIsApproving(false);
  }
};

const handleReject = async () => {
  if (!selectedMember || !rejectionReason.trim()) {
    toast.error('Please provide a rejection reason');
    return;
  }

  try {
    setIsApproving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    const result = await UserApprovalAPI.rejectBascaAccount(
      selectedMember.id,
      rejectionReason,
      user.id
    );

    if (result.success) {
      toast.success('BASCA account rejected');
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedMember(null);
      // Refresh the members list
      loadMembers();
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    console.error('Error rejecting account:', error);
    toast.error('Failed to reject account');
  } finally {
    setIsApproving(false);
  }
};
```

**Add Approval Status Badge in Table:**
```tsx
{/* Approval Status Badge */}
<div className="flex items-center gap-2">
  {member.is_approved ? (
    <Badge className="bg-green-100 text-green-800 border-green-200">
      <CheckCircle className="w-3 h-3 mr-1" />
      Approved
    </Badge>
  ) : (
    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
      <Clock className="w-3 h-3 mr-1" />
      Pending Approval
    </Badge>
  )}
</div>
```

**Add Action Buttons (for OSCA role only):**
```tsx
{/* Approval Actions - Only for OSCA role */}
{userRole === 'osca' && !member.is_approved && (
  <div className="flex items-center gap-2">
    <Button
      size="sm"
      variant="outline"
      onClick={() => handleApprove(member)}
      disabled={isApproving}
      className="border-green-500 text-green-600 hover:bg-green-50">
      <CheckCircle className="w-4 h-4 mr-1" />
      Approve
    </Button>
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        setSelectedMember(member);
        setIsRejectDialogOpen(true);
      }}
      disabled={isApproving}
      className="border-red-500 text-red-600 hover:bg-red-50">
      <XCircle className="w-4 h-4 mr-1" />
      Reject
    </Button>
  </div>
)}
```

**Add Rejection Dialog:**
```tsx
<AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Reject BASCA Account</AlertDialogTitle>
      <AlertDialogDescription>
        Please provide a reason for rejecting this account.
      </AlertDialogDescription>
    </AlertDialogHeader>
    
    <div className="my-4">
      <Label htmlFor="rejection_reason">Rejection Reason *</Label>
      <Textarea
        id="rejection_reason"
        value={rejectionReason}
        onChange={(e) => setRejectionReason(e.target.value)}
        placeholder="Enter the reason for rejection..."
        className="mt-2 min-h-[100px]"
      />
    </div>

    <AlertDialogFooter>
      <AlertDialogCancel disabled={isApproving}>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleReject}
        disabled={isApproving || !rejectionReason.trim()}
        className="bg-red-600 hover:bg-red-700">
        {isApproving ? 'Rejecting...' : 'Reject Account'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### **Step 2: Add Pending Approvals Filter**

**Add to filters section:**
```tsx
<Select value={approvalFilter} onValueChange={setApprovalFilter}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Approval Status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Status</SelectItem>
    <SelectItem value="approved">Approved</SelectItem>
    <SelectItem value="pending">Pending Approval</SelectItem>
    <SelectItem value="rejected">Rejected</SelectItem>
  </SelectContent>
</Select>
```

**Filter logic:**
```typescript
const filteredMembers = members.filter(member => {
  // ... other filters
  
  if (approvalFilter === 'approved') {
    return member.is_approved === true;
  }
  if (approvalFilter === 'pending') {
    return !member.is_approved;
  }
  if (approvalFilter === 'rejected') {
    return member.rejection_reason && !member.is_approved;
  }
  
  return true;
});
```

---

### **Step 3: Add Pending Approvals Stat Card**

**Add to dashboard stats:**
```tsx
{
  title: 'Pending Approvals',
  value: pendingApprovalsCount,
  icon: Clock,
  color: 'bg-yellow-500',
  textColor: 'text-yellow-600',
  change: 'Awaiting review'
}
```

**Load count:**
```typescript
const loadPendingApprovals = async () => {
  const result = await UserApprovalAPI.getPendingAccounts();
  if (result.success) {
    setPendingApprovalsCount(result.data?.length || 0);
  }
};
```

---

### **Step 4: Prevent Login for Unapproved Accounts**

**Add to login/authentication logic:**
```typescript
// After successful login
const { data: { user } } = await supabase.auth.getUser();

if (user) {
  // Check if BASCA user is approved
  const { data: userData } = await supabase
    .from('users')
    .select('role, is_approved')
    .eq('id', user.id)
    .single();

  if (userData?.role === 'basca' && !userData?.is_approved) {
    await supabase.auth.signOut();
    toast.error('Your account is pending approval. Please contact OSCA.');
    return;
  }

  // Continue with normal login flow
}
```

---

## 🎨 **UI MOCKUP**

### **BASCA Members Table with Approval**
```
┌─────────────────────────────────────────────────────────┐
│ BASCA Members                    [Filters ▼] [+ Add]    │
├─────────────────────────────────────────────────────────┤
│ Name        | Barangay  | Status         | Actions      │
├─────────────────────────────────────────────────────────┤
│ Juan Dela   | Anayan    | ✓ Approved     | [Edit] [Delete] │
│ Cruz        |           |                |               │
├─────────────────────────────────────────────────────────┤
│ Maria       | Pawili    | ⏱ Pending      | [✓ Approve]   │
│ Santos      |           | Approval       | [✗ Reject]    │
├─────────────────────────────────────────────────────────┤
│ Pedro       | Sagurong  | ✓ Approved     | [Edit] [Delete] │
│ Reyes       |           |                |               │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ **TESTING CHECKLIST**

### **Database**
- [ ] Run migration SQL successfully
- [ ] Verify columns exist in users table
- [ ] Check indexes are created
- [ ] Confirm existing accounts auto-approved

### **API**
- [ ] Test approve function
- [ ] Test reject function
- [ ] Test getPendingAccounts
- [ ] Test isAccountApproved

### **UI**
- [ ] Approval badge shows correctly
- [ ] Approve button works (OSCA only)
- [ ] Reject button opens dialog
- [ ] Rejection reason required
- [ ] Table refreshes after approval/rejection
- [ ] Filters work correctly

### **Security**
- [ ] Only OSCA can approve/reject
- [ ] BASCA can't approve themselves
- [ ] Unapproved BASCA can't login
- [ ] Approved BASCA can login normally

---

## 📊 **EXPECTED BEHAVIOR**

### **For BASCA (Pending)**
- ❌ Cannot login
- 📧 Should receive notification when approved/rejected

### **For BASCA (Approved)**
- ✅ Can login normally
- ✅ Full access to BASCA features

### **For OSCA**
- ✅ See pending approvals count
- ✅ Can approve/reject accounts
- ✅ Can see rejection reasons
- ✅ Can filter by approval status

---

## 🚀 **DEPLOYMENT**

### **Step 1: Database**
```bash
# Run migration in Supabase SQL Editor
# Or via CLI
psql -h your-host -U postgres -d your-db -f DATABASE_MIGRATION_BASCA_APPROVAL.sql
```

### **Step 2: Deploy API**
The API file is ready to use immediately.

### **Step 3: Deploy UI**
Update the BASCA members table component with the provided code.

### **Step 4: Test**
Follow the testing checklist above.

---

## 📝 **SUMMARY**

**What's Done:**
- ✅ Database schema
- ✅ API methods
- ✅ Code examples for UI

**What's Needed:**
- 📝 Apply UI code to BASCA members table
- 📝 Run database migration
- 📝 Test functionality

**Estimated Time:** 1-2 hours for UI implementation and testing

---

**Status:** ✅ **API & Database Ready - UI Implementation Pending**
