// 데이터 액세스 레이어
//
// Supabase(Postgres)에 실제로 데이터를 읽고 씁니다. 서버 액션/서버 컴포넌트에서만
// 호출되므로 lib/supabaseAdmin.ts 의 Service Role 클라이언트를 사용합니다
// (RLS 없이 서버가 직접 접근 — 자세한 이유는 supabaseAdmin.ts 주석 참고).
//
// 회원 프로필/글/모임/토론/Q&A 등 모든 콘텐츠와 로그인(카카오/네이버 실제 OAuth,
// src/lib/oauth.ts + src/app/api/auth/**)이 이제 이 파일을 통해 Supabase에
// 영구 저장됩니다 — 배포/서버 재시작과 무관하게 데이터가 계속 남습니다.

import type { SupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { POPULAR_CATEGORIES as STATIC_POPULAR_CATEGORIES } from './categories';
import { getSupabaseAdmin } from './supabaseAdmin';
import {
  clearSession,
  clearSignupDraft,
  getSessionUserId,
  getSignupDraft,
  setSessionUserId,
  setSignupDraft,
} from './session';
import type {
  AgeGroup,
  AuthProvider,
  Comment,
  Community,
  Discussion,
  DiscussionCategory,
  GenderDisplay,
  Meetup,
  Post,
  Qna,
  User,
} from './types';

// 탈퇴 후 이 기간(일) 안에 같은 방법으로 다시 로그인하면 계정을 그대로 복구합니다.
const WITHDRAW_RESTORE_WINDOW_DAYS = 30;

// 접속할 때마다 매번 안부 신호(last_active_at)를 DB에 쓰지 않도록, 이 시간
// 이상 지났을 때만 갱신합니다 (불필요한 쓰기 요청을 줄이기 위함).
const LAST_ACTIVE_REFRESH_MS = 5 * 60 * 1000;

// 본인인증에서 확인한 생년으로 연배 그룹을 계산합니다. 화면에는 항상 이 결과값만
// 보여주고, 정확한 나이나 생년월일은 노출하지 않습니다.
function ageGroupFromBirthYear(birthYear: number): AgeGroup {
  const age = new Date().getFullYear() - birthYear;
  if (age >= 70) return '70대 이상';
  if (age >= 60) return '60대';
  return '50대';
}

// ---------- Supabase row(snake_case) <-> 앱 타입(camelCase) 매핑 ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUserRow(row: any): User {
  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname,
    avatarUrl: row.avatar_url ?? '',
    region: row.region ?? '',
    membershipTier: row.membership_tier,
    checkinIntervalHours: row.checkin_interval_hours,
    lastActiveAt: row.last_active_at,
    guardianContact: row.guardian_contact ?? '',
    interests: row.interests ?? [],
    authProvider: row.auth_provider,
    socialId: row.social_id,
    verifiedBirthYear: row.verified_birth_year,
    ageGroup: row.age_group,
    genderDisplay: row.gender_display,
    isWithdrawn: row.is_withdrawn,
    withdrawnAt: row.withdrawn_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCommunityRow(row: any): Community {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description ?? '',
    memberCount: row.member_count ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPostRow(row: any): Post {
  return {
    id: row.id,
    communityId: row.community_id,
    userId: row.user_id,
    authorName: row.author_name,
    authorAvatar: row.author_avatar ?? '',
    content: row.content,
    imageUrl: row.image_url ?? undefined,
    createdAt: row.created_at,
    commentCount: row.comment_count ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCommentRow(row: any): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    authorName: row.author_name,
    content: row.content,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMeetupRow(row: any): Meetup {
  return {
    id: row.id,
    title: row.title,
    hostId: row.host_id,
    hostName: row.host_name,
    region: row.region,
    date: row.date,
    capacity: row.capacity,
    participantCount: row.participant_count ?? 1,
    description: row.description ?? '',
    category: row.category,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDiscussionRow(row: any): Discussion {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    content: row.content,
    isAnonymous: row.is_anonymous,
    userId: row.user_id,
    authorLabel: row.author_label,
    createdAt: row.created_at,
    replyCount: row.reply_count ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQnaRow(row: any): Qna {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    isResolved: row.is_resolved,
    userId: row.user_id,
    authorName: row.author_name,
    createdAt: row.created_at,
  };
}

// ---------- 인증 (로그인/가입/로그아웃/탈퇴) ----------
// 로그인 자체(카카오/네이버 버튼 → 본인인증 → 프로필 입력)는 lib/session.ts 의
// 쿠키로 계속 흉내내지만, 회원 정보는 이제 이 함수들을 통해 Supabase에서
// 읽고 씁니다.

// 로그인 세션이 있으면 현재 사용자를, 없으면 null을 반환합니다.
export async function getCurrentUser(): Promise<User | null> {
  const userId = getSessionUserId();
  if (!userId) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[머무름] getCurrentUser 조회 실패:', error.message);
    return null;
  }
  if (!data || data.is_withdrawn) return null;

  // 아이디어11: 로그인해서 화면을 보고 있다는 것 자체가 "오늘 접속함" 안부
  // 신호입니다. 매 요청마다 쓰지 않도록, 일정 시간 지났을 때만 갱신합니다.
  const lastActiveMs = data.last_active_at ? new Date(data.last_active_at).getTime() : 0;
  if (Date.now() - lastActiveMs > LAST_ACTIVE_REFRESH_MS) {
    const now = new Date().toISOString();
    data.last_active_at = now;
    await supabase.from('users').update({ last_active_at: now }).eq('id', userId);
  }

  return mapUserRow(data);
}

// 보호된 화면에서 사용합니다. 로그인 안 돼 있으면 /login 으로 보냅니다.
export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export type LoginOutcome =
  | { kind: 'logged_in'; restored: boolean }
  | { kind: 'needs_signup' };

// socialId로 가입 이력을 찾아 로그인(또는 30일 이내 탈퇴 복구)시키고, 없으면
// 회원가입 절차를 시작합니다. 카카오/네이버/문자 로그인이 공통으로 쓰는 판정
// 로직입니다.
async function resolveOrStartSignup(
  provider: AuthProvider,
  socialId: string,
  assisted: boolean
): Promise<LoginOutcome> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error } = await supabase
    .from('users')
    .select('*')
    .eq('social_id', socialId)
    .maybeSingle();

  if (error) {
    throw new Error('로그인 처리 중 문제가 발생했습니다: ' + error.message);
  }

  if (existing) {
    if (existing.is_withdrawn) {
      const withdrawnAtMs = existing.withdrawn_at ? new Date(existing.withdrawn_at).getTime() : 0;
      const daysSinceWithdraw = (Date.now() - withdrawnAtMs) / (1000 * 60 * 60 * 24);
      if (daysSinceWithdraw <= WITHDRAW_RESTORE_WINDOW_DAYS) {
        // 아이디어9·10: 탈퇴 30일 이내 재로그인 → 그대로 복구 (관심사도 그대로
        // 있었으므로 실제 커뮤니티 가입 이력도 다시 살립니다).
        await supabase
          .from('users')
          .update({ is_withdrawn: false, withdrawn_at: null })
          .eq('id', existing.id);
        await syncCommunityMembership(supabase, existing.id, existing.interests ?? []);
        setSessionUserId(existing.id);
        return { kind: 'logged_in', restored: true };
      }
      // 30일이 지나 완전히 지워진 것으로 취급 — 이 소셜 계정의 예전 데이터를
      // 정리(삭제)하고 같은 socialId로 새로 가입할 수 있게 합니다
      // (social_id는 컬럼에 유니크 제약이 있어, 지우지 않으면 재가입이 막힙니다).
      // community_members는 users FK에 on delete cascade가 걸려 있어 함께
      // 지워지지만, 그 커뮤니티들의 회원수는 따로 다시 계산해줘야 합니다.
      const staleCommunityIds = new Set<string>();
      if ((existing.interests as string[] | null)?.length) {
        const { data: matched } = await supabase
          .from('communities')
          .select('id')
          .in('category', existing.interests as string[]);
        (matched ?? []).forEach((r) => staleCommunityIds.add(r.id as string));
      }
      await supabase.from('users').delete().eq('id', existing.id);
      await supabase.auth.admin.deleteUser(existing.id).catch(() => {});
      await Promise.all([...staleCommunityIds].map((id) => refreshMemberCount(supabase, id)));
    } else {
      setSessionUserId(existing.id);
      return { kind: 'logged_in', restored: false };
    }
  }

  // 처음 로그인 — 회원가입 절차(본인인증→프로필 설정)를 시작합니다.
  setSignupDraft({ provider, socialId, assisted });
  return { kind: 'needs_signup' };
}

// 아이디어1: 카카오/네이버 실제 OAuth 로그인. /api/auth/{provider}/callback 라우트가
// 카카오·네이버로부터 실제 프로필을 받아온 뒤 이 함수를 호출합니다. socialId는
// 항상 그 provider가 내려주는 고유 계정 ID(예: kakao-123456)이므로, 같은 사람이
// 언제 어느 기기로 로그인해도 항상 같은 회원으로 인식됩니다.
export async function loginWithSocialId(
  provider: AuthProvider,
  socialId: string,
  assisted: boolean
): Promise<LoginOutcome> {
  return resolveOrStartSignup(provider, socialId, assisted);
}

// 아이디어13: 카카오·네이버 계정이 없는 소수를 위한 문자(SMS) 예비 경로입니다.
// 휴대폰 번호 자체가 안정적인 식별자라 별도 쿠키 없이 바로 조회합니다.
export async function startSmsLogin(
  phone: string,
  assisted: boolean
): Promise<LoginOutcome> {
  const socialId = `sms-${phone.replace(/\D/g, '')}`;
  return resolveOrStartSignup('sms', socialId, assisted);
}

// 아이디어2: 본인인증(PASS 등)에서 실명·생년을 확인합니다. 화면에는 절대
// 노출하지 않고, 생년만 서버에 남겨 연배(ageGroup) 계산에만 사용합니다.
export async function verifyIdentity(input: {
  verifiedName: string;
  verifiedBirthYear: number;
}): Promise<void> {
  const draft = getSignupDraft();
  if (!draft) throw new Error('진행 중인 가입 정보가 없습니다. 처음부터 다시 시작해주세요.');
  setSignupDraft({ ...draft, ...input });
}

export async function getSignupDraftProvider(): Promise<AuthProvider | null> {
  return getSignupDraft()?.provider ?? null;
}

// onboarding 화면들이 "본인인증을 이미 마쳤는지"를 판단할 때 씁니다.
export async function getSignupProgress(): Promise<{
  provider: AuthProvider;
  assisted: boolean;
  verified: boolean;
} | null> {
  const draft = getSignupDraft();
  if (!draft) return null;
  return {
    provider: draft.provider,
    assisted: draft.assisted,
    verified: Boolean(draft.verifiedBirthYear && draft.verifiedName),
  };
}

// 아이디어3~6: 본인인증이 끝난 뒤, 화면에 보일 정보(별명·지역·성별)와 관심사만
// 회원이 직접 입력받아 계정을 최종 생성합니다. 실명·생년은 이미 확인된 값을 그대로 씁니다.
//
// public.users.id는 auth.users(id)를 참조하므로, 실제 카카오/네이버 로그인
// 없이도 이 관계를 만족시키기 위해 관리자 API로 보이지 않는 auth 계정을 하나
// 함께 만들어둡니다 (로그인 자체은 여전히 쿠키 세션으로 처리합니다).
export async function completeSignup(input: {
  nickname: string;
  region: string;
  genderDisplay: GenderDisplay;
  interests: string[];
}): Promise<User> {
  const draft = getSignupDraft();
  if (!draft || !draft.verifiedBirthYear || !draft.verifiedName) {
    throw new Error('본인인증을 먼저 진행해주세요.');
  }

  const supabase = getSupabaseAdmin();
  const { data: authResult, error: authError } = await supabase.auth.admin.createUser({
    email: `${draft.socialId}@meomuroom.local`,
    password: crypto.randomUUID(),
    email_confirm: true,
  });
  if (authError || !authResult?.user) {
    throw new Error('계정 생성에 실패했습니다: ' + (authError?.message ?? '알 수 없는 오류'));
  }
  const id = authResult.user.id;

  const { data: inserted, error: insertError } = await supabase
    .from('users')
    .insert({
      id,
      name: draft.verifiedName,
      nickname: input.nickname,
      avatar_url: `https://i.pravatar.cc/150?u=${encodeURIComponent(draft.socialId)}`,
      region: input.region,
      membership_tier: 'free',
      checkin_interval_hours: 24,
      last_active_at: new Date().toISOString(),
      guardian_contact: '',
      interests: input.interests,
      auth_provider: draft.provider,
      social_id: draft.socialId,
      verified_birth_year: draft.verifiedBirthYear,
      age_group: ageGroupFromBirthYear(draft.verifiedBirthYear),
      gender_display: input.genderDisplay,
      is_withdrawn: false,
      withdrawn_at: null,
    })
    .select()
    .single();

  if (insertError || !inserted) {
    // 회원 정보 저장에 실패했으면 방금 만든 인증 계정도 함께 정리합니다(고아 계정 방지).
    await supabase.auth.admin.deleteUser(id).catch(() => {});
    throw new Error('회원 정보 저장에 실패했습니다: ' + (insertError?.message ?? '알 수 없는 오류'));
  }

  // 가입할 때 고른 관심사를 실제 커뮤니티 가입 이력(community_members)에도 반영합니다.
  await syncCommunityMembership(supabase, id, input.interests);

  setSessionUserId(id);
  clearSignupDraft();
  return mapUserRow(inserted);
}

// 아이디어8: 로그아웃 — 세션만 지웁니다 (소셜 연결은 남아있어 다음에 바로 재로그인됩니다).
export async function logout(): Promise<void> {
  clearSession();
}

// 아이디어9: 탈퇴 — 죄책감 유발형 설문 없이 바로 처리하고, 30일 안에는 복구할 수
// 있도록 데이터는 남겨둡니다 (완전 삭제가 아니라 isWithdrawn 표시).
export async function withdraw(user: User): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase
    .from('users')
    .update({ is_withdrawn: true, withdrawn_at: new Date().toISOString() })
    .eq('id', user.id);
  // 관심사(users.interests)는 30일 복구를 위해 그대로 두되, 실제 가입 이력만
  // 지워서 탈퇴 기간에는 회원수 집계에서 빠지도록 합니다. 30일 내 재로그인하면
  // resolveOrStartSignup이 관심사를 보고 다시 살려냅니다.
  await syncCommunityMembership(supabase, user.id, []);
  clearSession();
}

export async function updateCheckinSettings(
  user: User,
  input: { checkinIntervalHours: number; guardianContact: string }
): Promise<User> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .update({
      checkin_interval_hours: input.checkinIntervalHours,
      guardian_contact: input.guardianContact,
    })
    .eq('id', user.id)
    .select()
    .single();
  if (error || !data) throw new Error('안부 확인 설정 저장에 실패했습니다.');
  return mapUserRow(data);
}

// 커뮤니티 실제 회원수 = seed_member_count(원래 시드 데이터의 기본 수치) +
// community_members 테이블에 실제로 쌓인 가입 이력. 가입/탈퇴가 있을 때마다
// 이 함수로 다시 계산해서 communities.member_count에 반영합니다 — 화면에서는
// 여전히 member_count 컬럼 하나만 읽으면 되도록(빠른 목록 조회) 하면서도, 그
// 값의 근거는 항상 실제 가입 이력 테이블입니다.
async function refreshMemberCount(supabase: SupabaseClient, communityId: string): Promise<void> {
  const [{ count }, { data: community }] = await Promise.all([
    supabase
      .from('community_members')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId),
    supabase.from('communities').select('seed_member_count').eq('id', communityId).maybeSingle(),
  ]);
  const seed = community?.seed_member_count ?? 0;
  await supabase
    .from('communities')
    .update({ member_count: seed + (count ?? 0) })
    .eq('id', communityId);
}

