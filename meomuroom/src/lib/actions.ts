'use server';

// Next.js Server Actions
// <form action={...}> 으로 연결되어 서버에서 실행되며, lib/data.ts 의
// 데이터 액세스 함수를 호출한 뒤 관련 페이지를 새로고침(revalidate)합니다.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  answerQna,
  completeSignup,
  createComment,
  createCommunity,
  createDiscussion,
  createMeetup,
  createPost,
  createQna,
  getSignupDraftProvider,
  joinMeetup,
  logout,
  requireCurrentUser,
  startSmsLogin,
  toggleInterest,
  updateCheckinSettings,
  verifyIdentity,
  withdraw,
} from './data';
import { uploadPostImage } from './storage';
import type { Discussion, GenderDisplay, Meetup } from './types';

const GENDER_VALUES: GenderDisplay[] = ['남성', '여성', '비공개'];

// ---------- 인증 (로그인 / 본인인증 / 가입 완료 / 로그아웃 / 탈퇴) ----------

// 카카오/네이버 로그인은 이제 실제 OAuth 리디렉션(app/api/auth/{provider}/start,
// .../callback)으로 처리합니다 — 버튼이 Server Action이 아니라 그 라우트로
// 이동하는 링크이므로 여기엔 별도 액션이 필요 없습니다.

// 아이디어13: 카카오·네이버 계정이 없는 소수를 위한 문자(SMS) 예비 경로입니다.
// 데모에서는 실제 문자를 보내지 않고 인증번호 123456을 그대로 확인해 사용합니다.
export async function startSmsLoginAction(formData: FormData) {
  const phone = String(formData.get('phone') ?? '').replace(/\D/g, '');
  const code = String(formData.get('code') ?? '').trim();
  const assisted = formData.get('assisted') === '1';
  const qs = assisted ? '&assisted=1' : '';
  if (phone.length < 9) redirect(`/login/sms?error=phone${qs}`);
  if (code !== '123456') redirect(`/login/sms?error=code&phone=${phone}${qs}`);

  const outcome = await startSmsLogin(phone, assisted);
  if (outcome.kind === 'logged_in') {
    redirect(`/session/continue?to=${encodeURIComponent(outcome.restored ? '/?restored=1' : '/')}`);
  }
  redirect(`/onboarding/verify${assisted ? '?assisted=1' : ''}`);
}

// 아이디어2: 본인인증(PASS 흉내) — 실명·생년만 서버에 확인해두고, 화면에는
// 절대 노출하지 않습니다 (연배 계산에만 사용).
export async function verifyIdentityAction(formData: FormData) {
  const verifiedName = String(formData.get('verifiedName') ?? '').trim();
  const birthYear = Number(formData.get('birthYear'));
  const assisted = formData.get('assisted') === '1';
  const qs = assisted ? '&assisted=1' : '';

  if (!verifiedName || !birthYear || birthYear < 1900 || birthYear > new Date().getFullYear()) {
    redirect(`/onboarding/verify?error=1${qs}`);
  }

  await verifyIdentity({ verifiedName, verifiedBirthYear: birthYear });
  redirect(`/onboarding${assisted ? '?assisted=1' : ''}`);
}

export async function getSignupProviderLabel(): Promise<string> {
  const provider = await getSignupDraftProvider();
  if (provider === 'kakao') return '카카오';
  if (provider === 'naver') return '네이버';
  if (provider === 'sms') return '문자(SMS)';
  return '';
}

// 아이디어3~6: 온보딩 마지막 단계 — 별명·지역·성별(선택)과 관심사를 받아
// 계정 생성을 마무리합니다. 진짜 <form action={...}> 제출이라야 로그인 세션
// 쿠키가 곧바로 다음 화면(/) 렌더링에 반영됩니다 — 그래서 FormData로 받습니다.
export async function completeSignupAction(formData: FormData) {
  const nickname = String(formData.get('nickname') ?? '').trim();
  const region = String(formData.get('region') ?? '').trim();
  const genderRaw = String(formData.get('genderDisplay') ?? '비공개');
  const genderDisplay = GENDER_VALUES.includes(genderRaw as GenderDisplay)
    ? (genderRaw as GenderDisplay)
    : '비공개';
  const interests = formData.getAll('interests').map(String);
  if (!nickname || !region) return;

  await completeSignup({ nickname, region, genderDisplay, interests });
  // '/' 는 로그인 여부를 확인하는 화면이라, 이 액션과 같은 요청 안에서 바로
  // 그리려 하면 방금 만든 세션 쿠키가 아직 반영되기 전이라 다시 로그인 화면으로
  // 튕겨나갈 수 있습니다. 그래서 인증이 필요 없는 완료 화면을 한 번 거쳐,
  // 브라우저가 쿠키를 확실히 저장한 뒤 새로 '/'를 요청하도록 합니다.
  redirect('/onboarding/complete');
}

// 아이디어8: 로그아웃 — 마이페이지 상단의 눈에 띄는 버튼에서 호출합니다.
export async function logoutAction() {
  await logout();
  redirect('/login');
}

// 아이디어9: 탈퇴 — 이유를 묻지 않고 확인 한 번으로 끝냅니다. 데이터는 30일간
// 남아있어 같은 방법으로 다시 로그인하면 그대로 복구됩니다.
export async function withdrawAction() {
  const user = await requireCurrentUser();
  await withdraw(user);
  redirect('/login?withdrawn=1');
}

// ---------- 커뮤니티 / 게시글 / 모임 / 토론 / Q&A ----------

export async function createPostAction(formData: FormData) {
  const user = await requireCurrentUser();
  const communityId = String(formData.get('communityId'));
  const content = String(formData.get('content') ?? '').trim();
  if (!content) return;

  // 사진은 이제 URL을 직접 입력받지 않고, 고른 파일을 서버에서 바로 Supabase
  // Storage에 올려 그 공개 URL을 씁니다. 사진을 안 골랐으면 브라우저가 크기 0인
  // 빈 File을 보내므로 size로 구분합니다.
  let imageUrl: string
