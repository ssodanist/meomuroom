import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { getMeetups } from '@/lib/data';

export default async function MeetupsPage({
  searchParams,
}: {
  searchParams: { region?: string };
}) {
  const meetups = await getMeetups(searchParams.region);

  return (
    <div>
      <PageHeader
        title="오프라인 모임"
        action={
          <Link href="/meetups/new">
            <Button className="px-4 text-base">+ 모임 만들기</Button>
          </Link>
        }
      />

      <form className="flex gap-2 px-5 pt-4">
        <input
          type="text"
          name="region"
          defaultValue={searchParams.region ?? ''}
          placeholder="지역으로 찾기 (예: 마포구)"
          className="min-h-touch flex-1 rounded-xl border-2 border-moss-200 bg-white px-4 text-lg outline-none focus:border-moss-500"
        />
        <Button type="submit" variant="secondary" className="px-4 text-base">
          검색
        </Button>
      </form>

      <div className="flex flex-col gap-4 p-5">
        {meetups.length === 0 ? (
          <p className="py-8 text-center text-lg text-ink-700/50">
            해당 지역의 모임이 아직 없어요.
          </p>
        ) : (
          meetups.map((m) => (
            <Link key={m.id} href={`/meetups/${m.id}`}>
              <Card>
                <Badge tone="clay">{m.category}</Badge>
                <p className="mt-2 text-lg font-bold text-ink-900">{m.title}</p>
                <p className="mt-1 text-base text-ink-700/70">
                  {new Date(m.date).toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                  })}{' '}
                  · {m.region}
                </p>
                <p className="mt-2 text-base text-ink-700/60">
                  참가 {m.participantCount}/{m.capacity}명 · 주최 {m.hostName}
                </p>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