// 회원의 관심사 배열(users.interests)과 실제 가입 이력 테이블(community_members)을
// 맞춥니다. 카테고리는 communities.category와 유니크하게 매칭되므로, "관심사 등록"이
// 곧 "그 커뮤니티 가입"입니다. 매번 현재 상태와 목표 상태를 비교해 차이만
// 추가/삭제하고, 바뀐 커뮤니티만 회원수를 다시 계산합니다.
async function syncCommunityMembership(
  supabase: SupabaseClient,
  userId: string,
  interests: string[]
): Promise<void> {
  const { data: currentRows } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('user_id', userId);
  const currentIds = new Set((currentRows ?? []).map((r) => r.community_id as string));

  let targetIds = new Set<string>();
  if (interests.length > 0) {
    const { data: matched } = await supabase.from('communities').select('id').in('category', interests);
    targetIds = new Set((matched ?? []).map((r) => r.id as string));
  }

  const toAdd = [...targetIds].filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !targetIds.has(id));

  if (toAdd.length > 0) {
    await supabase
      .from('community_members')
      .upsert(
        toAdd.map((communityId) => ({ community_id: communityId, user_id: userId })),
        { onConflict: 'user_id,community_id', ignoreDuplicates: true }
      );
  }
  if (toRemove.length > 0) {
    await supabase.from('community_members').delete().eq('user_id', userId).in('community_id', toRemove);
  }

  const changed = [...new Set([...toAdd, ...toRemove])];
  await Promise.all(changed.map((id) => refreshMemberCount(supabase, id)));
}

