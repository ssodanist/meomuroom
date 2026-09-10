import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/data';
import { createOAuthState } from '@/lib/oauth';

// 로그인 여부 확인은 매 요청마다 새로 해야 하므로 캐시하지 않습니다.
export const dynamic = 'force-dynamic';

// "카카오로 시작하기" 버튼이 이 라우트로 이동합니다. 이미 로그인돼 있으면 그냥
// 홈으로 보내고, 아니면 카카오 로그인 화면으로 리디렉션합니다.
export async function GET(request: NextRequest) {
  const assisted = request.nextUrl.searchParams.get('assisted') === '1';

  const already = await getCurrentUser();
  if (already) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const clientId = process.env.KAKAO_REST_API_KEY;
  if (!clientId) {
    console.error(
      '[머무름] KAKAO_REST_API_KEY 환경변수가 없어 카카오 로그인을 시작할 수 없습니다.'
    );
    return NextResponse.redirect(
      new URL(`/login?error=config${assisted ? '&assisted=1' : ''}`, request.url)
    );
  }

  const state = createOAuthState(assisted);
  const redirectUri = `${request.nextUrl.origin}/api/auth/kakao/callback`;

  const authorizeUrl = new URL('https://kauth.kakao.com/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('state', state);

  return NextResponse.redirect(authorizeUrl);
}
