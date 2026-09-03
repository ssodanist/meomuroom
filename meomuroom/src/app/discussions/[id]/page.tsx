import { notFound } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import { getDiscussionById } from '@/lib/data';

export default async function DiscussionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const discussion = await getDiscussionById(params.id);
  if (!discussion) notFound();

  return (
    <div>
      <PageHeader title="자유토론" backHref="/discussions" />
      <div className="p-5">
        <Badge>{discussion.category}</Badge>
        <h1 className="mt-2 text-2xl font-extrabold text-ink-900">
          {discussion.title}
        </h1>
        <p className="mt-2 text-base text-ink-700/60">
          {discussion.authorLabel} ·{' '}
          {new Date(discussion.createdAt).toLocaleDateString('ko-KR')}
        </p>
        <Card className="mt-4">
          <p className="whitespace-pre-line text-lg text-ink-900">
            {discussion.content}
          </p>
        </Card>
        <p className="mt-6 text-center text-base text-ink-700/50">
          댓글 기능은 곧 추가될 예정이에요. 지금은 {discussion.replyCount}개의
          댓글이 달렸어요.
        </p>
      </div>
    </div>
  );
}
