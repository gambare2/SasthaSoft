import { SalesDetailView } from '@/features/sales';

interface PageProps {
  params: { id: string };
}

export default function SalesDetailPage({ params }: PageProps) {
  return <SalesDetailView id={params.id} />;
}

