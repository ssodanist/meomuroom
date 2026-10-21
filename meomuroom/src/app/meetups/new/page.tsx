import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import { Label, Input, Textarea, Select } from '@/components/FormField';
import { createMeetupAction } from '@/lib/actions';

const categories = ['등산', '여행', '식사', '클래스', '동창회', '스터디'];

export default function NewMeetupPage() {
  return (
    <div>
      <PageHeader title="모임 만들기" backHref="/meetups" />
      <form action={createMeetupAction} className="flex flex-col gap-5 p-5">
        <div>
          <Label>모임 이름</Label>
          <Input name="title" required placeholder="예: 북한산 둘레길 산행" />
        </div>
        <div>
          <Label>종류</Label>
          <Select name="category" defaultValue="식사">
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>날짜와 시간</Label>
          <Input type="datetime-local" name="date" required />
        </div>
        <div>
          <Label>장소 (지역)</Label>
          <Input name="region" required placeholder="예: 서울 마포구" />
        </div>
        <div>
          <Label>정원</Label>
          <Input type="number" name="capacity" min={2} max={100} defaultValue={10} required />
        </div>
        <div>
          <Label>소개</Label>
          <Textarea
            name="description"
            rows={5}
            placeholder="어떤 모임인지, 무엇을 준비하면 좋을지 적어주세요."
          />
        </div>
        <Button type="submit" fullWidth>
          모임 만들기
        </Button>
      </form>
    </div>
  );
}
