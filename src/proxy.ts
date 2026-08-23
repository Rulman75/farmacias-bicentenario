import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'llave-secreta-bicentenario-123');

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/logo')
  ) {
    return NextResponse.next();
  }

  if (!token) {
    if (isLoginPage) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as any;
    
    // Si están logueados y tratan de ir al login
    if (isLoginPage) {
      if (payload.id_perfil === 2) { // 2 = Visor
        return NextResponse.redirect(new URL('/consultor', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    const pathname = request.nextUrl.pathname;
    
    // Todos tienen acceso a '/' porque ahora es una pantalla limpia
    // Solo validamos permisos para otras rutas
    if (payload.rutas_apli && pathname !== '/' && !pathname.startsWith('/api')) {
      const isAllowed = payload.rutas_apli.some((ruta: string) => 
        (pathname.startsWith(ruta) && ruta !== '/') || 
        (pathname.startsWith('/panel') && ruta === '/') // Soporte para tokens antiguos
      );
      
      if (!isAllowed) {
         // Acceso denegado, redirigir a consultor si es visor, sino al home limpio
         if (payload.id_perfil === 2) {
           return NextResponse.redirect(new URL('/consultor', request.url));
         } else {
           return NextResponse.redirect(new URL('/', request.url));
         }
      }
    }
    
    // Si intentan entrar manualmente al home y son visor, obligarlos a ir a consultor
    if (pathname === '/' && payload.id_perfil === 2) {
      return NextResponse.redirect(new URL('/consultor', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    if (isLoginPage) return NextResponse.next();
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
