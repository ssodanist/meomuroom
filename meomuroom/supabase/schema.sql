-- 머무름(시니어 네트워킹 플랫폼) Supabase 스키마
-- Supabase 프로젝트의 SQL Editor에서 그대로 실행하세요.
-- 프롬프트 스펙의 스코프 락을 그대로 반영: 결제/실시간채팅/관리자 테이블 없음.

create extension if not exists "pgcrypto";

-- 사용자 프로필 (auth.users 확장)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  nickname text not null,
  avatar_url text,
  region text,
  membership_tier text not null default 'free' check (membership_tier in ('free', 'premium')),
  checkin_interval_hours integer not null default 24,
  last_active_at timestamptz not null default now(),
  guardian_contact text,
  -- 회원이 등록한 관심 주제. 기본 제공 50개 주제 + 회원이 검색 후 직접 추가한
  -- 주제까지 자유롭게 담을 수 있도록 배열로 저장합니다 (communities.category와 매칭).
  interests text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- 관심사 커뮤니티
-- category는 자유 텍스트입니다: 기본 제공 50개 주제 외에, 회원이 검색해도 못 찾으면
-- 화면에서 직접 새 주제를 추가할 수 있어 고정된 목록(check 제약)을 두지 않습니다.
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  created_at timestamptz not null default now()
);

-- 참고: 커뮤니티 화면의 '회원 수'는 이 테이블의 행 수(count)로 계산합니다.
-- (목업 데이터에서는 편의상 Community.memberCount 필드에 숫자를 직접 넣어뒀습니다.)
create table if not exists public.community_members (
  user_id uuid references public.users(id) on delete cascade,
  community_id uuid references public.communities(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (user_id, community_id)
);

-- 게시글 / 댓글
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.communities(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  content text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

-- 오프라인 모임
create table if not exists public.meetups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  host_id uuid references public.users(id) on delete set null,
  region text not null,
  date timestamptz not null,
  capacity integer not null default 10,
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
  created_at timestamptz not null default now()
);

-- Q&A 게시판
create table if not exists public.qna (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text,
  is_resolved boolean not null default false,
  user_id uuid references public.users(id) on delete set null,
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
