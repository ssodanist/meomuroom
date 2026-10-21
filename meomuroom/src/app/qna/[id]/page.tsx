import { notFound } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { Textarea } from '@/components/FormField';
import { getQnaById } from '@/lib/data';
import { answerQnaAction } from '@/lib/actions';

export default async function QnaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const qna = await getQnaById(params.id);
  if (!qna) notFound();

  return (
    <div>
      <PageHeader title="질문 상세" backHref="/qna" />
      <div className="p-5">
        <Badge tone={qna.isResolved ? 'moss' : 'clay'}>
          {qna.isResolved ? '답변완료' : '답변대기'}
        </Badge>
        <h1 className="mt-2 text-2xl font-extrabold text-ink-900">
          {qna.question}
        </h1>
        <p className="mt-1 text-base text-ink-700/60">{qna.authorName}</p>

        {qna.answer ? (
          <Card className="mt-4 bg-moss-50">
            <p className="font-bold text-moss-700">답변</p>
            <p className="mt-2 whitespace-pre-line text-lg text-ink-900">
              {qna.answer}
            </p>
          </Card>
        ) : (
          <form action={answerQnaAction} className="mt-6 flex flex-col gap-3">
            <input type="hidden" name="id" value={qna.id} />
            <Textarea
              name="answer"
              required
              rows={4}
              placeholder="아시는 분은 답변을 남겨주세요."
            />
            <Button type="submit" fullWidth>
              답변 남기기
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
