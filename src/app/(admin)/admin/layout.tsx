import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/modules/auth/current';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getCurrentSession();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <strong>Guest Registration</strong>
        <form action="/admin/logout" method="post">
          <span className="mr-4 text-sm text-neutral-600">{user.username}</span>
          <button className="text-sm underline" type="submit">Sign out</button>
        </form>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
