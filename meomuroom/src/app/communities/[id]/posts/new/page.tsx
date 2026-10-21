import { notFound } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import { Label, Textarea, FileInput } from '@/components/FormField';
import { getCommunityById } from '@/lib/data';
import { createPostAction } from '@/lib/actions';

export default async function NewPostPage({
  params,
}: {
  params: { id: string };
}) {
  const community = await getCommunityById(params.id);
  if (!community) notFound();

  return (
    <div>
      <PageHeader title={`${community.name} 이야기 남기기`} backHref={`/communities/${community.id}`} />
      <form action={createPostAction} className="flex flex-col gap-5 p-5">
        <input type="hidden" name="communityId" value={community.id} />
        <div>
          <Label>어떤 이야기를 나누고 싶으세요?</Label>
          <Textarea
            name="content"
            required
            rows={6}
            placeholder="오늘 있었던 일이나 사진 이야기를 편하게 적어주세요."
          />
        </div>
        <div>
          <Label>사진 (선택, 최대 5MB)</Label>
          <FileInput name="image" accept="image/jpeg,image/png,image/webp,image/gif" />
        </div>
        <Button type="submit" fullWidth>
          올리기
        </Button>
      </form>
    </div>
  );
}
