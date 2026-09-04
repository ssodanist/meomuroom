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
      <body>
        <div className="container-page pb-24">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
