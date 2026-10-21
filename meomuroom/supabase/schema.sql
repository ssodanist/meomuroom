-- 머무름(시니어 네트워킹 플랫폼) Supabase 스키마
-- Supabase 프로젝트의 SQL Editor에서 그대로 실행하세요.
-- 프롬프트 스펙의 스코프 락을 그대로 반영: 결제/실시간채팅/관리자 테이블 없음.

create extension if not exists "pgcrypto";

-- 사용자 프로필 (auth.users 확장)
--
-- 로그인/가입 방식: 카카오·네이버 소셜 로그인(Supabase Auth Provider)을 기본으로 하고,
-- 소셜 계정이 없는 소수를 위해 문자(SMS/OTP) 로그인을 예비 경로로 둡니다.
-- name(실명)은 본인인증(PASS 등)에서 한 번만 확인해 서버에만 남기고 화면에는 절대
-- 노출하지 않습니다 — 화면에는 nickname만 보여줍니다. 나이도 verified_birth_year를
-- 직접 보여주지 않고 age_group(50대/60대/70대 이상)으로만 노출합니다.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null, -- 본인인증으로 확인한 실명. 화면에는 절대 노출하지 않음(서버 전용).
  nickname text not null, -- 화면에 보여지는 이름은 이것만 사용.
  avatar_url text,
  region text,
  membership_tier text not null default 'free' check (membership_tier in ('free', 'premium')),
  checkin_interval_hours integer not null default 24,
  last_active_at timestamptz not null default now(),
  guardian_contact text,
  -- 회원이 등록한 관심 주제. 기본 제공 50개 주제 + 회원이 검색 후 직접 추가한
  -- 주제까지 자유롭게 담을 수 있도록 배열로 저장합니다 (communities.category와 매칭).
  interests text[] not null default '{}',
  -- ---- 인증/가입 관련 (2026-09 추가) ----
  auth_provider text not null default 'kakao' check (auth_provider in ('kakao', 'naver', 'sms')),
  social_id text unique, -- 카카오/네이버가 내려주는 고유 계정 ID, 또는 SMS 로그인의 전화번호 기반 식별자.
  verified_birth_year integer, -- 본인인증에서 확인한 생년. 화면 노출 금지, age_group 계산에만 사용.
  age_group text check (age_group in ('50대', '60대', '70대 이상')), -- verified_birth_year로 계산해 저장.
  gender_display text not null default '비공개' check (gender_display in ('남성', '여성', '비공개')),
  is_withdrawn boolean not null default false, -- 탈퇴 여부(소프트 삭제). 완전 삭제 대신 30일 복구 유예를 둠.
  withdrawn_at timestamptz, -- 탈퇴 시각. 이 시점으로부터 30일 이내 재로그인하면 is_withdrawn=false로 복구.
  created_at timestamptz not null default now()
);

alter table public.users alter column guardian_contact set default '';

-- 탈퇴 후 30일 이내 같은 소셜 계정(social_id)으로 재로그인하면 계정을 그대로
-- 복구합니다 (완전 삭제가 아니라 is_withdrawn 플래그로만 표시했기 때문에 가능).
-- 30일이 지난 뒤에는 별도의 정리(cron) 작업으로 완전 삭제하거나 비식별화하는 것을
-- 권장합니다(개인정보보호법상 탈퇴 회원 데이터 보관 기한 준수).

