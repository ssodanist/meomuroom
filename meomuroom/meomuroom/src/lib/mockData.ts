import type {
  AgeGroup,
  Community,
  Comment,
  Discussion,
  Meetup,
  Post,
  Qna,
  User,
} from './types';

// 개발/데모용 목업 데이터입니다.
// 실제 서비스에서는 이 파일 대신 Supabase 쿼리 결과를 사용합니다 (lib/data.ts 참고).
//
// 중요: Next.js App Router는 Server Action과 페이지 렌더링을 서로 다른 컴파일
// 번들로 나눌 수 있어서, 같은 프로세스 안에서도 "export const users = [...]" 처럼
// 모듈 스코프에 둔 배열이 액션 쪽과 렌더링 쪽에서 서로 다른 인스턴스로 보일 수
// 있습니다 (회원가입 직후 방금 만든 계정이 홈 화면에서는 안 보이는 문제로
// 나타났습니다). 그래서 이 목업 데이터는 Node 프로세스에 하나뿐인 globalThis에
// 저장해두고, 어느 번들에서 import 하든 항상 같은 배열을 참조하도록 했습니다.
// Supabase로 교체하면 이 globalThis 캐시 자체가 필요 없어집니다.

// 본인인증에서 확인한 생년으로 연배 그룹을 계산합니다. 화면에는 항상 이 결과값만
// 보여주고, 정확한 나이나 생년월일은 노출하지 않습니다.
export function ageGroupFromBirthYear(birthYear: number): AgeGroup {
  const age = new Date().getFullYear() - birthYear;
  if (age >= 70) return '70대 이상';
  if (age >= 60) return '60대';
  return '50대';
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

interface MockDB {
  users: User[];
  communities: Community[];
  allCategories: string[];
  popularCategories: string[];
  posts: Post[];
  comments: Comment[];
  meetups: Meetup[];
  discussions: Discussion[];
  qnaList: Qna[];
}

function createInitialDB(): MockDB {
  const currentUser: User = {
    id: 'u-me',
    name: '김정순',
    nickname: '정순씨',
    avatarUrl: 'https://i.pravatar.cc/150?img=47',
    region: '서울 마포구',
    membershipTier: 'free',
    checkinIntervalHours: 24,
    lastActiveAt: new Date().toISOString(),
    guardianContact: '',
    interests: ['운동', '건강'],
    authProvider: 'kakao',
    socialId: 'kakao-demo-1',
    verifiedBirthYear: 1959,
    ageGroup: ageGroupFromBirthYear(1959),
    genderDisplay: '여성',
    isWithdrawn: false,
    withdrawnAt: null,
  };

  const users: User[] = [
    currentUser,
    {
      id: 'u-2',
      name: '박영식',
      nickname: '영식아빠',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
      region: '서울 강서구',
      membershipTier: 'premium',
      checkinIntervalHours: 24,
      lastActiveAt: new Date().toISOString(),
      guardianContact: '',
      interests: ['여행', '등산·트레킹'],
      authProvider: 'naver',
      socialId: 'naver-demo-2',
      verifiedBirthYear: 1965,
      ageGroup: ageGroupFromBirthYear(1965),
      genderDisplay: '남성',
      isWithdrawn: false,
      withdrawnAt: null,
    },
    {
      id: 'u-3',
      name: '이순자',
      nickname: '순자쌤',
      avatarUrl: 'https://i.pravatar.cc/150?img=32',
      region: '경기 고양시',
      membershipTier: 'free',
      checkinIntervalHours: 12,
      lastActiveAt: new Date().toISOString(),
      guardianContact: '',
      interests: ['원예', '사진'],
      authProvider: 'kakao',
      socialId: 'kakao-demo-3',
      verifiedBirthYear: 1954,
      ageGroup: ageGroupFromBirthYear(1954),
      genderDisplay: '여성',
      isWithdrawn: false,
      withdrawnAt: null,
    },
  ];

  // 카테고리는 회원수(=관심도) 내림차순으로 정렬해 화면에 보여줍니다.
  // 파크골프·그라운드골프·게이트볼·노래교실(트로트)·라인댄스·스마트폰활용 등은
  // 2026년 시니어 트렌드 조사를 바탕으로 추가했습니다. (총 50개 + 회원이 직접 추가 가능)
  const communities: Community[] = [
    { id: 'c-parkgolf', name: '동네 파크골프 모임', category: '파크골프', description: '가볍게 즐기는 파크골프, 초보자도 언제든 환영해요.', memberCount: 892 },
    { id: 'c-health', name: '건강하게 백세까지', category: '건강', description: '혈압, 관절, 수면… 서로 챙겨주는 건강 정보방.', memberCount: 731 },
    { id: 'c-singing', name: '우리 동네 노래교실', category: '노래교실', description: '트로트부터 가요까지, 함께 부르고 배우는 시간.', memberCount: 664 },
    { id: 'c-travel', name: '천천히 걷는 여행', category: '여행', description: '가까운 근교부터 해외까지, 무리하지 않는 여행 정보를 나눠요.', memberCount: 592 },
    { id: 'c-linedance', name: '신나는 라인댄스', category: '라인댄스', description: '쉬운 동작으로 스텝 밟으며 스트레스 확 풀어요.', memberCount: 548 },
    { id: 'c-photo', name: '동네 한 바퀴 사진', category: '사진', description: '스마트폰으로 찍은 오늘의 풍경을 자랑해 보세요.', memberCount: 502 },
    { id: 'c-exercise', name: '아침 스트레칭', category: '운동', description: '무리 없이 매일 몸을 움직이는 습관을 같이 만들어요.', memberCount: 471 },
    { id: 'c-groundgolf', name: '그라운드골프 클럽', category: '그라운드골프', description: '채 하나로 즐기는 잔디 위 나들이 운동이에요.', memberCount: 437 },
    { id: 'c-phone', name: '스마트폰 척척 배우기', category: '스마트폰활용', description: '카톡, 유튜브, 키오스크까지 서로 알려줘요.', memberCount: 405 },
    { id: 'c-pet', name: '반려동물과 노년', category: '반려동물', description: '강아지, 고양이와 함께하는 하루하루를 나눠요.', memberCount: 372 },
    { id: 'c-garden', name: '베란다 텃밭', category: '원예', description: '작은 화분 하나부터 텃밭 가꾸기 노하우까지.', memberCount: 338 },
    { id: 'c-cooking', name: '쉽고 맛있는 집밥', category: '요리', description: '간단하지만 근사한 한 끼 레시피를 나눠요.', memberCount: 311 },
    { id: 'c-gateball', name: '동네 게이트볼회', category: '게이트볼', description: '규칙도 쉽고 다치지 않는 인기 구기 종목이에요.', memberCount: 279 },
    { id: 'c-book', name: '한 달 한 권 독서', category: '독서', description: '함께 읽고 이야기 나누는 느슨한 독서모임입니다.', memberCount: 256 },
    { id: 'c-calligraphy', name: '붓끝 서예교실', category: '서예·캘리그라피', description: '마음을 가다듬는 붓글씨와 캘리그라피.', memberCount: 214 },
    { id: 'c-pottery', name: '손끝 도자기공방', category: '도자기공예', description: '흙을 빚으며 나만의 그릇을 만들어요.', memberCount: 187 },
    { id: 'c-baduk', name: '바둑·장기 한 판', category: '바둑·장기', description: '머리도 쓰고 친구도 사귀는 두뇌 게임 모임.', memberCount: 162 },
    { id: 'c-hiking', name: '주말엔 둘레길', category: '등산·트레킹', description: '무리 없는 코스로 산과 둘레길을 함께 걸어요.', memberCount: 612 },
    { id: 'c-trot', name: '트로트 팬클럽', category: '트로트팬클럽', description: '좋아하는 가수 이야기, 콘서트 정보를 나눠요.', memberCount: 428 },
    { id: 'c-movie', name: '영화·드라마 수다방', category: '영화드라마감상', description: '최근 본 영화나 드라마 이야기를 나눠요.', memberCount: 372 },
    { id: 'c-bike', name: '동네 한 바퀴 자전거', category: '자전거', description: '천천히 페달 밟으며 동네를 둘러봐요.', memberCount: 342 },
    { id: 'c-fishing', name: '강태공 모임', category: '낚시', description: '가까운 저수지·바다 낚시 정보를 나눠요.', memberCount: 318 },
    { id: 'c-swim', name: '물속에서 상쾌하게', category: '수영·아쿠아로빅', description: '관절에 부담 없는 수영과 아쿠아로빅.', memberCount: 298 },
    { id: 'c-volunteer', name: '함께 나누는 봉사', category: '자원봉사', description: '무료 급식, 환경정화 등 봉사활동 정보방.', memberCount: 287 },
    { id: 'c-camping', name: '주말엔 차박', category: '캠핑·차박', description: '가볍게 떠나는 캠핑·차박 정보를 나눠요.', memberCount: 276 },
    { id: 'c-plant', name: '우리집 반려식물', category: '반려식물', description: '화분 하나로 시작하는 식물 키우기.', memberCount: 267 },
    { id: 'c-pingpong', name: '동네 탁구클럽', category: '탁구', description: '가볍게 땀 흘리는 탁구 한 판 어떠세요.', memberCount: 261 },
    { id: 'c-babysit', name: '손주 육아 품앗이', category: '손주육아품앗이', description: '손주 돌봄 노하우와 품앗이 정보를 나눠요.', memberCount: 244 },
    { id: 'c-yoga', name: '몸과 마음 요가', category: '요가', description: '유연하게, 편안하게 몸을 풀어주는 요가 모임.', memberCount: 236 },
    { id: 'c-bowling', name: '스트라이크 볼링', category: '볼링', description: '가볍게 즐기는 볼링, 초보자도 환영이에요.', memberCount: 233 },
    { id: 'c-meditation', name: '마음챙김·웃음치료', category: '명상웃음치료', description: '명상과 웃음으로 마음을 편안하게 다스려요.', memberCount: 209 },
    { id: 'c-coffee', name: '향긋한 커피교실', category: '커피티클래스', description: '핸드드립부터 티 블렌딩까지 배워봐요.', memberCount: 216 },
    { id: 'c-english', name: '왕초보 영어회화', category: '영어회화', description: '여행에서 써먹는 쉬운 영어 회화 연습.', memberCount: 224 },
    { id: 'c-badminton', name: '동네 배드민턴', category: '배드민턴', description: '가볍게 몸 풀기 좋은 배드민턴 모임.', memberCount: 205 },
    { id: 'c-youtuber', name: '시니어 유튜버 도전', category: '시니어유튜버', description: '스마트폰 하나로 나만의 채널 만들기.', memberCount: 201 },
    { id: 'c-billiards', name: '당구 한 게임', category: '당구', description: '친구들과 즐기는 당구 한 게임 어때요.', memberCount: 198 },
    { id: 'c-painting', name: '수채화 그리는 시간', category: '유화수채화', description: '붓 하나로 마음을 그려내는 그림 모임.', memberCount: 189 },
    { id: 'c-ukulele', name: '우쿨렐레 한 곡', category: '우쿨렐레기타', description: '쉬운 코드로 시작하는 우쿨렐레·기타.', memberCount: 176 },
    { id: 'c-knit', name: '뜨개질·비즈공예', category: '비즈손뜨개', description: '손끝으로 만드는 소품, 함께 배워요.', memberCount: 173 },
    { id: 'c-coding', name: '컴퓨터·스마트기기 배우기', category: '컴퓨터코딩배우기', description: '키오스크부터 엑셀까지 차근차근 배워요.', memberCount: 168 },
    { id: 'c-sax', name: '색소폰 연주교실', category: '색소폰', description: '멋진 음색, 색소폰 기초부터 함께해요.', memberCount: 158 },
    { id: 'c-drive', name: '주말 드라이브', category: '자동차드라이브', description: '가까운 근교로 떠나는 드라이브 모임.', memberCount: 155 },
    { id: 'c-hanja', name: '한자 교실', category: '한자교실', description: '생활 속 한자를 재미있게 배워봐요.', memberCount: 145 },
    { id: 'c-wine', name: '와인 한 잔', category: '와인클래스', description: '부담 없이 즐기는 와인 이야기 모임.', memberCount: 134 },
    { id: 'c-ocarina', name: '오카리나·하모니카', category: '오카리나하모니카', description: '작은 악기로 시작하는 나만의 연주.', memberCount: 129 },
    { id: 'c-woodcraft', name: '서각·목공예방', category: '서각목공예', description: '나무를 다듬으며 만드는 나만의 작품.', memberCount: 121 },
    { id: 'c-inkpainting', name: '사군자·문인화', category: '사군자문인화', description: '붓과 먹으로 그리는 전통 문인화.', memberCount: 112 },
    { id: 'c-multicultural', name: '다문화 교류방', category: '다문화교류', description: '다른 나라 문화와 언어를 함께 배워요.', memberCount: 103 },
    { id: 'c-leather', name: '가죽공예 공방', category: '가죽공예', description: '나만의 가죽 소품을 직접 만들어요.', memberCount: 96 },
    { id: 'c-drone', name: '드론 조종 교실', category: '드론', description: '하늘을 나는 드론, 기초부터 배워봐요.', memberCount: 87 },
  ];

  const allCategories = communities.map((c) => c.category);

  // 화면에는 이 중 회원수가 가장 많은 14개만 '인기 주제' 빠른 선택 칩으로 보여주고,
  // 나머지는 검색 또는 직접 추가로 찾도록 합니다 (온보딩·커뮤니티 화면에서 공용으로 사용).
  const popularCategories = communities
    .slice()
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 14)
    .map((c) => c.category);

  const posts: Post[] = [
    {
      id: 'p-1',
      communityId: 'c-travel',
      userId: 'u-2',
      authorName: '영식아빠',
      authorAvatar: 'https://i.pravatar.cc/150?img=12',
      content:
        '지난주에 강릉 다녀왔습니다. 기차로 가니 훨씬 편하더라고요. 바다 보면서 커피 한잔, 그게 최고입니다.',
      imageUrl:
        'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800',
      createdAt: daysAgo(1),
      commentCount: 2,
    },
    {
      id: 'p-2',
      communityId: 'c-garden',
      userId: 'u-3',
      authorName: '순자쌤',
      authorAvatar: 'https://i.pravatar.cc/150?img=32',
      content: '베란다 상추가 드디어 먹을만큼 자랐어요. 오늘 저녁은 상추쌈!',
      imageUrl:
        'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800',
      createdAt: daysAgo(2),
      commentCount: 1,
    },
    {
      id: 'p-3',
      communityId: 'c-exercise',
      userId: 'u-me',
      authorName: '정순씨',
      authorAvatar: 'https://i.pravatar.cc/150?img=47',
      content: '오늘도 아침 스트레칭 15분 완료! 어깨가 한결 가볍네요.',
      createdAt: daysAgo(0),
      commentCount: 0,
    },
  ];

  const comments: Comment[] = [
    {
      id: 'cm-1',
      postId: 'p-1',
      userId: 'u-3',
      authorName: '순자쌤',
      content: '강릉 좋죠! 저도 다음 달에 가보려고요.',
      createdAt: daysAgo(1),
    },
    {
      id: 'cm-2',
      postId: 'p-1',
      userId: 'u-me',
      authorName: '정순씨',
      content: '사진 너무 예뻐요~',
      createdAt: daysAgo(1),
    },
    {
      id: 'cm-3',
      postId: 'p-2',
      userId: 'u-2',
      authorName: '영식아빠',
      content: '저희 집 상추는 아직 새싹이에요 ㅎㅎ',
      createdAt: daysAgo(2),
    },
  ];

  const meetups: Meetup[] = [
    {
      id: 'm-1',
      title: '북한산 둘레길 가을 산행',
      hostId: 'u-2',
      hostName: '영식아빠',
      region: '서울 강북구',
      date: daysFromNow(5),
      capacity: 15,
      participantCount: 9,
      description:
        '무리하지 않는 코스로 3시간 정도 걷고, 근처에서 같이 점심 먹어요.',
      category: '등산',
    },
    {
      id: 'm-2',
      title: '한강 벚꽃길 사진 산책',
      hostId: 'u-3',
      hostName: '순자쌤',
      region: '서울 마포구',
      date: daysFromNow(10),
      capacity: 10,
      participantCount: 4,
      description: '스마트폰 사진 찍는 법도 서로 알려드려요.',
      category: '여행',
    },
    {
      id: 'm-3',
      title: '동네 국수집 점심 모임',
      hostId: 'u-me',
      hostName: '정순씨',
      region: '서울 마포구',
      date: daysFromNow(2),
      capacity: 6,
      participantCount: 3,
      description: '편하게 만나서 국수 한 그릇 하고 수다 떨어요.',
      category: '식사',
    },
  ];

  const discussions: Discussion[] = [
    {
      id: 'd-1',
      category: '건강',
      title: '무릎 관절에 좋은 운동 뭐가 있을까요?',
      content:
        '요즘 계단 오르내릴 때 무릎이 시큰거려서요. 다들 어떤 운동 하시나요?',
      isAnonymous: false,
      userId: 'u-2',
      authorLabel: '영식아빠',
      createdAt: daysAgo(1),
      replyCount: 5,
    },
    {
      id: 'd-2',
      category: '재테크',
      title: '연금 받으면서 소소하게 용돈벌이 하시는 분 계신가요',
      content: '이야기 나누고 싶은데 조심스러워서 익명으로 올려봅니다.',
      isAnonymous: true,
      userId: 'u-3',
      authorLabel: '익명',
      createdAt: daysAgo(3),
      replyCount: 8,
    },
    {
      id: 'd-3',
      category: '일상',
      title: '요즘 손주 보는 재미로 삽니다',
      content: '다들 손주 자랑 좀 해보세요 ㅎㅎ',
      isAnonymous: false,
      userId: 'u-me',
      authorLabel: '정순씨',
      createdAt: daysAgo(0),
      replyCount: 3,
    },
  ];

  const qnaList: Qna[] = [
    {
      id: 'q-1',
      question: '카카오톡 사진 여러 장을 한 번에 저장하려면 어떻게 하나요?',
      answer:
        '사진을 길게 눌러서 선택 모드로 바꾼 뒤, 원하는 사진들을 다 고르고 아래 저장 버튼을 누르시면 됩니다.',
      isResolved: true,
      userId: 'u-3',
      authorName: '순자쌤',
      createdAt: daysAgo(4),
    },
    {
      id: 'q-2',
      question: '이 앱에서 모임 만들 때 참가비도 받을 수 있나요?',
      answer: null,
      isResolved: false,
      userId: 'u-2',
      authorName: '영식아빠',
      createdAt: daysAgo(1),
    },
  ];

  return {
    users,
    communities,
    allCategories,
    popularCategories,
    posts,
    comments,
    meetups,
    discussions,
    qnaList,
  };
}

// Next.js가 Server Action용 번들과 페이지 렌더링용 번들을 따로 컴파일해도, 같은
// Node 프로세스라면 globalThis 는 하나뿐입니다 — 그 위에 데이터를 올려두면 어느
// 번들에서 이 파일을 import 하든 항상 같은 배열 인스턴스를 공유하게 됩니다.
const GLOBAL_KEY = '__meomuroom_mock_db__';
type GlobalWithMockDB = typeof globalThis & { [GLOBAL_KEY]?: MockDB };
const globalForMockDb = globalThis as GlobalWithMockDB;

const db = globalForMockDb[GLOBAL_KEY] ?? (globalForMockDb[GLOBAL_KEY] = createInitialDB());

export const currentUser: User = db.users[0];
export const users: User[] = db.users;
export const communities: Community[] = db.communities;
export const ALL_CATEGORIES: string[] = db.allCategories;
export const POPULAR_CATEGORIES: string[] = db.popularCategories;
export const posts: Post[] = db.posts;
export const comments: Comment[] = db.comments;
export const meetups: Meetup[] = db.meetups;
export const discussions: Discussion[] = db.discussions;
export const qnaList: Qna[] = db.qnaList;
