'use server';
import { redirect } from 'next/navigation';
import { revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

export async function refreshSheet() {
  await requireAdmin();
  revalidateTag('sheet-members');
  redirect('/members');
}