-- 관심사 커뮤니티
-- category는 자유 텍스트입니다: 기본 제공 50개 주제 외에, 회원이 검색해도 못 찾으면
-- 화면에서 직접 새 주제를 추가할 수 있어 고정된 목록(check 제약)을 두지 않습니다.
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null unique, -- 카테고리 이름으로 중복 생성을 막습니다 (seed.sql의 upsert 기준).
  description text,
  -- 화면에 보여주는 '회원 수'입니다. 실제 가입자 수를 세는 대신, 초기 시드 데이터의
  -- 규모감을 그대로 유지하기 위해 숫자를 직접 저장해두는 방식을 택했습니다
  -- (community_members 테이블은 나중에 실제 가입 기능을 붙일 때를 위해 남겨둡니다).
  member_count integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.community_members (
  user_id uuid references public.users(id) on delete cascade,
  community_id uuid references public.communities(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (user_id, community_id)
);

-- 게시글 / 댓글
-- author_name/author_avatar/comment_count는 users 테이블과 매번 join하지 않도록
-- 작성 시점의 별명·사진을 그대로 복사해두는 값입니다(작성 후 별명을 바꿔도
-- 이미 쓴 글의 표시 이름은 바뀌지 않습니다 — 흔한 커뮤니티 서비스와 동일한 방식).
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.communities(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  author_name text not null,
  author_avatar text,
  content text not null,
  image_url text,
  comment_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  author_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- 오프라인 모임
create table if not exists public.meetups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  host_id uuid references public.users(id) on delete set null,
  host_name text not null,
  region text not null,
  date timestamptz not null,
  capacity integer not null default 10,
  participant_count integer not null default 1,
  description text,
  category text not null check (category in ('등산','여행','식사','클래스','동창회','스터디')),
  created_at timestamptz not null default now()
);

create table if not exists public.meetup_participants (
  meetup_id uuid references public.meetups(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  status text not null default 'joined' check (status in ('joined','waiting')),
  joined_at timestamptz not null default now(),
  primary key (meetup_id, user_id)
);

-- 자유토론 게시판 (익명 옵션 포함)
create table if not exists public.discussions (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('사회이슈','건강','재테크','여행','일상')),
  title text not null,
  content text not null,
  is_anonymous boolean not null default false,
  user_id uuid references public.users(id) on delete set null,
  author_label text not null, -- 익명 글이면 '익명', 아니면 작성 시점의 별명.
  reply_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Q&A 게시판
create table if not exists public.qna (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text,
  is_resolved boolean not null default false,
  user_id uuid references public.users(id) on delete set null,
  author_name text not null,
  created_at timestamptz not null default now()
);

-- 안부 확인: last_active_at + checkin_interval_hours 를 주기적으로 검사해
-- 초과 시 guardian_contact 로 알림을 보내는 Supabase Edge Function(cron)에서 사용합니다.
-- 이 스키마에는 알림 발송 로직 자체는 포함하지 않습니다 (스텁).

alter table public.users enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.meetups enable row level security;
alter table public.meetup_participants enable row level security;
alter table public.discussions enable row level security;
alter table public.qna enable row level security;

-- 기본 정책: 로그인한 사용자는 읽기 가능, 본인 데이터만 쓰기 가능
create policy "누구나 읽기 가능 - users" on public.users for select using (true);
create policy "본인만 수정 - users" on public.users for update using (auth.uid() = id);

create policy "누구나 읽기 가능 - communities" on public.communities for select using (true);
create policy "로그인 사용자 생성 - communities" on public.communities for insert with check (auth.uid() is not null);
create policy "누구나 읽기 가능 - posts" on public.posts for select using (true);
create policy "로그인 사용자 작성 - posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "누구나 읽기 가능 - comments" on public.comments for select using (true);
create policy "로그인 사용자 작성 - comments" on public.comments for insert with check (auth.uid() = user_id);

create policy "누구나 읽기 가능 - meetups" on public.meetups for select using (true);
create policy "로그인 사용자 개설 - meetups" on public.meetups for insert with check (auth.uid() = host_id);
create policy "누구나 읽기 가능 - meetup_participants" on public.meetup_participants for select using (true);
create policy "본인 참가 신청 - meetup_participants" on public.meetup_participants for insert with check (auth.uid() = user_id);

create policy "누구나 읽기 가능 - discussions" on public.discussions for select using (true);
create policy "로그인 사용자 작성 - discussions" on public.discussions for insert with check (auth.uid() = user_id);

create policy "누구나 읽기 가능 - qna" on public.qna for select using (true);
create policy "로그인 사용자 작성 - qna" on public.qna for insert with check (auth.uid() = user_id);

-- ============================================================
-- 실제 카카오/네이버 로그인 + 본인인증(PASS) 연동 시 체크리스트
-- (지금은 lib/session.ts 의 쿠키로 이 흐름을 흉내내고 있습니다)
-- ============================================================
-- 1) Supabase 대시보드 > Authentication > Providers 에서 Kakao Provider를 켜고
--    카카오 개발자 콘솔에서 발급받은 REST API 키 / Client Secret을 등록합니다.
--    네이버는 Supabase 기본 제공 Provider가 아니므로, 네이버 개발자센터의
--    OAuth 콜백을 Supabase의 Custom OAuth(또는 자체 Edge Function)로 감싸서
--    supabase.auth.signInWithOAuth() 가 기대하는 형태로 연결해야 합니다.
-- 2) 문자(SMS) 로그인은 Supabase Auth의 Phone(OTP) 로그인을 그대로 사용하면
--    됩니다 (Twilio/알리고 등 SMS 공급자 연동 필요). 지금 데모의 "123456"
--    고정 인증번호는 이 SMS 공급자의 실제 OTP 발송/검증으로 교체됩니다.
-- 3) 본인인증(실명·생년 확인)은 카카오/네이버 로그인 자체와는 별개입니다.
--    한국 서비스는 보통 PASS(통신 3사 본인확인) 또는 나이스평가정보 등의
--    본인인증 API를 별도로 붙입니다 — 로그인 성공 후, 위 verify 단계에서
--    이 API 호출 결과(실명/생년)로 users.name, verified_birth_year를 채웁니다.
-- 4) 로그인 성공 시 위 소셜/본인인증 결과로 public.users 행을 upsert하고,
--    age_group은 verified_birth_year 확정 시점에 한 번 계산해 저장(또는 뷰로 계산).
-- 5) 탈퇴(is_withdrawn)는 완전 삭제가 아니므로, 30일 경과 후 실제로 개인정보를
--    지우거나 비식별화하는 배치(Supabase Cron/Edge Function)를 별도로 둬야 합니다.
