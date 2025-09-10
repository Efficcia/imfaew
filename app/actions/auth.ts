'use server';

import { redirect } from 'next/navigation';
import { setAuthCookie, clearAuthCookie } from '@/lib/auth';

export async function login(formData: FormData) {
  const password = formData.get('password') as string;
  
  if (password === process.env.ADMIN_PASSWORD) {
    await setAuthCookie();
    redirect('/');
  } else {
    throw new Error('Senha incorreta');
  }
}

export async function logout() {
  await clearAuthCookie();
  redirect('/login');
}