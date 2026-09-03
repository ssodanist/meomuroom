// 시니어 네트워킹 플랫폼 "머무름" — 데이터 타입 정의
// Supabase 테이블 구조와 1:1로 대응합니다 (supabase/schema.sql 참고)

export type MembershipTier = 'free' | 'premium';

export interface User {
  id: string;
  name: string;
  nickname: string;
  avatarUrl: string;
  region: string;
  membershipTier: MembershipTier;
  checkinIntervalHours: number;
  lastActiveAt: string;
  guardianContact: string;
  // 회원이 등록한 관심 주제. Community.category와 자유롭게 매칭되는 문자열이며,
  // 미리 정의된 50개 주제 외에 회원이 직접 추가한 주제도 그대로 저장됩니다.
  interests: string[];
}

// 카테고리는 더 이상 고정된 값이 아닙니다 — 기본 50개 주제(lib/categories.ts)에
// 더해, 회원이 검색 후 못 찾으면 직접 새 주제를 추가할 수 있습니다.
// (schema.sql에도 communities.category는 자유 텍스트로 되어 있습니다.)
export type CommunityCategory = string;

export interface Community {
  id: string;
  name: string;
  category: CommunityCategory;
  description: string;
  memberCount: number;
}

export interface Post {
  id: string;
  communityId: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  commentCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export type MeetupCategory =
  | '등산'
  | '여행'
  | '식사'
  | '클래스'
  | '동창회'
  | '스터디';

export type ParticipantStatus = 'joined' | 'waiting';

export interface Meetup {
  id: string;
  title: string;
  hostId: string;
  hostName: string;
  region: string;
  date: string;
  capacity: number;
  participantCount: number;
  description: string;
  category: MeetupCategory;
}

export type DiscussionCategory = '사회이슈' | '건강' | '재테크' | '여행' | '일상';

export interface Discussion {
  id: string;
  category: DiscussionCategory;
  title: string;
  content: string;
  isAnonymous: boolean;
  userId: string;
  authorLabel: string;
  createdAt: string;
  replyCount: number;
}

export interface Qna {
  id: string;
  question: string;
  answer: string | null;
  isResolved: boolean;
  userId: string;
  authorName: string;
  createdAt: string;
}
