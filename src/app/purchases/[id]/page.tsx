import { PurchasesDetailView } from '@/features/purchases';

interface PageProps {
  params: { id: string };
}

export default function PurchaseDetailPage({ params }: PageProps) {
  return <PurchasesDetailView id={params.id} />;
}

