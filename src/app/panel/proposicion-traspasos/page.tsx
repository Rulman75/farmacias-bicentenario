import { getProposicionesTraspaso } from '@/app/actions';
import ProposicionClient from './ProposicionClient';

export const dynamic = 'force-dynamic';

export default async function ProposicionesPage() {
  const result = await getProposicionesTraspaso();
  const traspasos = result.success ? result.data : [];

  return <ProposicionClient traspasos={traspasos || []} />;
}