export async function toggleInterest(user: User, category: string): Promise<User> {
  const interests = user.interests.includes(category)
    ? user.interests.filter((c) => c !== category)
    : [...user.interests, category];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .update({ interests })
    .eq('id', user.id)
    .select()
    .single();
  if (error || !data) throw new Error('관심사 저장에 실패했습니다.');
  await syncCommunityMembership(supabase, user.id, interests);
  return mapUserRow(data);
}

// ---------- 커뮤니티 / 게시글 ----------
// 전체 목록: 회원수(=관심도) 내림차순. query/myOnly 로 검색·필터링합니다.
export async function getCommunities(filter?: {
  query?: string;
  myOnly?: boolean;
  interests?: string[];
}): Promise<Community[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('member_count', { ascending: false });
  if (error || !data) return [];

  let list = data.map(mapCommunityRow);
  if (filter?.myOnly && filter.interests) {
    list = list.filter((c) => filter.interests!.includes(c.category));
  }
  if (filter?.query) {
    const norm = (s: string) => s.toLowerCase().replace(/\s/g, '');
    const q = norm(filter.query);
    list = list.filter((c) => norm(c.name + c.category + c.description).includes(q));
  }
  return list;
}

// 온보딩·커뮤니티 화면의 '인기 주제' 빠른 선택 칩. 실시간 회원 수 변동과
// 무관하게 늘 같은 14개를 보여주는 고정 목록입니다 (lib/categories.ts 참고).
export async function getPopularCategories(): Promise<string[]> {
  return STATIC_POPULAR_CATEGORIES;
}

