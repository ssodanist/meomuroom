import { NextRequest, NextResponse } from 'next/server';
import { loginWithSocialId } from '@/lib/data';
import { consumeOAuthState } from '@/lib/oauth';

export const dynamic = 'force-dynamic';

interface KakaoTokenResponse {
  access_token: string;
}

interface KakaoProfileResponse {
  id: number | string;
}

// 카카오가 로그인/동의 후 이 주소로 되돌려줍니다 (?code=...&state=...).
// code를 access token으로, access token을 카카오 회원 고유 id로 교환한 뒤
// 그 id로 우리 서비스에 로그인/회원가입시킵니다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const returnedState = searchParams.get('state');
  const kakaoError = searchParams.get('error');

  const { expectedState, assisted } = consumeOAuthState();
  const qs = assisted ? '&assisted=1' : '';

  if (kakaoError || !code) {
    return NextResponse.redirect(new URL(`/login?error=oauth${qs}`, origin));
  }
  if (!expectedState || returnedState !== expectedState) {
    console.error('[머무름] 카카오 로그인 state 값이 일치하지 않아 중단합니다.');
    return NextResponse.redirect(new URL(`/login?error=oauth${qs}`, origin));
  }

  const clientId = process.env.KAKAO_REST_API_KEY;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET; // 카카오 콘솔에서 켰을 때만 필요
  if (!clientId) {
    return NextResponse.redirect(new URL(`/login?error=config${qs}`, origin));
  }

  try {
    const redirectUri = `${origin}/api/auth/kakao/callback`;
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
    });
    if (clientSecret) tokenBody.set('client_secret', clientSecret);

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: tokenBody,
    });
    if (!tokenRes.ok) {
      throw new Error(`카카오 토큰 발급 실패 (${tokenRes.status}): ${await tokenRes.text()}`);
    }
    const tokenJson = (await tokenRes.json()) as KakaoTokenResponse;

    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (!profileRes.ok) {
      throw new Error(`카카오 프로필 조회 실패 (${profileRes.status}): ${await profileRes.text()}`);
    }
    const profile = (await profileRes.json()) as KakaoProfileResponse;
    const socialId = `kakao-${profile.id}`;

    const outcome = await loginWithSocialId('kakao', socialId, assisted);
    if (outcome.kind === 'logged_in') {
      const to = outcome.restored ? '/?restored=1' : '/';
      return NextResponse.redirect(
        new URL(`/session/continue?to=${encodeURIComponent(to)}`, origin)
      );
    }
    return NextResponse.redirect(new URL(`/onboarding/verify${qs}`, origin));
  } catch (err) {
    console.error('[머무름] 카카오 로그인 처리 중 오류가 발생했습니다.', err);
    return NextResponse.redirect(new URL(`/login?error=oauth${qs}`, origin));
  }
}
