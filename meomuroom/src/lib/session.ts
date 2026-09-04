// 로그인 세션 & 회원가입 진행 상태를 쿠키로 흉내 내는 레이어입니다.
//
// 실제 서비스에서는 이 파일 전체가 Supabase Auth 세션(auth.getSession())으로
// 교체됩니다. 지금은 Supabase Auth 없이도 카카오/네이버/문자 로그인, 로그아웃,
// 탈퇴 후 30일 복구까지 전부 눈으로 확인할 수 있도록 쿠키 3종으로 흉내냅니다.
//
//   mm_session         로그인 세션 — 아이디어14: 기본 180일 유지
//   mm_link_<provider>  "이 브라우저 = 이 소셜 계정" 연결 (로그아웃해도 유지)
//   mm_draft_signup     회원가입 진행 중 임시 정보 (본인인증~프로필 입력 사이)
//
// 중요: 이 사이트는 Netlify Functions 같은 서버리스 환경에 배포됩니다.
// 요청마다 완전히 다른 서버 인스턴스가 뜰 수 있어서, lib/mockData.ts 의 메모리
// 배열(mockUsers)은 "이 요청을 우연히 처리한 인스턴스"에만 존재할 수도, 아예
// 초기 상태로 리셋돼 있을 수도 있습니다. 그래서 로그인 세션 자체는 절대 메모리를
// 신뢰하지 않고, 매번 이 쿠키 안의 정보만으로 완전히 재구성할 수 있게 설계했습니다
// (회원 프로필 전체를 쿠키에 그대로 담아둡니다). Supabase를 연결하면 이 쿠키들은
// 다시 짧은 세션 토큰 하나로 줄이고, 실제 프로필 조회는 DB에서 하면 됩니다.

import { cookies } from 'next/headers';
import type { AuthProvider, User } from './types';

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

export interface LinkedAccount {
  socialId: string;
  user: User;
}

function linkCookieName(provider: AuthProvider) {
  return `mm_link_${provider}`;
}

// ---- 세션 (로그인 상태) ----
// 회원 프로필 전체를 쿠키에 저장해둡니다 — 서버리스 인스턴스가 매번 바뀌어도
// mockUsers 배열을 조회할 필요 없이 이 쿠키만으로 로그인 상태를 알 수 있습니다.

export function getSessionUser(): User | null {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setSessionUser(user: User) {
  cookies().set(SESSION_COOKIE, JSON.stringify(user), {
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
// 같은 계정으로 인식되는 것과 같은 동작입니다. socialId뿐 아니라 프로필 전체를
// 함께 저장해둬서, 서버 메모리에 그 회원이 없어도(=다른 서버리스 인스턴스) 곧바로
// 로그인시킬 수 있게 했습니다.

export function getLinkedAccount(provider: AuthProvider): LinkedAccount | null {
  const raw = cookies().get(linkCookieName(provider))?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LinkedAccount;
  } catch {
    return null;
  }
}

export function setLinkedAccount(provider: AuthProvider, account: LinkedAccount) {
  cookies().set(linkCookieName(provider), JSON.stringify(account), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365 * 5,
  });
}

// 탈퇴 후 30일이 지나 완전히 새 계정으로 취급할 때만 연결을 지웁니다.
export function clearLinkedAccount(provider: AuthProvider) {
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
