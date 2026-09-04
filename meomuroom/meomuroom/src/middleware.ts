import { NextRequest, NextResponse } from 'next/server';

// 로그인 없이 볼 수 있는 화면들 (회원가입 절차 자체를 포함합니다 — 이 화면들은
// 세션 쿠키가 아니라 회원가입 진행 쿠키(mm_draft_signup)로 각자 보호합니다).
const PUBLIC_PATHS = ['/login', '/onboarding', '/session/continue'];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const hasSession = request.cookies.has('mm_session');
  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // 정적 파일·이미지 최적화 요청은 검사에서 제외합니다.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
