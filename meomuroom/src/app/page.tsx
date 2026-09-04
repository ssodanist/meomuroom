import Link from 'next/link';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import { getMeetups, requireCurrentUser } from '@/lib/data';
import { communities, posts } from '@/lib/mockData';

export default async function HomePage() {
  const user = await requireCurrentUser();
  const meetups = (await getMeetups()).slice(0, 2);
  const recentPosts = [...posts]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 3);

  return (
    <div>
      <header className="px-5 pb-2 pt-6">
        <p className="text-lg text-ink-700/70">안녕하세요, 반가워요</p>
        <h1 className="text-3xl font-extrabold text-ink-900">
          {user.nickname}님 🌤️
        </h1>
      </header>

      <section className="px-5 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink-900">다가오는 모임</h2>
          <Link href="/meetups" className="font-semibold text-moss-700">
            더보기
          </Link>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {meetups.map((m) => (
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
                    · {m.region}
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 pb-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink-900">커뮤니티 새 소식</h2>
          <Link href="/communities" className="font-semibold text-moss-700">
            더보기
          </Link>
        </div>
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
      </section>
    </div>
  );
}
