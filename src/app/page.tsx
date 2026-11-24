import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server-api';
export default async function Home() { const { token } = await getSession(); redirect(token ? '/app' : '/login'); }
