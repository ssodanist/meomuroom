'use client';

import { useEffect } from 'react';

// 가입 직후 딱 이 화면 하나만 거쳐 갑니다. 로그인 여부를 확인하지 않는
// 화면이라, 방금 만든 세션 쿠키가 브라우저에 확실히 저장된 다음 홈으로
// 완전히 새로 이동합니다 (그래서 router.push가 아니라 location.href를 씁니다).
export default function OnboardingCompletePage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = '/';
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-4xl">🌿</span>
      <p className="text-2xl font-extrabold text-ink-900">가입이 완료됐어요!</p>
      <p className="text-lg text-ink-700/70">머무름으로 이동할게요…</p>
    </div>
  );
}
