import { notFound } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Textarea } from '@/components/FormField';
import { getCommentsByPost, getCommunityById, getPostById } from '@/lib/data';
import { createCommentAction } from '@/lib/actions';

export default async function PostDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await getPostById(params.id);
  if (!post) notFound();
  const community = await getCommunityById(post.communityId);
  const comments = await getCommentsByPost(post.id);

  return (
    <div>
      <PageHeader title={community?.name ?? '게시글'} backHref={`/communities/${post.communityId}`} />
      <div className="p-5">
        <Card>
          <div className="flex items-center gap-2">
            <img
              src={post.authorAvatar}
              alt=""
              className="h-11 w-11 rounded-full object-cover"
            />
            <div>
              <p className="font-bold text-ink-900">{post.authorName}</p>
              <p className="text-sm text-ink-700/50">
                {new Date(post.createdAt).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
          <p className="mt-4 whitespace-pre-line text-lg text-ink-900">
            {post.content}
          </p>
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt=""
              className="mt-4 w-full rounded-xl object-cover"
            />
          ) : null}
        </Card>

        <h2 className="mt-6 text-xl font-bold text-ink-900">
          댓글 {comments.length}개
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-xl bg-moss-50 p-4">
              <p className="font-bold text-ink-900">{c.authorName}</p>
              <p className="mt-1 text-lg text-ink-900">{c.content}</p>
            </div>
          ))}
        </div>

        <form action={createCommentAction} className="mt-5 flex flex-col gap-3">
          <input type="hidden" name="postId" value={post.id} />
          <Textarea
            name="content"
            required
            rows={3}
            placeholder="따뜻한 댓글을 남겨주세요."
          />
          <Button type="submit" fullWidth>
            댓글 남기기
          </Button>
        </form>
      </div>
    </div>
  );
}
