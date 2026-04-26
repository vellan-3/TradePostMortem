'use client';

import LoadingScreen from '@/components/LoadingScreen';
import { useParams } from 'next/navigation';

export default function Loading() {
  const params = useParams();
  const wallet = typeof params?.wallet === 'string' ? params.wallet : '';
  return <LoadingScreen wallet={wallet} />;
}
