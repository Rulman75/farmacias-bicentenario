export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function validateRut(rut: string): boolean {
  if (!rut) return false;
  
  const upperRut = rut.toUpperCase();
  if (upperRut.startsWith('EXT-')) return true;

  const cleanRut = upperRut.replace(/[^0-9K]/g, '');
  if (cleanRut.length < 2) return false;

  const cuerpo = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);

  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  const dvEsperado = 11 - (suma % 11);
  let dvCalculado = dvEsperado.toString();
  if (dvEsperado === 11) dvCalculado = '0';
  if (dvEsperado === 10) dvCalculado = 'K';

  return dv === dvCalculado;
}
