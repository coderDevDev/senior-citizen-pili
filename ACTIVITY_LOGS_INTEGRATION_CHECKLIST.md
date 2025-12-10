# Activity Logs Integration Checklist

## ✅ Already Integrated

### Benefits API (`lib/api/benefits.ts`)
- ✅ `createBenefitApplication()` - Logs when creating benefit
- ✅ `updateBenefitApplicationStatus()` - Logs when approving/rejecting

## 📋 APIs That Need Logging

### 1. Documents API (`lib/api/documents.ts`)

#### Functions to Add Logging:

**`createDocumentRequest()`**
```typescript
// After creating document
await ActivityLogger.logDocumentActivity(
  'create',
  newDocument.id,
  newDocument.document_type,
  seniorName,
  undefined,
  newDocument
);
```

**`updateDocumentRequestStatus()`**
```typescript
// After updating status
const action = status === 'approved' ? 'approve' : 
               status === 'rejected' ? 'reject' : 
               status === 'completed' ? 'complete' : 'update';

await ActivityLogger.logDocumentActivity(
  action as any,
  id,
  document.document_type,
  seniorName,
  { status: oldStatus },
  { status: newStatus }
);
```

**`deleteDocumentRequest()` - Convert to Soft Delete**
```typescript
// Instead of hard delete
const { data: document } = await supabase
  .from('document_requests')
  .select('*')
  .eq('id', id)
  .single();

const { data: { user } } = await supabase.auth.getUser();

// Soft delete
await supabase
  .from('document_requests')
  .update({
    deleted_at: new Date().toISOString(),
    deleted_by: user?.id,
    delete_reason: reason
  })
  .eq('id', id);

// Log activity
await ActivityLogger.logDocumentActivity(
  'delete',
  id,
  document.document_type,
  seniorName,
  document,
  null
);
```

---

### 2. Appointments API (`lib/api/appointments.ts`)

#### Functions to Add Logging:

**`createAppointment()`**
```typescript
// After creating appointment
await ActivityLogger.logAppointmentActivity(
  'create',
  newAppointment.id,
  newAppointment.appointment_type,
  seniorName,
  newAppointment.appointment_date,
  undefined,
  newAppointment
);
```

**`updateAppointmentStatus()`**
```typescript
// After updating status
const action = status === 'approved' ? 'approve' : 
               status === 'cancelled' ? 'cancel' : 
               status === 'completed' ? 'complete' : 
               status === 'rejected' ? 'reject' : 'update';

await ActivityLogger.logAppointmentActivity(
  action as any,
  id,
  appointment.appointment_type,
  seniorName,
  appointment.appointment_date,
  { status: oldStatus },
  { status: newStatus }
);
```

**`deleteAppointment()` - Convert to Soft Delete**
```typescript
// Soft delete + logging
const { data: appointment } = await supabase
  .from('appointments')
  .select('*')
  .eq('id', id)
  .single();

const { data: { user } } = await supabase.auth.getUser();

await supabase
  .from('appointments')
  .update({
    deleted_at: new Date().toISOString(),
    deleted_by: user?.id,
    delete_reason: reason
  })
  .eq('id', id);

await ActivityLogger.logAppointmentActivity(
  'delete',
  id,
  appointment.appointment_type,
  seniorName,
  appointment.appointment_date,
  appointment,
  null
);
```

---

### 3. Announcements API (`lib/api/announcements.ts`)

#### Functions to Add Logging:

**`createAnnouncement()`**
```typescript
// After creating announcement
await ActivityLogger.logAnnouncementActivity(
  'create',
  newAnnouncement.id,
  newAnnouncement.title,
  undefined,
  newAnnouncement
);
```

**`updateAnnouncement()`**
```typescript
// After updating announcement
await ActivityLogger.logAnnouncementActivity(
  'update',
  id,
  announcement.title,
  oldAnnouncement,
  updatedAnnouncement
);
```

**`deleteAnnouncement()` - Convert to Soft Delete**
```typescript
// Soft delete + logging
const { data: announcement } = await supabase
  .from('announcements')
  .select('*')
  .eq('id', id)
  .single();

const { data: { user } } = await supabase.auth.getUser();

await supabase
  .from('announcements')
  .update({
    deleted_at: new Date().toISOString(),
    deleted_by: user?.id,
    delete_reason: reason
  })
  .eq('id', id);

await ActivityLogger.logAnnouncementActivity(
  'delete',
  id,
  announcement.title,
  announcement,
  null
);
```

**`restoreAnnouncement()` - New Function**
```typescript
// Restore from soft delete
await supabase
  .from('announcements')
  .update({
    deleted_at: null,
    deleted_by: null,
    delete_reason: null
  })
  .eq('id', id);

await ActivityLogger.logAnnouncementActivity(
  'restore',
  id,
  announcement.title,
  null,
  announcement
);
```

