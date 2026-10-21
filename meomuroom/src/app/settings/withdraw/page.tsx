import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { withdrawAction } from '@/lib/actions';

export default function WithdrawPage() {
  return (
    <div>
      <PageHeader title="회원 탈퇴" backHref="/mypage" />
      <div className="p-5">
        <p className="text-lg text-ink-900">정말 탈퇴하시겠어요?</p>

        <Card className="mt-5 bg-moss-50">
          <p className="text-base text-ink-900">
            탈퇴하시면 로그아웃되고, 다른 회원에게 내 정보가 보이지 않아요.
            <br />
            <b>30일 안에</b> 같은 방법(카카오·네이버·문자)으로 다시
            로그인하시면 별명·관심사·모임 기록까지 그대로 복구해 드려요.
          </p>
        </Card>

        <div className="mt-8 flex flex-col gap-3">
          <form action={withdrawAction}>
            <Button
              type="submit"
              fullWidth
              className="bg-clay-500 hover:bg-clay-500 active:bg-clay-500"
            >
              탈퇴하기
            </Button>
          </form>
          <a href="/mypage">
            <Button type="button" variant="secondary" fullWidth>
              계속 이용할게요
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