// 전체 주제 목록 (기본 50개 + 회원이 직접 추가한 주제 포함). 현재 화면에서
// 직접 쓰이는 곳은 없지만, 검색 자동완성 등 향후 기능을 위해 DB에서 그대로
// 가져옵니다.
export async function getAllCategories(): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('communities').select('category').order('category');
  if (error || !data) return [];
  return data.map((row) => row.category as string);
}

export async function createCommunity(input: { category: string; userId: string }): Promise<Community> {
  const trimmed = input.category.trim();
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from('communities')
    .select('*')
    .ilike('category', trimmed)
    .maybeSingle();
  if (existing) return mapCommunityRow(existing);

  // member_count는 0에서 시작합니다 — 이 함수를 부르는 쪽(addCustomCommunityAction)이
  // 곧바로 toggleInterest로 만든 사람을 관심사에 등록하고, 그때 실제 가입 이력이
  // 생기면서 syncCommunityMembership이 회원수를 1로 맞춰줍니다.
  const { data: inserted, error } = await supabase
    .from('communities')
    .insert({
      name: `${trimmed} 모임`,
      category: trimmed,
      description: '직접 등록하신 관심 주제예요. 같은 관심사를 가진 분들과 만나보세요.',
      member_count: 0,
      seed_member_count: 0,
    })
    .select()
    .single();
  if (error || !inserted) throw new Error('커뮤니티 생성에 실패했습니다: ' + error?.message);
  return mapCommunityRow(inserted);
}

