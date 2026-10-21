import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import CoverTile from '@/components/CoverTile';
import { getCommunityById, getPostsByCommunity } from '@/lib/data';

export default async function CommunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const community = await getCommunityById(params.id);
  if (!community) notFound();
  const posts = await getPostsByCommunity(params.id);

  return (
    <div>
      <PageHeader title={community.name} backHref="/communities" />
      <CoverTile
        category={community.category}
        className="h-40 w-full"
        iconClassName="text-5xl"
      />
      <div className="px-5 py-4">
        <Badge>{community.category}</Badge>
        <p className="mt-2 text-lg text-ink-900">{community.description}</p>
        <p className="mt-1 text-base text-ink-700/60">
          회원 {community.memberCount.toLocaleString()}명
        </p>

        <div className="mt-4">
          <Link href={`/communities/${community.id}/posts/new`}>
            <Button fullWidth>✍️ 이야기 남기기</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 pb-8">
        {posts.length === 0 ? (
          <p className="py-8 text-center text-lg text-ink-700/50">
            아직 올라온 이야기가 없어요. 첫 이야기를 남겨보세요!
          </p>
        ) : (
          posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <Card>
                <div className="flex items-center gap-2">
                  <img
                    src={post.authorAvatar}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <p className="font-bold text-ink-900">{post.authorName}</p>
                </div>
                <p className="mt-3 line-clamp-3 text-lg text-ink-900">
                  {post.content}
                </p>
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="mt-3 h-40 w-full rounded-xl object-cover"
                  />
                ) : null}
                <p className="mt-3 text-base text-ink-700/50">
                  댓글 {post.commentCount}개
                </p>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