---

### 4. Senior Citizens API (if exists)

**`createSeniorCitizen()`**
```typescript
await ActivityLogger.log({
  action: 'create',
  entity_type: 'senior_citizen',
  entity_id: senior.id,
  entity_name: `${senior.first_name} ${senior.last_name}`,
  description: `Registered new senior citizen: ${senior.first_name} ${senior.last_name}`
} as any);
```

**`updateSeniorCitizen()`**
```typescript
await ActivityLogger.log({
  action: 'update',
  entity_type: 'senior_citizen',
  entity_id: id,
  entity_name: `${senior.first_name} ${senior.last_name}`,
  description: `Updated senior citizen profile: ${senior.first_name} ${senior.last_name}`,
  old_values: oldSenior,
  new_values: updatedSenior
} as any);
```

---

## 🎯 Priority Order

### High Priority (Core Features)
1. ✅ **Benefits** - Already done!
2. **Documents** - Most used feature
3. **Appointments** - Important for tracking
4. **Announcements** - Admin actions

### Medium Priority
5. **Senior Citizens** - Registration/updates
6. **Users** - Account management

### Low Priority
7. **Reports** - Export actions
8. **Settings** - Configuration changes

---

## 📝 Integration Template

For any API function, follow this pattern:

```typescript
// 1. Import ActivityLogger
import { ActivityLogger } from '@/lib/services/activity-logger';

// 2. After successful operation
try {
  // Your existing code...
  const result = await supabase.from('table').insert(data);
  
  // Add logging
  await ActivityLogger.log({
    action: 'create', // or 'update', 'delete', etc.
    entity_type: 'benefit', // or 'document', 'appointment', etc.
    entity_id: result.id,
    entity_name: 'Descriptive name',
    description: 'Human-readable description',
    old_values: oldData, // for updates
    new_values: newData  // for creates/updates
  } as any);
} catch (logError) {
  console.error('Failed to log activity:', logError);
  // Don't throw - logging failures shouldn't break the app
}
```

---

## 🔄 Soft Delete Pattern

For all delete operations:

```typescript
async deleteItem(id: string, reason?: string) {
  // 1. Get the item first
  const { data: item } = await supabase
    .from('table_name')
    .select('*')
    .eq('id', id)
    .single();
    
  if (!item) throw new Error('Not found');
  
  // 2. Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // 3. Soft delete (update, not delete)
  await supabase
    .from('table_name')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user?.id,
      delete_reason: reason
    })
    .eq('id', id);
    
  // 4. Log activity
  await ActivityLogger.log({
    action: 'delete',
    entity_type: 'entity_type',
    entity_id: id,
    entity_name: item.name,
    description: `Deleted ${item.name}`,
    old_values: item,
    new_values: null
  } as any);
}
```

---

## 🧪 Testing Checklist

For each API integration:

- [ ] Create operation logs correctly
- [ ] Update operation logs correctly
- [ ] Delete operation soft deletes and logs
- [ ] Status changes log with correct action (approve/reject/complete)
- [ ] Entity names are human-readable (no underscores)
- [ ] Logs appear in Activity Logs page
- [ ] Filters work correctly
- [ ] Role-based access works (OSCA/BASCA/Senior)

---

## 📊 Expected Activity Log Entries

### Benefits
- ✅ "Applied for Social Pension benefit"
- ✅ "Approved Social Pension benefit for John Doe"
- "Rejected Birthday Cash Gift benefit for Jane Smith"
- "Completed Centenarian benefit for Maria Santos"

### Documents
- "Requested OSCA ID document"
- "Approved Birth Certificate document for John Doe"
- "Completed Barangay Clearance document for Jane Smith"
- "Rejected Medical Certificate document for Maria Santos"

### Appointments
- "Scheduled Medical appointment for 2024-12-15"
- "Approved BHW appointment for John Doe"
- "Completed Consultation appointment for Jane Smith"
- "Cancelled Home Visit appointment"

### Announcements
- "Created announcement: Health Program 2024"
- "Updated announcement: Community Meeting"
- "Deleted announcement: Outdated Event"
- "Restored announcement: Important Notice"

---

## 🎉 Benefits of Complete Integration

Once all APIs have logging:
- ✅ Complete audit trail of all system actions
- ✅ Accountability (know who did what)
- ✅ Debugging (track down issues)
- ✅ Analytics (usage patterns)
- ✅ Compliance (data retention)
- ✅ Safety net (restore deleted items)

---

## 🚀 Next Steps

1. Start with **Documents API** (highest priority)
2. Then **Appointments API**
3. Then **Announcements API**
4. Test each one thoroughly
5. Update all queries to exclude soft-deleted items (`.is('deleted_at', null)`)

Good luck! 🎯
