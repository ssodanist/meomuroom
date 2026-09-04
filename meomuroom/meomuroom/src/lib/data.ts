// 데이터 액세스 레이어
//
// 지금은 lib/mockData.ts 의 메모리 데이터를 읽고 씁니다 (서버 프로세스가
// 살아있는 동안에는 새로 만든 글/모임도 계속 조회됩니다).
//
// Supabase 프로젝트를 연결한 뒤에는 이 파일의 각 함수 내부만
// `supabase.from('테이블명')...` 쿼리로 교체하면 됩니다.
// 테이블/컬럼 이름은 supabase/schema.sql 과 동일하게 맞춰뒀습니다.
// 예)
//   const { data } = await supabase.from('communities').select('*');
//   return data.map(mapCommunityRow);

import { redirect } from 'next/navigation';
import { isSupabaseConfigured } from './supabaseClient';
import {
  ALL_CATEGORIES,
  POPULAR_CATEGORIES,
  ageGroupFromBirthYear,
  comments as mockComments,
  communities as mockCommunities,
  discussions as mockDiscussions,
  meetups as mockMeetups,
  posts as mockPosts,
  qnaList as mockQnaList,
  users as mockUsers,
} from './mockData';
import {
  clearLinkedAccount,
  clearSession,
  clearSignupDraft,
  getLinkedAccount,
  getSessionUser,
  getSignupDraft,
  setLinkedAccount,
  setSessionUser,
  setSignupDraft,
} from './session';
import type {
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

function newId(prefix: string) {
  return `${prefix}-${
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  }`;
}

if (!isSupabaseConfigured) {
  // 개발 편의를 위한 안내. 빌드/런타임에는 영향이 없습니다.
  // eslint-disable-next-line no-console
  console.info(
    '[머무름] Supabase 환경변수가 설정되지 않아 목업 데이터로 동작합니다. (.env.local 참고)'
  );
}

// ---------- 인증 (로그인/가입/로그아웃/탈퇴) ----------
// 실제 서비스에서는 아래 함수들이 Supabase Auth(카카오/네이버 Provider, PASS 본인인증
// 연동)로 교체됩니다. 지금은 lib/session.ts 의 쿠키로 같은 흐름을 흉내냅니다.

// 로그인 세션이 있으면 현재 사용자를, 없으면 null을 반환합니다.
// (로그인 화면 등 "로그인 안 돼 있어도 되는" 화면에서 사용)
//
// 중요: 세션 쿠키(mm_session) 자체에 프로필 전체가 들어있으므로, 서버리스
// 인스턴스가 매번 바뀌어도(=mockUsers 배열이 초기 상태여도) 로그인 상태를 잃지
// 않습니다. mockUsers는 다른 회원(글쓴이 등)을 보여줄 때만 참고용으로 씁니다.
export async function getCurrentUser(): Promise<User | null> {
  const sessionUser = getSessionUser();
  if (!sessionUser || sessionUser.isWithdrawn) return null;
  // 아이디어11: 로그인 세션이 살아있다는 것 자체가 "오늘 접속함" 안부 신호입니다.
  sessionUser.lastActiveAt = new Date().toISOString();
  // 이 서버 인스턴스가 마침 그 회원을 기억하고 있다면 최신 정보로 맞춰둡니다
  // (같은 인스턴스가 다음 요청도 처리할 경우를 위한 best-effort 캐시일 뿐,
  // 로그인 여부 판단 자체는 위 쿠키만으로 이미 끝났습니다).
  const idx = mockUsers.findIndex((u) => u.id === sessionUser.id);
  if (idx > -1) mockUsers[idx] = sessionUser;
  else mockUsers.push(sessionUser);
  return sessionUser;
}

// 보호된 화면에서 사용합니다. 로그인 안 돼 있으면 /login 으로 보냅니다.
// (middleware.ts 가 먼저 막아주지만, 페이지 단에서도 한 번 더 보장합니다)
export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export type LoginOutcome =
  | { kind: 'logged_in'; restored: boolean }
  | { kind: 'needs_signup' };

// existing이 있으면 로그인(또는 30일 이내 탈퇴 복구)시키고, 없으면 회원가입
// 절차를 시작합니다. 카카오/네이버/문자 로그인이 공통으로 쓰는 판정 로직입니다.
//
// existing은 mockUsers(서버 메모리)가 아니라 mm_link_<provider> 쿠키에서 그대로
// 가져온 프로필입니다 — 서버리스 환경에서는 메모리가 매번 리셋될 수 있어서,
// "이 브라우저가 전에 가입한 적 있는지"는 오직 이 쿠키로만 판단합니다.
function resolveOrStartSignup(
  provider: AuthProvider,
  socialId: string,
  assisted: boolean,
  existing: User | undefined
): LoginOutcome {
  if (existing) {
    if (existing.isWithdrawn) {
      const withdrawnAtMs = existing.withdrawnAt ? new Date(existing.withdrawnAt).getTime() : 0;
      const daysSinceWithdraw = (Date.now() - withdrawnAtMs) / (1000 * 60 * 60 * 24);
      if (daysSinceWithdraw <= WITHDRAW_RESTORE_WINDOW_DAYS) {
        // 아이디어9·10: 탈퇴 30일 이내 재로그인 → 그대로 복구
        const restored: User = { ...existing, isWithdrawn: false, withdrawnAt: null };
        setSessionUser(restored);
        setLinkedAccount(provider, { socialId, user: restored });
        return { kind: 'logged_in', restored: true };
      }
      // 30일이 지나 완전히 지워진 것으로 취급 — 같은 계정으로 새로 가입합니다.
      clearLinkedAccount(provider);
    } else {
      setSessionUser(existing);
      return { kind: 'logged_in', restored: false };
    }
  }

  // 처음 로그인 — 회원가입 절차(본인인증→프로필 설정)를 시작합니다.
  setSignupDraft({ provider, socialId, assisted });
  return { kind: 'needs_signup' };
}

// 아이디어1: 카카오/네이버 "원버튼 로그인". 이 브라우저가 해당 provider 계정과
// 연결된 적이 있으면(mm_link_* 쿠키) 바로 로그인하고, 처음이면 회원가입을 시작합니다.
// 실제 서비스에서는 이 socialId가 카카오/네이버가 내려주는 고유 계정 ID로 바뀝니다.
export async function startLogin(
  provider: 'kakao' | 'naver',
  assisted: boolean
): Promise<LoginOutcome> {
  const linked = getLinkedAccount(provider);
  return resolveOrStartSignup(
    provider,
    linked?.socialId ?? `${provider}-${newId('social')}`,
    assisted,
    linked?.user
  );
}

// 아이디어13: 카카오·네이버 계정이 없는 소수를 위한 문자(SMS) 예비 경로입니다.
// 휴대폰 번호 자체가 안정적인 식별자라, 이 번호로 가입했던 적이 있는지는
// mm_link_sms 쿠키에 저장해둔 프로필로 판단합니다.
export async function startSmsLogin(
  phone: string,
  assisted: boolean
): Promise<LoginOutcome> {
  const socialId = `sms-${phone.replace(/\D/g, '')}`;
  const linked = getLinkedAccount('sms');
  const existing = linked?.socialId === socialId ? linked.user : undefined;
  return resolveOrStartSignup('sms', socialId, assisted, existing);
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
  const user: User = {
    id: newId('u'),
    name: draft.verifiedName,
    nickname: input.nickname,
    avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(draft.socialId)}`,
    region: input.region,
    membershipTier: 'free',
    checkinIntervalHours: 24,
    lastActiveAt: new Date().toISOString(),
    guardianContact: '',
    interests: input.interests,
    authProvider: draft.provider,
    socialId: draft.socialId,
    verifiedBirthYear: draft.verifiedBirthYear,
    ageGroup: ageGroupFromBirthYear(draft.verifiedBirthYear),
    genderDisplay: input.genderDisplay,
    isWithdrawn: false,
    withdrawnAt: null,
  };
  mockUsers.push(user);
  setLinkedAccount(draft.provider, { socialId: draft.socialId, user });
  setSessionUser(user);
  clearSignupDraft();
  return user;
}

// 아이디어8: 로그아웃 — 세션만 지웁니다 (소셜 연결은 남아있어 다음에 바로 재로그인됩니다).
export async function logout(): Promise<void> {
  clearSession();
}

// 아이디어9: 탈퇴 — 죄책감 유발형 설문 없이 바로 처리하고, 30일 안에는 복구할 수
// 있도록 데이터는 남겨둡니다 (완전 삭제가 아니라 isWithdrawn 표시).
// 서버리스 환경에서는 mockUsers를 뒤져서 회원을 찾는 대신, 현재 세션의 프로필을
// 그대로 받아 mm_link_<provider> 쿠키에 "탈퇴 상태"로 다시 저장합니다 — 그래야
// 다른 서버 인스턴스가 처리하는 재로그인 요청에서도 30일 복구 판단이 가능합니다.
export async function withdraw(user: User): Promise<void> {
  const withdrawnUser: User = { ...user, isWithdrawn: true, withdrawnAt: new Date().toISOString() };
  const idx = mockUsers.findIndex((u) => u.id === user.id);
  if (idx > -1) mockUsers[idx] = withdrawnUser;
  else mockUsers.push(withdrawnUser);
  setLinkedAccount(user.authProvider, { socialId: user.socialId, user: withdrawnUser });
  clearSession();
}

export async function updateCheckinSettings(
  user: User,
  input: { checkinIntervalHours: number; guardianContact: string }
): Promise<User> {
  const updated: User = { ...user, ...input };
  const idx = mockUsers.findIndex((u) => u.id === user.id);
  if (idx > -1) mockUsers[idx] = updated;
  else mockUsers.push(updated);
  // 현재 세션 쿠키도 함께 갱신해야, 다른 서버 인스턴스가 처리하는 다음 요청에서도
  // 바뀐 설정이 유지됩니다 (서버 메모리만 믿으면 안 됩니다).
  setSessionUser(updated);
  return updated;
}

export async function toggleInterest(user: User, category: string): Promise<User> {
  const interests = user.interests.includes(category)
    ? user.interests.filter((c) => c !== category)
    : [...user.interests, category];
  const updated: User = { ...user, interests };
  const idx = mockUsers.findIndex((u) => u.id === user.id);
  if (idx > -1) mockUsers[idx] = updated;
  else mockUsers.push(updated);
  setSessionUser(updated);
  return updated;
}

// ---------- 커뮤니티 / 게시글 ----------
// 전체 목록: 회원수(=관심도) 내림차순. query/myOnly 로 검색·필터링합니다.
export async function getCommunities(filter?: {
  query?: string;
  myOnly?: boolean;
  interests?: string[];
}): Promise<Community[]> {
  const norm = (s: string) => s.toLowerCase().replace(/\s/g, '');
  const q = filter?.query ? norm(filter.query) : '';
  let list = [...mockCommunities].sort((a, b) => b.memberCount - a.memberCount);
  if (filter?.myOnly && filter.interests) {
    list = list.filter((c) => filter.interests!.includes(c.category));
  }
  if (q) {
    list = list.filter((c) => norm(c.name + c.category + c.description).includes(q));
  }
  return list;
}

export async function getPopularCategories(): Promise<string[]> {
  return POPULAR_CATEGORIES;
}

export async function getAllCategories(): Promise<string[]> {
  return ALL_CATEGORIES;
}

export async function createCommunity(input: { category: string; userId: string }): Promise<Community> {
  const trimmed = input.category.trim();
  const existing = mockCommunities.find(
    (c) => c.category.toLowerCase() === trimmed.toLowerCase()
  );
  if (existing) return existing;
  const community: Community = {
    id: newId('c-custom'),
    name: `${trimmed} 모임`,
    category: trimmed,
    description: '직접 등록하신 관심 주제예요. 같은 관심사를 가진 분들과 만나보세요.',
    memberCount: 1,
  };
  mockCommunities.push(community);
  ALL_CATEGORIES.push(trimmed);
  return community;
}

export async function getCommunityById(id: string): Promise<Community | undefined> {
  return mockCommunities.find((c) => c.id === id);
}

export async function getPostsByCommunity(communityId: string): Promise<Post[]> {
  return mockPosts
    .filter((p) => p.communityId === communityId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getPostById(id: string): Promise<Post | undefined> {
  return mockPosts.find((p) => p.id === id);
}

export async function createPost(input: {
  communityId: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
}): Promise<Post> {
  const post: Post = {
    id: newId('p'),
    communityId: input.communityId,
    userId: input.userId,
    authorName: input.authorName,
    authorAvatar: input.authorAvatar,
    content: input.content,
    imageUrl: input.imageUrl,
    createdAt: new Date().toISOString(),
    commentCount: 0,
  };
  mockPosts.unshift(post);
  return post;
}

export async function getCommentsByPost(postId: string): Promise<Comment[]> {
  return mockComments.filter((c) => c.postId === postId);
}

export async function createComment(input: {
  postId: string;
  userId: string;
  authorName: string;
  content: string;
}): Promise<Comment> {
  const comment: Comment = {
    id: newId('cm'),
    postId: input.postId,
    userId: input.userId,
    authorName: input.authorName,
    content: input.content,
    createdAt: new Date().toISOString(),
  };
  mockComments.push(comment);
  const post = mockPosts.find((p) => p.id === input.postId);
  if (post) post.commentCount += 1;
  return comment;
}

// ---------- 오프라인 모임 ----------
export async function getMeetups(regionFilter?: string): Promise<Meetup[]> {
  const list = [...mockMeetups].sort((a, b) => (a.date > b.date ? 1 : -1));
  if (!regionFilter) return list;
  return list.filter((m) => m.region.includes(regionFilter));
}

export async function getMeetupById(id: string): Promise<Meetup | undefined> {
  return mockMeetups.find((m) => m.id === id);
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
  const meetup: Meetup = {
    id: newId('m'),
    title: input.title,
    hostId: input.hostId,
    hostName: input.hostName,
    region: input.region,
    date: input.date,
    capacity: input.capacity,
    participantCount: 1,
    description: input.description,
    category: input.category,
  };
  mockMeetups.unshift(meetup);
  return meetup;
}

export async function joinMeetup(meetupId: string): Promise<Meetup | undefined> {
  const meetup = mockMeetups.find((m) => m.id === meetupId);
  if (meetup && meetup.participantCount < meetup.capacity) {
    meetup.participantCount += 1;
  }
  return meetup;
}

// ---------- 자유토론 ----------
export async function getDiscussions(category?: DiscussionCategory): Promise<Discussion[]> {
  const list = [...mockDiscussions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  if (!category) return list;
  return list.filter((d) => d.category === category);
}

export async function getDiscussionById(id: string): Promise<Discussion | undefined> {
  return mockDiscussions.find((d) => d.id === id);
}

export async function createDiscussion(input: {
  userId: string;
  authorName: string;
  category: Discussion['category'];
  title: string;
  content: string;
  isAnonymous: boolean;
}): Promise<Discussion> {
  const discussion: Discussion = {
    id: newId('d'),
    category: input.category,
    title: input.title,
    content: input.content,
    isAnonymous: input.isAnonymous,
    userId: input.userId,
    authorLabel: input.isAnonymous ? '익명' : input.authorName,
    createdAt: new Date().toISOString(),
    replyCount: 0,
  };
  mockDiscussions.unshift(discussion);
  return discussion;
}

// ---------- Q&A ----------
export async function getQnaList(): Promise<Qna[]> {
  return [...mockQnaList].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getQnaById(id: string): Promise<Qna | undefined> {
  return mockQnaList.find((q) => q.id === id);
}

export async function createQna(input: {
  userId: string;
  authorName: string;
  question: string;
}): Promise<Qna> {
  const qna: Qna = {
    id: newId('q'),
    question: input.question,
    answer: null,
    isResolved: false,
    userId: input.userId,
    authorName: input.authorName,
    createdAt: new Date().toISOString(),
  };
  mockQnaList.unshift(qna);
  return qna;
}

export async function answerQna(id: string, answer: string): Promise<Qna | undefined> {
  const qna = mockQnaList.find((q) => q.id === id);
  if (qna) {
    qna.answer = answer;
    qna.isResolved = true;
  }
  return qna;
}
