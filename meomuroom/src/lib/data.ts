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
  clearLinkedSocialId,
  clearSession,
  clearSignupDraft,
  getLinkedSocialId,
  getSessionUserId,
  getSignupDraft,
  setLinkedSocialId,
  setSessionUserId,
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
export async function getCurrentUser(): Promise<User | null> {
  const userId = getSessionUserId();
  if (!userId) return null;
  const user = mockUsers.find((u) => u.id === userId && !u.isWithdrawn);
  if (!user) return null;
  // 아이디어11: 로그인 세션이 살아있다는 것 자체가 "오늘 접속함" 안부 신호입니다.
  user.lastActiveAt = new Date().toISOString();
  return user;
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
        existing.isWithdrawn = false;
        existing.withdrawnAt = null;
        setSessionUserId(existing.id);
        return { kind: 'logged_in', restored: true };
      }
      // 30일이 지나 완전히 지워진 것으로 취급 — 같은 계정으로 새로 가입합니다.
      clearLinkedSocialId(provider);
    } else {
      setSessionUserId(existing.id);
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
  const linkedId = getLinkedSocialId(provider);
  const existing = linkedId
    ? mockUsers.find((u) => u.socialId === linkedId && u.authProvider === provider)
    : undefined;
  return resolveOrStartSignup(
    provider,
    linkedId ?? `${provider}-${newId('social')}`,
    assisted,
    existing
  );
}

// 아이디어13: 카카오·네이버 계정이 없는 소수를 위한 문자(SMS) 예비 경로입니다.
// 휴대폰 번호 자체가 안정적인 식별자라 브라우저 연결 쿠키 없이도 다음에 같은
// 번호로 다시 로그인하면 같은 계정으로 인식됩니다.
export async function startSmsLogin(
  phone: string,
  assisted: boolean
): Promise<LoginOutcome> {
  const socialId = `sms-${phone.replace(/\D/g, '')}`;
  const existing = mockUsers.find((u) => u.socialId === socialId && u.authProvider === 'sms');
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
  setLinkedSocialId(draft.provider, draft.socialId);
  setSessionUserId(user.id);
  clearSignupDraft();
  return user;
}

// 아이디어8: 로그아웃 — 세션만 지웁니다 (소셜 연결은 남아있어 다음에 바로 재로그인됩니다).
export async function logout(): Promise<void> {
  clearSession();
}

// 아이디어9: 탈퇴 — 죄책감 유발형 설문 없이 바로 처리하고, 30일 안에는 복구할 수
// 있도록 데이터는 남겨둡니다 (완전 삭제가 아니라 isWithdrawn 표시).
export async function withdraw(userId: string): Promise<void> {
  const user = mockUsers.find((u) => u.id === userId);
  if (user) {
    user.isWithdrawn = true;
    user.withdrawnAt = new Date().toISOString();
  }
  clearSession();
}

export async function updateCheckinSettings(
  userId: string,
  input: { checkinIntervalHours: number; guardianContact: string }
): Promise<User> {
  const user = mockUsers.find((u) => u.id === userId);
  if (!user) throw new Error('사용자를 찾을 수 없습니다.');
  user.checkinIntervalHours = input.checkinIntervalHours;
  user.guardianContact = input.guardianContact;
  return user;
}

export async function toggleInterest(userId: string, category: string): Promise<User> {
  const user = mockUsers.find((u) => u.id === userId);
  if (!user) throw new Error('사용자를 찾을 수 없습니다.');
  const idx = user.interests.indexOf(category);
  if (idx > -1) user.interests.splice(idx, 1);
  else user.interests.push(category);
  return user;
}

export async function setInterests(userId: string, interests: string[]): Promise<User> {
  const user = mockUsers.find((u) => u.id === userId);
  if (!user) throw new Error('사용자를 찾을 수 없습니다.');
  user.interests = interests;
  return user;
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
  content: string;
  imageUrl?: string;
}): Promise<Post> {
  const author = mockUsers.find((u) => u.id === input.userId);
  const post: Post = {
    id: newId('p'),
    communityId: input.communityId,
    userId: input.userId,
    authorName: author?.nickname ?? '익명',
    authorAvatar: author?.avatarUrl ?? '',
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
  content: string;
}): Promise<Comment> {
  const author = mockUsers.find((u) => u.id === input.userId);
  const comment: Comment = {
    id: newId('cm'),
    postId: input.postId,
    userId: input.userId,
    authorName: author?.nickname ?? '익명',
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
  region: string;
  date: string;
  capacity: number;
  description: string;
  category: Meetup['category'];
}): Promise<Meetup> {
  const host = mockUsers.find((u) => u.id === input.hostId);
  const meetup: Meetup = {
    id: newId('m'),
    title: input.title,
    hostId: input.hostId,
    hostName: host?.nickname ?? '익명',
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
  category: Discussion['category'];
  title: string;
  content: string;
  isAnonymous: boolean;
}): Promise<Discussion> {
  const author = mockUsers.find((u) => u.id === input.userId);
  const discussion: Discussion = {
    id: newId('d'),
    category: input.category,
    title: input.title,
    content: input.content,
    isAnonymous: input.isAnonymous,
    userId: input.userId,
    authorLabel: input.isAnonymous ? '익명' : author?.nickname ?? '익명',
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

export async function createQna(input: { userId: string; question: string }): Promise<Qna> {
  const author = mockUsers.find((u) => u.id === input.userId);
  const qna: Qna = {
    id: newId('q'),
    question: input.question,
    answer: null,
    isResolved: false,
    userId: input.userId,
    authorName: author?.nickname ?? '익명',
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
