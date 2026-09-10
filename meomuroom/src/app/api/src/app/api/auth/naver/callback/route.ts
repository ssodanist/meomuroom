import { NextRequest, NextResponse } from 'next/server';
import { loginWithSocialId } from '@/lib/data';
import { consumeOAuthState } from '@/lib/oauth';

export const dynamic = 'force-dynamic';

interface NaverTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface NaverProfileResponse {
  resultcode: string;
  message: string;
  response?: {
    id: string;
  };
}

// 네이버가 로그인/동의 후 이 주소로 되돌려줍니다 (?code=...&state=...).
// code를 access token으로, access token을 네이버 회원 고유 id로 교환한 뒤
// 그 id로 우리 서비스에 로그인/회원가입시킵니다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const returnedState = searchParams.get('state');
  const naverError = searchParams.get('error');

  const { expectedState, assisted } = consumeOAuthState();
  const qs = assisted ? '&assisted=1' : '';

  if (naverError || !code) {
    return NextResponse.redirect(new URL(`/login?error=oauth${qs}`, origin));
  }
  if (!expectedState || returnedState !== expectedState) {
    console.error('[머무름] 네이버 로그인 state 값이 일치하지 않아 중단합니다.');
    return NextResponse.redirect(new URL(`/login?error=oauth${qs}`, origin));
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL(`/login?error=config${qs}`, origin));
  }

  try {
    const tokenUrl = new URL('https://nid.naver.com/oauth2.0/token');
    tokenUrl.searchParams.set('grant_type', 'authorization_code');
    tokenUrl.searchParams.set('client_id', clientId);
    tokenUrl.searchParams.set('client_secret', clientSecret);
    tokenUrl.searchParams.set('code', code);
    tokenUrl.searchParams.set('state', returnedState);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenJson = (await tokenRes.json()) as NaverTokenResponse;
    if (!tokenRes.ok || !tokenJson.access_token) {
      throw new Error(
        `네이버 토큰 발급 실패: ${tokenJson.error ?? tokenRes.status} ${tokenJson.error_description ?? ''}`
      );
    }

    const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const profileJson = (await profileRes.json()) as NaverProfileResponse;
    if (!profileRes.ok || profileJson.resultcode !== '00' || !profileJson.response) {
      throw new Error(`네이버 프로필 조회 실패: ${profileJson.message}`);
    }
    const socialId = `naver-${profileJson.response.id}`;

    const outcome = await loginWithSocialId('naver', socialId, assisted);
    if (outcome.kind === 'logged_in') {
      const to = outcome.restored ? '/?restored=1' : '/';
      return NextResponse.redirect(
        new URL(`/session/continue?to=${encodeURIComponent(to)}`, origin)
      );
    }
    return NextResponse.redirect(new URL(`/onboarding/verify${qs}`, origin));
  } catch (err) {
    console.error('[머무름] 네이버 로그인 처리 중 오류가 발생했습니다.', err);
    return NextResponse.redirect(new URL(`/login?error=oauth${qs}`, origin));
  }
}
