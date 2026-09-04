'use client';

import { useEffect } from 'react';

// 로그인 직후(방금 세션 쿠키가 만들어진 바로 그 요청) 곧바로 로그인 여부를
// 확인하는 화면(/, /mypage 등)으로 가면, 브라우저가 쿠키를 저장하기 전이라
// 다시 로그인 화면으로 튕겨나갈 수 있습니다. 인증을 확인하지 않는 이 화면을
// 한 번 거쳐, 쿠키가 확실히 저장된 뒤 완전히 새로 이동합니다.
export default function SessionContinueClient({ to }: { to: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = to;
    }, 200);
    return () => clearTimeout(timer);
  }, [to]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="text-4xl">🌿</span>
      <p className="text-lg text-ink-700/70">이동할게요…</p>
    </div>
  );
}
