// 로그인 세션 & 회원가입 진행 상태를 쿠키로 관리합니다.
//
// 실제 회원 정보(프로필)는 이제 Supabase DB(public.users)에 저장되므로,
// 쿠키에는 최소한의 정보만 담습니다:
//
//   mm_session         로그인 세션 — 로그인한 회원의 id(uuid)만 저장. 아이디어14:
//                       기본 180일 유지.
//   mm_link_<provider>  "이 브라우저 = 이 소셜 계정" 연결. 실제 카카오/네이버
//                       로그인이 아직 아니라서, 이 브라우저가 이전에 만든 가짜
//                       socialId를 기억해뒀다가 다음에 같은 버튼을 눌렀을 때
//                       같은 계정으로 로그인시키는 용도입니다. 로그아웃해도 유지됩니다.
//   mm_draft_signup     회원가입 진행 중 임시 정보 (본인인증~프로필 입력 사이,
//                       아직 DB에 사용자가 만들어지기 전이라 쿠키에만 있습니다).
//
// 회원 정보 자체가 이제 Supabase DB에 있기 때문에, 서버리스 인스턴스가 요청마다
// 바뀌어도 문제가 없습니다 — 매 요청마다 이 쿠키의 id로 DB를 조회하면 항상 같은
// 최신 정보를 얻습니다.

import { cookies } from 'next/headers';
import type { AuthProvider } from './types';

const SESSION_COOKIE = 'mm_session';
const DRAFT_COOKIE = 'mm_draft_signup';
const SESSION_MAX_AGE_DAYS = 180; // 자동 로그인 기본값 — 매번 다시 로그인하지 않도록 길게 유지

export interface SignupDraft {
  provider: AuthProvider;
  socialId: string;
  assisted: boolean;
  verifiedName?: string;
  verifiedBirthYear?: number;
}

function linkCookieName(provider: AuthProvider) {
  return `mm_link_${provider}`;
}

// ---- 세션 (로그인 상태) ----

export function getSessionUserId(): string | null {
  return cookies().get(SESSION_COOKIE)?.value ?? null;
}

export function setSessionUserId(userId: string) {
  cookies().set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * SESSION_MAX_AGE_DAYS,
  });
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE);
}

// ---- 소셜 연결 (이 브라우저가 어떤 소셜 계정과 연결돼 있는지) ----
// 로그아웃해도 지워지지 않습니다 — 실제 카카오/네이버 로그인이라면 다시 눌렀을 때
// 같은 계정으로 인식되는 것과 같은 동작입니다.

export function getLinkedSocialId(provider: AuthProvider): string | null {
  return cookies().get(linkCookieName(provider))?.value ?? null;
}

export function setLinkedSocialId(provider: AuthProvider, socialId: string) {
  cookies().set(linkCookieName(provider), socialId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365 * 5,
  });
}

// ---- 회원가입 진행 상태 (본인인증 → 프로필 입력 사이 임시 저장) ----

export function getSignupDraft(): SignupDraft | null {
  const raw = cookies().get(DRAFT_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SignupDraft;
  } catch {
    return null;
  }
}

export function setSignupDraft(draft: SignupDraft) {
  cookies().set(DRAFT_COOKIE, JSON.stringify(draft), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 가입 절차는 1시간 안에 끝난다고 가정
  });
}

export function clearSignupDraft() {
  cookies().delete(DRAFT_COOKIE);
}
