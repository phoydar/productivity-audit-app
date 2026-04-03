'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';

/**
 * Wraps the app shell — shows sidebar + main layout for authenticated users,
 * and renders children bare (no sidebar) for unauthenticated pages like /sign-in.
 */
export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Sign-in page gets bare layout (no sidebar)
  if (pathname === '/sign-in') {
    return <>{children}</>;
  }

  // Authenticated pages get the sidebar shell
  if (session) {
    return (
      <>
        <Sidebar streak={0} />
        <main className="ml-64 min-h-screen">{children}</main>
      </>
    );
  }

  // Loading / not yet determined — show minimal loading state
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="text-on-surface-variant">Loading...</div>
    </div>
  );
}
