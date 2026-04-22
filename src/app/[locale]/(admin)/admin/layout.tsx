import { redirect } from '@/lib/i18n/link';
import { getCurrentSession } from '@/modules/auth/current';
import { Sidebar } from '@/components/admin/sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getCurrentSession();
  if (!user) return redirect('/login');

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar
        user={{ username: user.username, email: user.email, role: user.role }}
      />
      <main className="flex-1 px-6 py-6 lg:px-10 lg:py-8">
        <div className="mx-auto w-full max-w-[1440px]">{children}</div>
      </main>
    </div>
  );
}
