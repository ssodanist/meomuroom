import { redirect } from 'next/navigation';
import CoverTile from '@/components/CoverTile';
import { getCurrentUser } from '@/lib/data';
import { startLoginAction } from '@/lib/actions';
import { ALL_CATEGORIES, POPULAR_CATEGORIES, communities } from '@/lib/mockData';

const FEATURES = [
  { icon: '🌿', title: '관심사 커뮤니티', desc: `${ALL_CATEGORIES.length}개가 넘는\n동네 취미 모임` },
  { icon: '📅', title: '오프라인 모임', desc: '가까운 동네에서\n직접 만나요' },
  { icon: '💬', title: '자유토론 · Q&A', desc: '마음 편히\n이야기 나눠요' },
  { icon: '💛', title: '안부 확인', desc: '혼자 계셔도\n가족이 안심해요' },
] as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { assisted?: string; restored?: string; withdrawn?: string };
}) {
  const existing = await getCurrentUser();
  if (existing) redirect('/');

  const assisted = searchParams.assisted === '1';
  const spotlightCommunities = POPULAR_CATEGORIES.slice(0, 10)
    .map((cat) => communities.find((c) => c.category === cat))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="flex min-h-screen flex-col px-6 py-10">
      <div>
        <p className="text-lg text-ink-700/70">🌿 머무름</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-snug text-ink-900">
          취미를 나누고,{'\n'}
          마음 편히 이야기하는 공간
        </h1>

        {searchParams.restored ? (
          <div className="mt-6 rounded-xl bg-moss-50 p-4 text-lg text-moss-800">
            다시 오신 것을 환영해요! 예전 별명과 관심사를 그대로 살려뒀어요.
          </div>
        ) : null}
        {searchParams.withdrawn ? (
          <div className="mt-6 rounded-xl bg-clay-100 p-4 text-lg text-ink-900">
            탈퇴가 완료됐어요. 30일 안에 같은 방법으로 다시 로그인하시면
            그대로 복구해 드려요.
          </div>
        ) : null}

        {assisted ? (
          <div className="mt-6 rounded-xl border-2 border-moss-200 bg-moss-50 p-4 text-lg text-ink-900">
            👨‍👩‍👧 보호자와 함께 진행 중이에요. 아래 버튼을 눌러 시작해주세요.
            각 단계마다 조금 더 자세히 안내해 드릴게요.
          </div>
        ) : null}

        <div className="mt-10 flex flex-col gap-4">
          <form action={startLoginAction}>
            <input type="hidden" name="provider" value="kakao" />
            {assisted ? <input type="hidden" name="assisted" value="1" /> : null}
            <button
              type="submit"
              className="min-h-touch flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-lg font-bold text-[#3C1E1E]"
            >
              <span aria-hidden>💬</span> 카카오로 시작하기
            </button>
          </form>

          <form action={startLoginAction}>
            <input type="hidden" name="provider" value="naver" />
            {assisted ? <input type="hidden" name="assisted" value="1" /> : null}
            <button
              type="submit"
              className="min-h-touch flex w-full items-center justify-center gap-2 rounded-xl bg-[#03C75A] text-lg font-bold text-white"
            >
              <span aria-hidden>N</span> 네이버로 시작하기
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-base text-ink-700/60">
          카카오·네이버 계정이 없으신가요?{' '}
          
            href={`/login/sms${assisted ? '?assisted=1' : ''}`}
            className="font-bold text-moss-700 underline"
          >
            문자로 시작하기
          </a>
        </p>
      </div>

      {/* 로그인 전에도 머무름이 어떤 곳인지 한눈에 보여줍니다 */}
      <div className="mt-12">
        <h2 className="text-center text-xl font-bold text-ink-900">
          머무름에서는 이런 걸 할 수 있어요
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center gap-1 rounded-2xl border border-moss-100 bg-white p-4 text-center shadow-sm"
            >
              <span aria-hidden className="text-3xl">
                {f.icon}
              </span>
              <p className="mt-1 text-lg font-bold text-ink-900">{f.title}</p>
              <p className="whitespace-pre-line text-sm text-ink-700/60">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-center text-lg font-bold text-ink-900">
          지금 활발한 인기 커뮤니티
        </p>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {spotlightCommunities.map((c) => (
            <div key={c.id} className="flex w-20 shrink-0 flex-col items-center gap-1">
              <CoverTile
                category={c.category}
                className="h-16 w-16 rounded-2xl"
                iconClassName="text-2xl"
              />
              <span className="line-clamp-1 text-center text-sm font-semibold text-ink-900">
                {c.category}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-10 pb-2 text-center text-base text-ink-700/60">
        {assisted ? (
          <a href="/login" className="font-semibold text-moss-700">
            혼자 진행할게요
          </a>
        ) : (
          <a href="/login?assisted=1" className="font-semibold text-moss-700">
            👨‍👩‍👧 자녀·보호자와 함께 시작할게요
          </a>
        )}
      </p>
    </div>
  );
}
