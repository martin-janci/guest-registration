import { getCurrentSession } from '@/modules/auth/current';

export default async function DashboardPage() {
  const { user } = await getCurrentSession();
  return (
    <section>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-4 text-neutral-600">Welcome, {user?.username}.</p>
    </section>
  );
}
