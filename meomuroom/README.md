# 머무름 (meomuroom)

한국 시니어(50~70대 이상)를 위한 취미 공유·모임·자유토론 커뮤니티 플랫폼 MVP입니다.
"한국의 시니어 시장 현황" 리포트에서 정리한 핵심 기능 제안(취미 커뮤니티, 오프라인 모임 연계,
자유토론/Q&A, 안부 확인, 시니어 친화 UI, 멤버십)을 그대로 반영해 만들었습니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속하세요.

Supabase를 연결하지 않아도 목업 데이터로 모든 화면과 글쓰기/댓글/모임 만들기/참가 신청/
안부 설정/Q&A 답변 기능이 실제로 동작합니다 (서버가 켜져 있는 동안 메모리에 저장됩니다).

## Supabase 연결하기 (실서비스 전환)

1. [supabase.com](https://supabase.com) 에서 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase/schema.sql` 내용을 그대로 실행합니다.
3. `.env.example` 을 `.env.local` 로 복사하고, Supabase 프로젝트의 URL과 anon key를 입력합니다.
4. `src/lib/data.ts` 의 각 함수 안을 Supabase 쿼리로 교체합니다. 테이블/컬럼 이름은
   `schema.sql` 과 동일하게 맞춰뒀기 때문에 그대로 옮기면 됩니다. (`src/lib/supabaseClient.ts` 의
   `supabase` 클라이언트를 사용)
5. 카카오 소셜 로그인은 Supabase Auth의 Kakao Provider를 설정한 뒤 로그인 페이지를 추가하세요
   (이번 MVP에는 로그인 화면 자체는 포함하지 않았습니다 — `currentUser` 로 항상 로그인된 상태로 동작).

## 기술 스택

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (베이지·그린 파스텔 팔레트, 본문 18px 이상, 터치 영역 48px 이상)
- Supabase 스키마 준비 완료 (Auth / Database / Storage) — 연결 전에는 메모리 목업 데이터 사용
- Server Actions로 글쓰기/댓글/모임 만들기/참가 신청/안부 설정/Q&A 답변 처리

## 관심사 커뮤니티 (2026-09 업데이트)

- 기본 제공 주제를 17개 → **50개**로 확장했습니다 (파크골프·그라운드골프·게이트볼·라인댄스·
  노래교실(트로트)·스마트폰활용 등 최신 시니어 트렌드 조사를 반영, `src/lib/mockData.ts`의
  `communities` 배열).
- 화면에는 회원 수(=관심도) 기준 **상위 14개만 "인기 주제" 칩**으로 보여주고, 나머지 주제는
  **검색**으로 찾도록 했습니다 (`getPopularCategories`, `getCommunities({ query })`).
- 원하는 주제가 검색에도 없으면 **직접 추가**할 수 있습니다 (`addCustomCommunityAction`) —
  이렇게 추가된 주제는 그 즉시 전체 목록과 본인 관심사에 반영됩니다. 이를 위해 카테고리를
  고정된 값 목록이 아닌 자유 텍스트로 바꿨고(`CommunityCategory = string`), Supabase 스키마의
  `communities.category` CHECK 제약도 제거했습니다.
- 온보딩 2단계와 커뮤니티 화면의 칩을 누르면 **내 관심사**로 등록/해제되고
  (`toggleInterestAction`, `finishOnboardingAction`), 마이페이지에는 등록한 관심사 칩과
  그에 맞는 **"맞춤 커뮤니티"** 목록이 나옵니다.
- 커뮤니티 표지는 실제 사진 대신 주제별 아이콘 타일(`CoverTile` 컴포넌트,
  `src/lib/categories.ts`)로 통일해, 50개 넘는 주제 전부에 이미지 없이도 일관된 느낌을 줍니다.

## 페이지 구성

| 페이지 | 경로 |
|---|---|
| 홈 피드 | `/` |
| 온보딩 (3단계, 인기 주제 관심사 등록) | `/onboarding` |
| 커뮤니티 목록(검색·관심사 등록·직접 추가) / 상세 | `/communities`, `/communities/[id]` |
| 게시글 작성 / 상세 | `/communities/[id]/posts/new`, `/posts/[id]` |
| 오프라인 모임 목록 / 상세 | `/meetups`, `/meetups/[id]` |
| 모임 만들기 | `/meetups/new` |
| 자유토론 게시판 / 글쓰기 / 상세 | `/discussions`, `/discussions/new`, `/discussions/[id]` |
| Q&A | `/qna`, `/qna/new`, `/qna/[id]` |
| 안부 확인 설정 | `/settings/checkin` |
| 마이페이지 | `/mypage` |

## 스코프 락 (의도적으로 포함하지 않은 것)

다크모드, 결제 실연동(PG), 실시간 채팅/DM, AI 챗봇, 관리자 대시보드, 다국어 지원, 카카오 외
소셜 로그인. 필요해지면 이 README 상단의 Supabase 연결 단계를 먼저 마친 뒤 추가하는 것을
권장합니다.

## 다음 단계로 추천하는 작업

1. Supabase Auth(이메일 + 카카오)로 실제 로그인/회원가입 붙이기
2. 지역 기반 모임 검색에 실제 주소 검색 API 연동 (카카오맵 등)
3. 안부 확인 알림을 Supabase Edge Function + Cron으로 실제 발송 (SMS/알림톡 연동)
4. 이미지 업로드를 URL 입력 대신 Supabase Storage 업로드로 교체
5. 회원 수를 목업 필드(`memberCount`) 대신 `community_members` 실제 가입 데이터로 집계
