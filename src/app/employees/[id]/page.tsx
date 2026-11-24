import { EmployeeDetailView } from '@/features/employees';

interface PageProps {
  params: { id: string };
}

export default function EmployeeDetailPage({ params }: PageProps) {
  return <EmployeeDetailView id={params.id} />;
}

