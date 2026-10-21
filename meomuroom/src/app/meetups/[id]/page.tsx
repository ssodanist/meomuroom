import { notFound } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { getMeetupById } from '@/lib/data';
import { joinMeetupAction } from '@/lib/actions';

export default async function MeetupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const meetup = await getMeetupById(params.id);
  if (!meetup) notFound();

  const isFull = meetup.participantCount >= meetup.capacity;

  return (
    <div>
      <PageHeader title="모임 상세" backHref="/meetups" />
      <div className="p-5">
        <Badge tone="clay">{meetup.category}</Badge>
        <h1 className="mt-2 text-2xl font-extrabold text-ink-900">
          {meetup.title}
        </h1>

        <Card className="mt-4 flex flex-col gap-2">
          <Row label="일시" value={new Date(meetup.date).toLocaleString('ko-KR', {
            month: 'long', day: 'numeric', weekday: 'short', hour: 'numeric', minute: '2-digit',
          })} />
          <Row label="장소" value={meetup.region} />
          <Row label="주최자" value={meetup.hostName} />
          <Row label="참가 인원" value={`${meetup.participantCount} / ${meetup.capacity}명`} />
        </Card>

        <h2 className="mt-6 text-xl font-bold text-ink-900">모임 소개</h2>
        <p className="mt-2 whitespace-pre-line text-lg text-ink-900">
          {meetup.description}
        </p>

        <form action={joinMeetupAction} className="mt-8">
          <input type="hidden" name="meetupId" value={meetup.id} />
          <Button type="submit" fullWidth disabled={isFull}>
            {isFull ? '모집이 마감됐어요' : '참가 신청하기'}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-lg">
      <span className="text-ink-700/60">{label}</span>
      <span className="font-semibold text-ink-900">{value}</span>
    </div>
  );
}