export async function getCommunityById(id: string): Promise<Community | undefined> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('communities').select('*').eq('id', id).maybeSingle();
  return data ? mapCommunityRow(data) : undefined;
}

export async function getPostsByCommunity(communityId: string): Promise<Post[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapPostRow);
}

// 홈 화면 "커뮤니티 새 소식"처럼 커뮤니티 구분 없이 최신 글 N개가 필요할 때 씁니다.
export async function getRecentPosts(limit: number): Promise<Post[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(mapPostRow);
}

export async function getPostById(id: string): Promise<Post | undefined> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
  return data ? mapPostRow(data) : undefined;
}

export async function createPost(input: {
  communityId: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
}): Promise<Post> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('posts')
    .insert({
      community_id: input.communityId,
      user_id: input.userId,
      author_name: input.authorName,
      author_avatar: input.authorAvatar,
      content: input.content,
      image_url: input.imageUrl ?? null,
      comment_count: 0,
    })
    .select()
    .single();
  if (error || !data) throw new Error('글 작성에 실패했습니다: ' + error?.message);
  return mapPostRow(data);
}

export async function getCommentsByPost(postId: string): Promise<Comment[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map(mapCommentRow);
}

export async function createComment(input: {
  postId: string;
  userId: string;
  authorName: string;
  content: string;
}): Promise<Comment> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: input.postId,
      user_id: input.userId,
      author_name: input.authorName,
      content: input.content,
    })
    .select()
    .single();
  if (error || !data) throw new Error('댓글 작성에 실패했습니다: ' + error?.message);

  // 게시글의 댓글 수를 함께 늘립니다 (posts.comment_count는 화면 표시용 캐시 값).
  const { data: post } = await supabase
    .from('posts')
    .select('comment_count')
    .eq('id', input.postId)
    .maybeSingle();
  if (post) {
    await supabase
      .from('posts')
      .update({ comment_count: (post.comment_count ?? 0) + 1 })
      .eq('id', input.postId);
  }

  return mapCommentRow(data);
}

