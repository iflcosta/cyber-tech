import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { TestLabelClient } from './TestLabelClient';

export const dynamic = 'force-dynamic';

export default async function TestLabelPage() {
  const { user } = await getAuthedUser();
  if (!user) {
    redirect('/admin/login');
  }

  return <TestLabelClient />;
}
