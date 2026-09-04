// 시니어 네트워킹 플랫폼 "머무름" — 데이터 타입 정의
// Supabase 테이블 구조와 1:1로 대응합니다 (supabase/schema.sql 참고)

export type MembershipTier = 'free' | 'premium';

// 회원가입에 쓴 방법. 카카오·네이버 소셜 로그인을 기본으로 하고,
// 두 계정이 없는 소수를 위한 문자(SMS) 인증 예비 경로를 함께 둡니다.
export type AuthProvider = 'kakao' | 'naver' | 'sms';

// 정확한 나이 대신 화면에는 연배 그룹만 노출합니다 (PASS 본인인증으로 확인된
// 생년월일에서 서버가 자동 계산 — 회원이 직접 입력하지 않습니다).
export type AgeGroup = '50대' | '60대' | '70대 이상';

export type GenderDisplay = '남성' | '여성' | '비공개';

export interface User {
  id: string;
  // 본인인증(PASS 등)으로 확인되는 실명입니다. 서버 검증·법적 요건용으로만 쓰이고
  // 화면 어디에도 노출하지 않습니다 — 화면에는 항상 nickname만 보여주세요.
  name: string;
  nickname: string;
  avatarUrl: string;
  // 자율 선택하는 구/군 단위 지역입니다. 정밀 위치(GPS)는 이 서비스에서 다루지 않습니다.
  region: string;
  membershipTier: MembershipTier;
  checkinIntervalHours: number;
  lastActiveAt: string;
  guardianContact: string;
  // 회원이 등록한 관심 주제. Community.category와 자유롭게 매칭되는 문자열이며,
  // 미리 정의된 50개 주제 외에 회원이 직접 추가한 주제도 그대로 저장됩니다.
  interests: string[];

  // ---- 인증/프로필 (회원가입 방식) ----
  authProvider: AuthProvider;
  // 소셜 로그인 공급자 쪽 사용자 식별자. 실제 서비스에서는 Supabase Auth의
  // provider 식별자로 대체됩니다 — 지금은 브라우저 쿠키로 흉내만 냅니다.
  socialId: string;
  // 본인인증에서 확인한 생년(연도)만 서버에 보관합니다. 나이 자체를 화면에
  // 노출하지 않기 위해 UI 컴포넌트에서는 절대 이 필드를 직접 쓰지 마세요 —
  // 항상 ageGroup(연배)만 사용하세요.
  verifiedBirthYear: number;
  ageGroup: AgeGroup;
  genderDisplay: GenderDisplay;
  // 탈퇴 여부. 탈퇴 후 30일 이내 같은 방법으로 다시 로그인하면 자동 복구됩니다.
  isWithdrawn: boolean;
  withdrawnAt: string | null;
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
