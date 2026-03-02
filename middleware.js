import { NextResponse } from 'next/server';

export function middleware(request) {
  const basicAuth = request.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    if (
      user === process.env.AUTH_USER &&
      pwd === process.env.AUTH_PASS
    ) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Acesso negado', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="CBR Quiz"' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
