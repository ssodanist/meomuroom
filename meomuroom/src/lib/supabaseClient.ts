import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase 환경변수가 아직 설정되지 않았다면 null을 반환합니다.
// 이 경우 앱의 각 페이지는 lib/data 의 목업 데이터로 동작합니다.
// .env.example 을 .env.local 로 복사하고 값을 채운 뒤,
// supabase/schema.sql 을 Supabase SQL Editor에서 실행하면
// lib/data 의 함수들을 실제 supabase 쿼리로 교체해 사용할 수 있습니다.
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const isSupabaseConfigured = Boolean(supabase);
