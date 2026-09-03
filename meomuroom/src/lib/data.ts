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

import { isSupabaseConfigured } from './supabaseClient';
import {
  ALL_CATEGORIES,
  POPULAR_CATEGORIES,
  comments as mockComments,
  communities as mockCommunities,
  currentUser as mockCurrentUser,
  discussions as mockDiscussions,
  meetups as mockMeetups,
  posts as mockPosts,
  qnaList as mockQnaList,
  users as mockUsers,
} from './mockData';
import type {
  Comment,
  Community,
  Discussion,
  DiscussionCategory,
  Meetup,
  Post,
  Qna,
  User,
} from './types';

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

// ---------- 사용자 ----------
export async function getCurrentUser(): Promise<User> {
  return mockCurrentUser;
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
