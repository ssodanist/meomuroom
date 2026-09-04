import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import { Label, Input } from '@/components/FormField';
import { startSmsLoginAction } from '@/lib/actions';

export default function SmsLoginPage({
  searchParams,
}: {
  searchParams: { phone?: string; error?: string; assisted?: string };
}) {
  const assisted = searchParams.assisted === '1';
  const phone = searchParams.phone ?? '';
  const step = phone ? 'code' : 'phone';

  return (
    <div>
      <PageHeader title="문자로 시작하기" backHref="/login" />
      <div className="p-5">
        {step === 'phone' ? (
          <form action="/login/sms" className="flex flex-col gap-5">
            {assisted ? <input type="hidden" name="assisted" value="1" /> : null}
            <p className="text-lg text-ink-900">
              카카오·네이버 계정이 없으셔도 괜찮아요. 휴대폰 번호로 인증번호를
              보내드릴게요.
            </p>
            {searchParams.error === 'phone' ? (
              <p className="text-base font-bold text-clay-500">
                휴대폰 번호를 다시 확인해주세요.
              </p>
            ) : null}
            <div>
              <Label>휴대폰 번호</Label>
              <Input
                type="tel"
                name="phone"
                required
                placeholder="예: 01012345678"
              />
            </div>
            <Button type="submit" fullWidth>
              인증번호 받기
            </Button>
          </form>
        ) : (
          <form action={startSmsLoginAction} className="flex flex-col gap-5">
            <input type="hidden" name="phone" value={phone} />
            {assisted ? <input type="hidden" name="assisted" value="1" /> : null}
            <p className="text-lg text-ink-900">
              {phone}번으로 인증번호를 보냈어요.
            </p>
            <p className="text-base text-ink-700/60">
              (데모 화면이라 실제로 문자를 보내지는 않아요. 인증번호{' '}
              <span className="font-bold text-ink-900">123456</span>을
              입력해주세요.)
            </p>
            {searchParams.error === 'code' ? (
              <p className="text-base font-bold text-clay-500">
                인증번호가 올바르지 않아요. 다시 입력해주세요.
              </p>
            ) : null}
            <div>
              <Label>인증번호 6자리</Label>
              <Input
                type="text"
                inputMode="numeric"
                name="code"
                required
                placeholder="123456"
              />
            </div>
            <Button type="submit" fullWidth>
              확인하고 시작하기
            </Button>
            <a
              href={`/login/sms${assisted ? '?assisted=1' : ''}`}
              className="text-center text-base font-semibold text-moss-700"
            >
              번호를 다시 입력할게요
            </a>
          </form>
        )}
      </div>
    </div>
  );
}
