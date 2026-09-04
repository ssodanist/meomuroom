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

Supabase를 연결하지 않아도 목업 데이터로 모든 화면과 로그인/회원가입/로그아웃/탈퇴, 글쓰기/
댓글/모임 만들기/참가 신청/안부 설정/Q&A 답변 기능이 실제로 동작합니다 (서버가 켜져 있는
동안 메모리에 저장됩니다 — 아래 "로그인 / 회원가입" 항목 참고).

## Supabase 연결하기 (실서비스 전환)

1. [supabase.com](https://supabase.com) 에서 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase/schema.sql` 내용을 그대로 실행합니다.
3. `.env.example` 을 `.env.local` 로 복사하고, Supabase 프로젝트의 URL과 anon key를 입력합니다.
4. `src/lib/data.ts` 의 각 함수 안을 Supabase 쿼리로 교체합니다. 테이블/컬럼 이름은
   `schema.sql` 과 동일하게 맞춰뒀기 때문에 그대로 옮기면 됩니다. (`src/lib/supabaseClient.ts` 의
   `supabase` 클라이언트를 사용)
5. 카카오/네이버 소셜 로그인은 Supabase Auth Provider로 교체합니다 (아래 "로그인 / 회원가입"
   항목과 `supabase/schema.sql` 맨 아래 체크리스트 참고). 본인인증(실명·생년 확인)은
   PASS 등 별도 본인인증 API를 붙여 `verifyIdentity()` 내부만 교체하면 됩니다.

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

## 로그인 / 회원가입 (2026-09 추가)

시니어 이용 패턴 조사(카카오톡·네이버 의존도가 높고, 아이디/비밀번호를 새로 만들고
외우는 것을 부담스러워함)를 바탕으로 설계했습니다. 지금은 `src/lib/session.ts` 의
쿠키로 아래 흐름을 그대로 흉내내고 있고, 실제 Supabase Auth로 교체해도 화면/액션
코드는 거의 그대로 쓸 수 있도록 짜뒀습니다.

- **원버튼 소셜 로그인**: 카카오(`#FEE500`)·네이버(`#03C75A`) 브랜드 색 그대로의 큰
  버튼 하나로 로그인/가입을 겸합니다 (`/login`, `startLoginAction`). 이 브라우저가 이미
  그 계정과 연결된 적이 있으면 바로 로그인하고, 처음이면 회원가입으로 넘어갑니다.
- **문자(SMS) 예비 로그인**: 카카오·네이버 계정이 없는 소수를 위한 대체 경로입니다
  (`/login/sms`). 데모에서는 인증번호가 항상 `123456` 으로 고정되어 있습니다.
- **본인인증 → 최소 정보만 수집**: 최초 가입 시 실명·생년만 한 번 확인하고
  (`/onboarding/verify`, PASS 연동 예정 지점), 화면에는 절대 노출하지 않습니다. 이어지는
  프로필 단계(`/onboarding`)에서는 **별명·지역·성별(선택)** 만 입력받고, 실명은 서버에만,
  나이는 연배 그룹(50대/60대/70대 이상)으로만 화면에 보여줍니다.
- **눈에 띄는 로그아웃**: 마이페이지 상단에 항상 보이는 로그아웃 버튼 하나로 즉시
  로그아웃됩니다 (`logoutAction`). 소셜 연결은 남아있어 다음에 버튼 한 번으로 재로그인됩니다.
- **자유로운 탈퇴 + 30일 복구**: 이유를 묻는 설문 없이 확인 한 번으로 탈퇴할 수 있고
  (`/settings/withdraw`), 데이터는 30일간 보관되어 그 안에 같은 방법으로 다시 로그인하면
  자동으로 복구됩니다 (`withdrawAction`, `WITHDRAW_RESTORE_WINDOW_DAYS`).
- **오래 유지되는 로그인**: 세션 쿠키를 180일간 유지해 시니어가 앱을 열 때마다 다시
  로그인할 필요가 없도록 했습니다.
- 보호된 화면은 `src/middleware.ts` 가 세션 쿠키 유무로 1차 차단하고, 각 페이지에서
  `requireCurrentUser()` 로 한 번 더 확인합니다.

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
| 로그인 / 문자(SMS) 로그인 | `/login`, `/login/sms` |
| 본인인증 / 가입 완료 화면 | `/onboarding/verify`, `/onboarding/complete` |
| 탈퇴 | `/settings/withdraw` |

## 스코프 락 (의도적으로 포함하지 않은 것)

다크모드, 결제 실연동(PG), 실시간 채팅/DM, AI 챗봇, 관리자 대시보드, 다국어 지원. 필요해지면
이 README 상단의 Supabase 연결 단계를 먼저 마친 뒤 추가하는 것을 권장합니다.

## 다음 단계로 추천하는 작업

1. 위 "로그인 / 회원가입"의 카카오·네이버·SMS 목업을 Supabase Auth Provider +
   PASS 본인인증 API로 교체하기 (`supabase/schema.sql` 맨 아래 체크리스트 참고)
2. 지역 기반 모임 검색에 실제 주소 검색 API 연동 (카카오맵 등)
3. 안부 확인 알림을 Supabase Edge Function + Cron으로 실제 발송 (SMS/알림톡 연동)
4. 이미지 업로드를 URL 입력 대신 Supabase Storage 업로드로 교체
5. 회원 수를 목업 필드(`memberCount`) 대신 `community_members` 실제 가입 데이터로 집계
