'use client';

import SharedUsersPage from '@/components/shared-components/users/page';

export default function OSCAUsersPage() {
  return (
    <SharedUsersPage
      role="osca"
      primaryColor="#00af8f"
      title="BASCA Accounts"
      description="Manage BASCA member accounts and permissions"
    />
  );
}
