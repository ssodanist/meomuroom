import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import { Label, Input, Textarea, Select } from '@/components/FormField';
import { createDiscussionAction } from '@/lib/actions';

const categories = ['사회이슈', '건강', '재테크', '여행', '일상'];

export default function NewDiscussionPage() {
  return (
    <div>
      <PageHeader title="자유토론 글쓰기" backHref="/discussions" />
      <form action={createDiscussionAction} className="flex flex-col gap-5 p-5">
        <div>
          <Label>주제</Label>
          <Select name="category" defaultValue="일상">
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>제목</Label>
          <Input name="title" required placeholder="제목을 적어주세요" />
        </div>
        <div>
          <Label>내용</Label>
          <Textarea
            name="content"
            required
            rows={6}
            placeholder="편하게 이야기해 주세요."
          />
        </div>
        <label className="flex min-h-touch items-center gap-3 text-lg text-ink-900">
          <input
            type="checkbox"
            name="isAnonymous"
            className="h-6 w-6 accent-moss-500"
          />
          이름을 밝히지 않고 익명으로 올리기
        </label>
        <Button type="submit" fullWidth>
          올리기
        </Button>
      </form>
    </div>
  );
}
