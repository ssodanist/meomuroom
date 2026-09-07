import Link from 'next/link';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import CoverTile from '@/components/CoverTile';
import {
  getCommunities,
  getDiscussions,
  getMeetups,
  getRecentPosts,
  requireCurrentUser,
} from '@/lib/data';
import { POPULAR_CATEGORIES } from '@/lib/categories';

const QUICK_LINKS = [
  { href: '/communities', icon: '🌿', label: '커뮤니티 찾기' },
  { href: '/meetups/new', icon: '📅', label: '모임 만들기' },
  { href: '/discussions/new', icon: '💬', label: '토론 시작하기' },
  { href: '/qna/new', icon: '❓', label: '질문하기' },
] as const;

export default async function HomePage() {
  const user = await requireCurrentUser();
  const [meetups, communities, recentPosts, allDiscussions] = await Promise.all([
    getMeetups(),
    getCommunities(),
    getRecentPosts(3),
    getDiscussions(),
  ]);
  const upcomingMeetups = meetups.slice(0, 3);
  const hotDiscussions = allDiscussions
    .slice()
    .sort((a, b) => b.replyCount - a.replyCount)
    .slice(0, 2);

  const spotlightCommunities = POPULAR_CATEGORIES.map((cat) =>
    communities.find((c) => c.category === cat)
  ).filter((c): c is NonNullable<typeof c> => Boolean(c));

  const hasGuardian = Boolean(user.guardianContact);

  return (
    <div>
      <header className="px-5 pb-2 pt-6">
        <p className="text-lg text-ink-700/70">안녕하세요, 반가워요</p>
        <h1 className="text-3xl font-extrabold text-ink-900">
          {user.nickname}님 🌤️
        </h1>
      </header>

      {/* 안부 확인 — 이 앱의 핵심 안전 기능을 홈에서 바로 보여줍니다 */}
      <section className="px-5 pt-3">
        {hasGuardian ? (
          <Card className="bg-moss-50">
            <p className="text-base text-ink-900">
              🛡️ 오늘도 접속해주셔서 <strong>{user.guardianContact}</strong>{' '}
              보호자님께 안심 소식이 잘 전해지고 있어요.
            </p>
          </Card>
        ) : (
          <Card className="border-2 border-clay-300 bg-clay-100">
            <p className="text-base text-ink-900">
              💛 오래 접속이 없으면 가족·지인에게 자동으로 안부를 알려드릴 수
              있어요.
            </p>
            <Link
              href="/settings/checkin"
              className="mt-2 inline-block text-base font-bold text-clay-500 underline"
            >
              안부 확인 설정하러 가기 →
            </Link>
          </Card>
        )}
      </section>

      {/* 바로가기 — 무엇을 할 수 있는 앱인지 한눈에 */}
      <section className="px-5 pt-5">
        <div className="grid grid-cols-4 gap-2">
          {QUICK_LINKS.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="flex min-h-touch flex-col items-center justify-center gap-1 rounded-2xl bg-moss-50 py-3 text-center"
            >
              <span aria-hidden className="text-2xl">
                {q.icon}
              </span>
              <span className="text-sm font-bold leading-tight text-ink-900">
                {q.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 인기 커뮤니티 둘러보기 — 50개가 넘는 취미 커뮤니티의 규모를 한눈에 보여줍니다 */}
      <section className="pt-6">
        <div className="flex items-center justify-between px-5">
          <h2 className="text-xl font-bold text-ink-900">인기 커뮤니티 둘러보기</h2>
          <Link href="/communities" className="font-semibold text-moss-700">
            전체 {communities.length}개 보기
          </Link>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-1">
          {spotlightCommunities.map((c) => (
            <Link
              key={c.id}
              href={`/communities/${c.id}`}
              className="flex w-20 shrink-0 flex-col items-center gap-1"
            >
              <CoverTile
                category={c.category}
                className="h-16 w-16 rounded-2xl"
                iconClassName="text-2xl"
              />
              <span className="line-clamp-1 text-center text-sm font-semibold text-ink-900">
                {c.category}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink-900">다가오는 모임</h2>
          <Link href="/meetups" className="font-semibold text-moss-700">
            더보기
          </Link>
        </div>
        {upcomingMeetups.length === 0 ? (
          <p className="mt-3 text-base text-ink-700/50">
            아직 등록된 모임이 없어요. 첫 모임을 만들어보세요.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {upcomingMeetups.map((m) => (
              <Link key={m.id} href={`/meetups/${m.id}`}>
                <Card className="flex items-center justify-between">
                  <div>
                    <Badge>{m.category}</Badge>
                    <p className="mt-2 text-lg font-bold text-ink-900">
                      {m.title}
                    </p>
                    <p className="mt-1 text-base text-ink-700/70">
                      {new Date(m.date).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                      })}
                      · {m.region} · 참가 {m.participantCount}/{m.capacity}명
                    </p>
                  </div>
                  <span className="text-2xl">→</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink-900">커뮤니티 새 소식</h2>
          <Link href="/communities" className="font-semibold text-moss-700">
            더보기
          </Link>
        </div>
        {recentPosts.length === 0 ? (
          <p className="mt-3 text-base text-ink-700/50">
            아직 올라온 글이 없어요. 관심 있는 커뮤니티에 첫 글을 남겨보세요.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {recentPosts.map((post) => {
              const community = communities.find((c) => c.id === post.communityId);
              return (
                <Link key={post.id} href={`/posts/${post.id}`}>
                  <Card>
                    <div className="flex items-center gap-2">
                      <img
                        src={post.authorAvatar}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-ink-900">{post.authorName}</p>
                        <p className="text-sm text-ink-700/60">
                          {community?.name}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-lg text-ink-900">
                      {post.content}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {hotDiscussions.length > 0 ? (
        <section className="px-5 pb-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink-900">지금 뜨거운 토론</h2>
            <Link href="/discussions" className="font-semibold text-moss-700">
              더보기
            </Link>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {hotDiscussions.map((d) => (
              <Link key={d.id} href={`/discussions/${d.id}`}>
                <Card>
                  <Badge tone="clay">{d.category}</Badge>
                  <p className="mt-2 line-clamp-1 text-lg font-bold text-ink-900">
                    {d.title}
                  </p>
                  <p className="mt-1 text-base text-ink-700/70">
                    {d.authorLabel} · 답변 {d.replyCount}개
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
