import AusentismosClient from '@/components/rrhh/AusentismosClient';
import { getAusentismos } from '@/app/rrhh_ausentismos_actions';
import { getTrabajadores } from '@/app/rrhh_actions';

export const dynamic = 'force-dynamic';

export default async function AusentismosPage() {
  const [resAus, resTrab] = await Promise.all([
    getAusentismos(),
    getTrabajadores(undefined, 'ACTIVO')
  ]);

  return (
    <AusentismosClient 
      ausentismos={(resAus.success && resAus.data) ? resAus.data : []}
      trabajadores={(resTrab.success && resTrab.data) ? resTrab.data : []}
    />
  );
}
