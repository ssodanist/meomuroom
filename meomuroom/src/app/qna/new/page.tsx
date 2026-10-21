import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import { Label, Textarea } from '@/components/FormField';
import { createQnaAction } from '@/lib/actions';

export default function NewQnaPage() {
  return (
    <div>
      <PageHeader title="질문하기" backHref="/qna" />
      <form action={createQnaAction} className="flex flex-col gap-5 p-5">
        <div>
          <Label>무엇이 궁금하세요?</Label>
          <Textarea
            name="question"
            required
            rows={5}
            placeholder="편하게 물어보세요. 다른 회원들이 답변해 드릴 거예요."
          />
        </div>
        <Button type="submit" fullWidth>
          질문 올리기
        </Button>
      </form>
    </div>
  );
}
