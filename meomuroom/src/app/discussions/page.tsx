import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { getDiscussions } from '@/lib/data';

// 회원이 새 글을 쓰면 바로 반영돼야 하므로, 빌드 시점에 미리 굳혀두지 않고
// 요청마다 새로 DB를 조회합니다.
export const dynamic = 'force-dynamic';

export default async function DiscussionsPage() {
  const discussions = await getDiscussions();

  return (
    <div>
      <PageHeader
        title="자유토론"
        action={
          <Link href="/discussions/new">
            <Button className="px-4 text-base">+ 글쓰기</Button>
          </Link>
        }
      />

      <div className="flex justify-end px-5 pt-4">
        <Link href="/qna" className="font-semibold text-moss-700">
          궁금한 게 있으신가요? Q&amp;A 가기 →
        </Link>
      </div>

      <div className="flex flex-col gap-3 p-5">
        {discussions.map((d) => (
          <Link key={d.id} href={`/discussions/${d.id}`}>
            <Card>
              <Badge>{d.category}</Badge>
              <p className="mt-2 text-lg font-bold text-ink-900">{d.title}</p>
              <p className="mt-1 line-clamp-2 text-base text-ink-700/70">
                {d.content}
              </p>
              <p className="mt-2 text-sm text-ink-700/50">
                {d.authorLabel} · 댓글 {d.replyCount}개
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
