import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import CoverTile from '@/components/CoverTile';
import { Input } from '@/components/FormField';
import { getCommunities, getPopularCategories, requireCurrentUser } from '@/lib/data';
import { addCustomCommunityAction, toggleInterestAction } from '@/lib/actions';

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: { query?: string; myOnly?: string };
}) {
  const query = searchParams.query ?? '';
  const myOnly = searchParams.myOnly === '1';
  const user = await requireCurrentUser();
  const popularCategories = await getPopularCategories();
  const communities = await getCommunities({
    query,
    myOnly,
    interests: user.interests,
  });
  const total = (await getCommunities()).length;

  return (
    <div>
      <PageHeader title="관심사 커뮤니티" />

      <div className="px-5 pb-2 pt-4">
        <h2 className="text-xl font-bold text-ink-900">인기 주제로 관심사 등록하기</h2>
        <p className="mt-1 text-base text-ink-700/70">
          전체 {total}개 주제 중 가장 인기있는 주제예요. 눌러서 등록해보세요.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {popularCategories.map((cat) => {
            const on = user.interests.includes(cat);
            return (
              <form key={cat} action={toggleInterestAction}>
                <input type="hidden" name="category" value={cat} />
                <input type="hidden" name="query" value={query} />
                {myOnly ? <input type="hidden" name="myOnly" value="1" /> : null}
                <button
                  type="submit"
                  className={`min-h-touch rounded-full border-2 px-4 text-base font-bold ${
                    on
                      ? 'border-moss-500 bg-moss-500 text-white'
                      : 'border-moss-200 bg-white text-ink-900'
                  }`}
                >
                  {cat}
                  {on ? ' ✓' : ''}
                </button>
              </form>
            );
          })}
        </div>
      </div>

      <form className="flex gap-2 px-5 pt-4">
        {myOnly ? <input type="hidden" name="myOnly" value="1" /> : null}
        <Input
          type="text"
          name="query"
          defaultValue={query}
          placeholder="주제 검색 (예: 그라운드골프)"
        />
        <Button type="submit" variant="secondary" className="px-4 text-base">
          검색
        </Button>
      </form>

      <form action={addCustomCommunityAction} className="flex gap-2 px-5 pt-3">
        <Input type="text" name="category" placeholder="찾는 주제가 없다면 직접 적어주세요" />
        <Button type="submit" className="px-4 text-base">
          + 추가
        </Button>
      </form>

      <div className="px-5 pt-3">
        <Link
          href={{
            pathname: '/communities',
            query: { ...(query ? { query } : {}), ...(myOnly ? {} : { myOnly: '1' }) },
          }}
          className="text-base font-semibold text-moss-700"
        >
          {myOnly ? '전체 보기' : '내 관심사만 보기'}
        </Link>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {communities.length === 0 ? (
          <p className="py-8 text-center text-lg text-ink-700/50">
            {myOnly
              ? '등록한 관심사와 맞는 커뮤니티가 없어요. 위에서 관심사를 더 골라보세요.'
              : `'${query}'와 맞는 주제를 찾지 못했어요. 위에서 직접 추가해보세요.`}
          </p>
        ) : (
          communities.map((c) => {
            const mine = user.interests.includes(c.category);
            return (
              <Link key={c.id} href={`/communities/${c.id}`}>
                <Card className="flex gap-4 overflow-hidden p-0">
                  <CoverTile category={c.category} className="h-28 w-28" />
                  <div className="flex flex-1 flex-col justify-center py-3 pr-4">
                    <Badge tone={mine ? 'clay' : 'moss'}>{c.category}</Badge>
                    <p className="mt-1 text-lg font-bold text-ink-900">{c.name}</p>
                    <p className="mt-1 line-clamp-2 text-base text-ink-700/70">
                      {c.description}
                    </p>
                    <p className="mt-1 text-sm text-ink-700/50">
                      회원 {c.memberCount.toLocaleString()}명
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
