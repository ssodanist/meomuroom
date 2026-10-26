import { NextRequest, NextResponse } from 'next/server';
 
// 로그인 없이 볼 수 있는 화면들 (회원가입 절차 자체를 포함합니다 — 이 화면들은
// 세션 쿠키가 아니라 회원가입 진행 쿠키(mm_draft_signup)로 각자 보호합니다).
// /api/auth 는 카카오·네이버 로그인을 "시작"하는 라우트라서, 당연히 아직
// 로그인 전(mm_session 쿠키가 없는 상태)에도 접근할 수 있어야 합니다 —
// 여기 빠져 있던 게 로그인 버튼을 눌러도 곧장 /login으로 튕겨나오던 원인이었습니다.
const PUBLIC_PATHS = ['/login', '/onboarding', '/session/continue', '/api/auth'];
 
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
 
