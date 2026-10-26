import type { Metadata } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: '머무름 — 시니어를 위한 취미·모임 커뮤니티',
  description:
    '시니어들의 취미 공유, 모임, 자유로운 토론을 위한 따뜻한 공간, 머무름입니다.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* 본문용 Noto Sans KR + 인사말·헤드라인용 Gowun Batang(명조) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <div className="container-page pb-24">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
