import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import CoverTile from '@/components/CoverTile';
import { getCommunities, requireCurrentUser } from '@/lib/data';
import { logoutAction } from '@/lib/actions';
import { meetups } from '@/lib/mockData';

export default async function MyPage() {
  const user = await requireCurrentUser();
  const myCommunities = await getCommunities({
    myOnly: true,
    interests: user.interests,
  });
  const myMeetups = meetups.filter((m) => m.hostId === user.id);

  return (
    <div>
      <PageHeader title="마이페이지" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <img
              src={user.avatarUrl}
              alt=""
              className="h-20 w-20 rounded-full object-cover"
            />
            <div>
              <p className="text-2xl font-extrabold text-ink-900">
                {user.nickname}
              </p>
              <p className="text-base text-ink-700/60">
                {user.region} · {user.ageGroup}
                {user.genderDisplay !== '비공개' ? ` · ${user.genderDisplay}` : ''}
              </p>
            </div>
          </div>
          {/* 아이디어8: 숨겨진 메뉴 안이 아니라 여기, 눈에 바로 띄는 자리에 둡니다. */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="min-h-touch rounded-xl border-2 border-moss-200 bg-white px-4 text-base font-bold text-ink-700"
            >
              로그아웃
            </button>
          </form>
        </div>

        <Card className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-ink-900">멤버십</p>
            <p className="text-base text-ink-700/60">
              {user.membershipTier === 'premium' ? '프리미엄 회원' : '일반 회원'}
            </p>
          </div>
          <Badge tone={user.membershipTier === 'premium' ? 'clay' : 'moss'}>
            {user.membershipTier === 'premium' ? '프리미엄' : '무료'}
          </Badge>
        </Card>

        <Link href="/settings/checkin">
          <Card className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-ink-900">안부 확인 설정</p>
              <p className="text-base text-ink-700/60">
                {user.checkinIntervalHours}시간마다 · 보호자{' '}
                {user.guardianContact || '미등록'}
              </p>
            </div>
            <span className="text-2xl">→</span>
          </Card>
        </Link>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink-900">내 관심사</h2>
          <Link
            href="/communities"
            className="text-base font-semibold text-moss-700"
          >
            추가/수정
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {user.interests.length === 0 ? (
            <p className="text-base text-ink-700/50">
              아직 등록한 관심사가 없어요. 눌러서 골라보세요.
            </p>
          ) : (
            user.interests.map((cat) => (
              <span
                key={cat}
                className="min-h-touch rounded-full border-2 border-moss-200 bg-white px-4 py-2 text-base font-bold text-ink-900"
              >
                {cat}
              </span>
            ))
          )}
        </div>

        <h2 className="mt-6 text-xl font-bold text-ink-900">맞춤 커뮤니티</h2>
        <div className="mt-3 flex flex-col gap-2">
          {myCommunities.length === 0 ? (
            <p className="text-base text-ink-700/50">
              관심사를 등록하면 맞는 커뮤니티를 여기 보여드려요.
            </p>
          ) : (
            myCommunities.map((c) => (
              <Link key={c.id} href={`/communities/${c.id}`}>
                <Card className="flex items-center gap-3 overflow-hidden p-0">
                  <CoverTile category={c.category} className="h-16 w-16" iconClassName="text-2xl" />
                  <div className="flex flex-1 items-center justify-between py-2 pr-4">
                    <p className="text-lg text-ink-900">{c.name}</p>
                    <Badge tone="clay">{c.category}</Badge>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>

        <h2 className="mt-6 text-xl font-bold text-ink-900">내가 만든 모임</h2>
        <div className="mt-3 flex flex-col gap-2">
          {myMeetups.length === 0 ? (
            <p className="text-base text-ink-700/50">
              아직 만든 모임이 없어요.
            </p>
          ) : (
            myMeetups.map((m) => (
              <Link key={m.id} href={`/meetups/${m.id}`}>
                <Card className="flex items-center justify-between">
                  <p className="text-lg text-ink-900">{m.title}</p>
                  <span className="text-base text-ink-700/60">
                    {m.participantCount}/{m.capacity}명
                  </span>
                </Card>
              </Link>
            ))
          )}
        </div>

        <div className="mt-10 text-center">
          <Link href="/settings/withdraw" className="text-base text-ink-700/40">
            회원 탈퇴
          </Link>
        </div>
      </div>
    </div>
  );
}
