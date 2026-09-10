// 카카오/네이버 실제 OAuth 로그인에 쓰는 작은 헬퍼입니다.
//
// 흐름: /login 버튼 → /api/auth/{provider}/start (여기서 state를 만들어 쿠키에
// 잠깐 저장하고 카카오·네이버 로그인 화면으로 리디렉션) → 사용자가 그 화면에서
// 로그인/동의 → 카카오·네이버가 /api/auth/{provider}/callback 으로 code와 state를
// 돌려줌 → 콜백이 쿠키에 저장해둔 state와 대조(CSRF 방지)한 뒤 code를 access
// token으로, access token을 프로필로 교환해 lib/data.ts의 loginWithSocialId를 호출.

import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

const STATE_COOKIE = 'mm_oauth_state';
const ASSISTED_COOKIE = 'mm_oauth_assisted';
const OAUTH_COOKIE_MAX_AGE = 60 * 10; // 로그인 절차는 10분 안에 끝난다고 가정

// provider 로그인 화면으로 보내기 직전에 호출합니다. 무작위 state를 만들어
// httpOnly 쿠키에 담아두고, 그 값을 authorize URL에도 함께 실어 보냅니다.
// SameSite=Lax 쿠키는 외부 사이트에서 되돌아오는 최상위 GET 이동(정확히 이
// 시나리오)에는 그대로 전달되므로, 콜백에서 이 쿠키를 다시 읽을 수 있습니다.
export function createOAuthState(assisted: boolean): string {
  const state = randomBytes(16).toString('hex');
  cookies().set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: OAUTH_COOKIE_MAX_AGE,
  });
  cookies().set(ASSISTED_COOKIE, assisted ? '1' : '0', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: OAUTH_COOKIE_MAX_AGE,
  });
  return state;
}

// 콜백 라우트에서 호출합니다. 쿠키는 1회용이라 바로 지웁니다.
export function consumeOAuthState(): { expectedState: string | null; assisted: boolean } {
  const store = cookies();
  const expectedState = store.get(STATE_COOKIE)?.value ?? null;
  const assisted = store.get(ASSISTED_COOKIE)?.value === '1';
  store.delete(STATE_COOKIE);
  store.delete(ASSISTED_COOKIE);
  return { expectedState, assisted };
}
