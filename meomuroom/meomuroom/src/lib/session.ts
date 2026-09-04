// 로그인 세션 & 회원가입 진행 상태를 쿠키로 흉내 내는 레이어입니다.
//
// 실제 서비스에서는 이 파일 전체가 Supabase Auth 세션(auth.getSession())으로
// 교체됩니다. 지금은 Supabase Auth 없이도 카카오/네이버/문자 로그인, 로그아웃,
// 탈퇴 후 30일 복구까지 전부 눈으로 확인할 수 있도록 쿠키 3종으로 흉내냅니다.
//
//   mm_session         로그인 세션 (userId) — 아이디어14: 기본 180일 유지
//   mm_link_<provider>  "이 브라우저 = 이 소셜 계정" 연결 (로그아웃해도 유지)
//   mm_draft_signup     회원가입 진행 중 임시 정보 (본인인증~프로필 입력 사이)

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

// 탈퇴 후 30일이 지나 완전히 새 계정으로 취급할 때만 연결을 지웁니다.
export function clearLinkedSocialId(provider: AuthProvider) {
  cookies().delete(linkCookieName(provider));
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
