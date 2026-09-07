import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { getQnaList } from '@/lib/data';

// 회원이 새 질문을 올리면 바로 반영돼야 하므로, 빌드 시점에 미리 굳혀두지 않고
// 요청마다 새로 DB를 조회합니다.
export const dynamic = 'force-dynamic';

export default async function QnaPage() {
  const list = await getQnaList();

  return (
    <div>
      <PageHeader
        title="궁금한 것 물어보기"
        backHref="/discussions"
        action={
          <Link href="/qna/new">
            <Button className="px-4 text-base">+ 질문하기</Button>
          </Link>
        }
      />
      <div className="flex flex-col gap-3 p-5">
        {list.map((q) => (
          <Link key={q.id} href={`/qna/${q.id}`}>
            <Card>
              <div className="flex items-center gap-2">
                <Badge tone={q.isResolved ? 'moss' : 'clay'}>
                  {q.isResolved ? '답변완료' : '답변대기'}
                </Badge>
              </div>
              <p className="mt-2 text-lg font-bold text-ink-900">
                {q.question}
              </p>
              <p className="mt-1 text-sm text-ink-700/50">{q.authorName}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