// ---------- 오프라인 모임 ----------
export async function getMeetups(regionFilter?: string): Promise<Meetup[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from('meetups').select('*').order('date', { ascending: true });
  if (regionFilter) query = query.ilike('region', `%${regionFilter}%`);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(mapMeetupRow);
}

export async function getMeetupById(id: string): Promise<Meetup | undefined> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('meetups').select('*').eq('id', id).maybeSingle();
  return data ? mapMeetupRow(data) : undefined;
}

export async function createMeetup(input: {
  title: string;
  hostId: string;
  hostName: string;
  region: string;
  date: string;
  capacity: number;
  description: string;
  category: Meetup['category'];
}): Promise<Meetup> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('meetups')
    .insert({
      title: input.title,
      host_id: input.hostId,
      host_name: input.hostName,
      region: input.region,
      date: input.date,
      capacity: input.capacity,
      participant_count: 1,
      description: input.description,
      category: input.category,
    })
    .select()
    .single();
  if (error || !data) throw new Error('모임 생성에 실패했습니다: ' + error?.message);
  return mapMeetupRow(data);
}

export async function joinMeetup(meetupId: string): Promise<Meetup | undefined> {
  const supabase = getSupabaseAdmin();
  const { data: meetup } = await supabase
    .from('meetups')
    .select('*')
    .eq('id', meetupId)
    .maybeSingle();
  if (!meetup) return undefined;
  if ((meetup.participant_count ?? 0) >= meetup.capacity) return mapMeetupRow(meetup);

  const { data: updated } = await supabase
    .from('meetups')
    .update({ participant_count: (meetup.participant_count ?? 0) + 1 })
    .eq('id', meetupId)
    .select()
    .single();
  return updated ? mapMeetupRow(updated) : mapMeetupRow(meetup);
}

// ---------- 자유토론 ----------
export async function getDiscussions(category?: DiscussionCategory): Promise<Discussion[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from('discussions').select('*').order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(mapDiscussionRow);
}

export async function getDiscussionById(id: string): Promise<Discussion | undefined> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('discussions').select('*').eq('id', id).maybeSingle();
  return data ? mapDiscussionRow(data) : undefined;
}

export async function createDiscussion(input: {
  userId: string;
  authorName: string;
  category: Discussion['category'];
  title: string;
  content: string;
  isAnonymous: boolean;
}): Promise<Discussion> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('discussions')
    .insert({
      category: input.category,
      title: input.title,
      content: input.content,
      is_anonymous: input.isAnonymous,
      user_id: input.userId,
      author_label: input.isAnonymous ? '익명' : input.authorName,
      reply_count: 0,
    })
    .select()
    .single();
  if (error || !data) throw new Error('토론 작성에 실패했습니다: ' + error?.message);
  return mapDiscussionRow(data);
}

// ---------- Q&A ----------
export async function getQnaList(): Promise<Qna[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('qna')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapQnaRow);
}

export async function getQnaById(id: string): Promise<Qna | undefined> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('qna').select('*').eq('id', id).maybeSingle();
  return data ? mapQnaRow(data) : undefined;
}

export async function createQna(input: {
  userId: string;
  authorName: string;
  question: string;
}): Promise<Qna> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('qna')
    .insert({
      question: input.question,
      answer: null,
      is_resolved: false,
      user_id: input.userId,
      author_name: input.authorName,
    })
    .select()
    .single();
  if (error || !data) throw new Error('질문 등록에 실패했습니다: ' + error?.message);
  return mapQnaRow(data);
}

export async function answerQna(id: string, answer: string): Promise<Qna | undefined> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('qna')
    .update({ answer, is_resolved: true })
    .eq('id', id)
    .select()
    .single();
  return data ? mapQnaRow(data) : undefined;
}
