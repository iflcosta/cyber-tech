import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { TestReceiptClient } from './TestReceiptClient';

export const dynamic = 'force-dynamic';

export default async function TestReceiptPage() {
  const { user } = await getAuthedUser();
  if (!user) {
    redirect('/admin/login');
  }

  return <TestReceiptClient />;
}
