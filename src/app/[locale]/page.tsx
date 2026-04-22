import { redirect } from '@/lib/i18n/link';

export default async function Page() {
  await redirect('/login');
}
