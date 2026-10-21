import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/data';
import { createOAuthState } from '@/lib/oauth';

export const dynamic = 'force-dynamic';

// "네이버로 시작하기" 버튼이 이 라우트로 이동합니다. 이미 로그인돼 있으면 그냥
// 홈으로 보내고, 아니면 네이버 로그인 화면으로 리디렉션합니다.
export async function GET(request: NextRequest) {
  const assisted = request.nextUrl.searchParams.get('assisted') === '1';

  const already = await getCurrentUser();
  if (already) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  if (!clientId) {
    console.error(
      '[머무름] NAVER_CLIENT_ID 환경변수가 없어 네이버 로그인을 시작할 수 없습니다.'
    );
    return NextResponse.redirect(
      new URL(`/login?error=config${assisted ? '&assisted=1' : ''}`, request.url)
    );
  }

  // 네이버는 state 값이 콜백에서 그대로 돌아오지 않으면 로그인 자체를 거부하므로
  // (카카오와 달리 필수), 반드시 쿠키에 저장해둔 값과 함께 보냅니다.
  const state = createOAuthState(assisted);
  const redirectUri = `${request.nextUrl.origin}/api/auth/naver/callback`;

  const authorizeUrl = new URL('https://nid.naver.com/oauth2.0/authorize');
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', state);

  return NextResponse.redirect(authorizeUrl);
}
