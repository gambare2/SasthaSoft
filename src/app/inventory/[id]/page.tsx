import { InventoryDetailView } from '@/features/inventory';

interface PageProps {
  params: { id: string };
}

export default function ProductDetailPage({ params }: PageProps) {
  return <InventoryDetailView id={params.id} />;
}

