// 서버 전용 Supabase 클라이언트 (Service Role Key 사용)
//
// 이 프로젝트는 실제 카카오/네이버 로그인 대신 lib/session.ts 의 쿠키로 로그인
// 상태를 흉내내고 있어서, Supabase Auth의 JWT(auth.uid())가 없습니다. 그래서
// schema.sql의 Row Level Security 정책(auth.uid() = user_id 등)을 만족시킬 수
// 없고, 대신 이 Service Role 클라이언트로 RLS를 우회해 서버(Server Action /
// Server Component)에서만 데이터를 읽고 씁니다. 이 파일은 절대 클라이언트
// 컴포넌트에서 import 하면 안 됩니다 — 이 프로젝트는 모든 화면이 Server
// Component이므로 원래부터 이 파일을 브라우저로 보낼 일이 없습니다.
//
// 인증 방식이 실제 Supabase Auth(카카오/네이버 Provider)로 바뀌면, 그때는
// 사용자 자신의 요청은 anon key + 사용자 세션 토큰으로 처리하고, 이 admin
// 클라이언트는 회원가입 시 auth.users 행을 만드는 등 관리자 작업에만 남겨두면
// 됩니다.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && serviceRoleKey);

let cachedClient: SupabaseClient | null = null;

// 환경변수가 없으면 함수를 호출하는 시점에 알아보기 쉬운 한국어 에러를 던집니다
// (빌드 자체는 막지 않고, 실제로 DB에 접근하는 요청에서만 실패합니다).
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      '[머무름] Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)가 설정되지 않았습니다. ' +
        '.env.local(로컬) 또는 Netlify 환경변수 설정에 값을 추가한 뒤 다시 시도해주세요.'
    );
  }
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return cachedClient;
}
