import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/data';
import { startLoginAction } from '@/lib/actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { assisted?: string; restored?: string; withdrawn?: string };
}) {
  const existing = await getCurrentUser();
  if (existing) redirect('/');

  const assisted = searchParams.assisted === '1';

  return (
    <div className="flex min-h-screen flex-col justify-between px-6 py-10">
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
          <a
            href={`/login/sms${assisted ? '?assisted=1' : ''}`}
            className="font-bold text-moss-700 underline"
          >
            문자로 시작하기
          </a>
        </p>
      </div>

      <p className="text-center text-base text-ink-700/60">
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
