import { redirect } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import { Label, Input } from '@/components/FormField';
import { getSignupDraftProvider } from '@/lib/data';
import { getSignupProviderLabel, verifyIdentityAction } from '@/lib/actions';

export default async function VerifyIdentityPage({
  searchParams,
}: {
  searchParams: { assisted?: string; error?: string };
}) {
  const provider = await getSignupDraftProvider();
  if (!provider) redirect('/login');

  const assisted = searchParams.assisted === '1';
  const providerLabel = await getSignupProviderLabel();
  const isSocial = provider === 'kakao' || provider === 'naver';

  return (
    <div>
      <PageHeader title="본인인증" backHref="/login" />
      <div className="p-5">
        <p className="text-lg text-ink-900">
          {providerLabel} 로그인 확인이 끝났어요. 안전한 커뮤니티를 위해{' '}
          <b>딱 한 번만</b> 본인인증을 진행할게요.
        </p>
        {isSocial ? (
          <p className="mt-2 text-base text-ink-700/60">
            (데모 화면이라 실명·태어난 연도를 직접 입력해주세요. 실제
            서비스에서는 PASS 앱으로 자동 확인돼요.)
          </p>
        ) : null}

        {assisted ? (
          <div className="mt-4 rounded-xl border-2 border-moss-200 bg-moss-50 p-4 text-base text-ink-900">
            여기 적는 이름과 태어난 연도는 본인 확인용으로만 쓰이고, 다른
            회원에게는 절대 보이지 않아요. 화면에는 다음 단계에서 정하는
            별명만 보여요.
          </div>
        ) : null}

        {searchParams.error ? (
          <p className="mt-4 text-base font-bold text-clay-500">
            이름과 태어난 연도(4자리)를 다시 확인해주세요.
          </p>
        ) : null}

        <form action={verifyIdentityAction} className="mt-6 flex flex-col gap-5">
          {assisted ? <input type="hidden" name="assisted" value="1" /> : null}
          <div>
            <Label>실명 (본인인증용, 화면에 표시되지 않아요)</Label>
            <Input type="text" name="verifiedName" required placeholder="예: 김정순" />
          </div>
          <div>
            <Label>태어난 연도</Label>
            <Input
              type="number"
              name="birthYear"
              required
              inputMode="numeric"
              placeholder="예: 1959"
              min={1900}
              max={new Date().getFullYear()}
            />
            <p className="mt-2 text-base text-ink-700/60">
              연도만 확인해서 &ldquo;50대·60대·70대 이상&rdquo; 중 어디에
              속하는지만 표시해요. 정확한 나이는 공개하지 않아요.
            </p>
          </div>
          <Button type="submit" fullWidth>
            확인했어요, 다음으로
          </Button>
        </form>
      </div>
    </div>
  );
}
