import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Label, Input, Select } from '@/components/FormField';
import { getCurrentUser } from '@/lib/data';
import { updateCheckinAction } from '@/lib/actions';

const intervalOptions = [12, 24, 48, 72];

export default async function CheckinSettingsPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <PageHeader title="안부 확인 설정" backHref="/mypage" />
      <div className="p-5">
        <Card className="bg-moss-50">
          <p className="text-lg text-ink-900">
            설정한 시간 동안 앱에 접속하지 않으면, 등록해두신 가족·지인에게
            안부 알림이 전달돼요. 혼자 계신 시간이 많은 어르신들의 안전을
            위한 기능입니다.
          </p>
        </Card>

        <form action={updateCheckinAction} className="mt-6 flex flex-col gap-5">
          <div>
            <Label>알림까지 기다릴 시간</Label>
            <Select
              name="checkinIntervalHours"
              defaultValue={user.checkinIntervalHours}
            >
              {intervalOptions.map((h) => (
                <option key={h} value={h}>
                  {h}시간 동안 접속이 없으면
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>보호자 연락처</Label>
            <Input
              type="tel"
              name="guardianContact"
              defaultValue={user.guardianContact}
              placeholder="예: 010-1234-5678"
            />
          </div>
          <Button type="submit" fullWidth>
            저장하기
          </Button>
        </form>
      </div>
    </div>
  );
}
