'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import { Label, Input } from '@/components/FormField';
import { POPULAR_CATEGORIES } from '@/lib/mockData';
import { completeSignupAction } from '@/lib/actions';
import type { GenderDisplay } from '@/lib/types';

const genderOptions: GenderDisplay[] = ['비공개', '여성', '남성'];

export default function OnboardingClient({ assisted }: { assisted: boolean }) {
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [region, setRegion] = useState('');
  const [gender, setGender] = useState<GenderDisplay>('비공개');
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  const toggleInterest = (name: string) => {
    setInterests((prev) =>
      prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
    );
  };

  const steps = [
    {
      title: '머무름에 오신 것을\n환영합니다',
      subtitle:
        '취미를 나누고, 모임을 만들고,\n마음 편히 이야기할 수 있는 공간이에요.',
    },
    {
      title: '어떻게 불러드릴까요?',
      subtitle:
        '여기서 정하는 별명과 동네만 다른 회원에게 보여요.\n이름·정확한 나이는 절대 공개되지 않아요.',
    },
    {
      title: '관심있는 주제를\n골라주세요',
      subtitle:
        '50가지가 넘는 주제 중 인기 있는 것부터 보여드려요.\n여기 없는 주제는 시작한 뒤 검색하거나 직접 추가할 수 있어요.',
    },
    {
      title: '준비가 다 됐어요!',
      subtitle: '머무름과 함께 새로운 하루를 시작해 볼까요?',
    },
  ];

  const isLast = step === steps.length - 1;
  const isProfileStep = step === 1;

  const goNext = () => {
    if (isProfileStep) {
      if (!nickname.trim()) {
        setProfileError('별명을 입력해주세요.');
        return;
      }
      if (!region.trim()) {
        setProfileError('동네(구/군)를 입력해주세요.');
        return;
      }
      setProfileError('');
    }
    setStep((s) => s + 1);
  };


  return (
    <div className="flex min-h-screen flex-col justify-between px-6 py-10">
      <div>
        <div className="mb-8 flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i <= step ? 'bg-moss-500' : 'bg-moss-100'
              }`}
            />
          ))}
        </div>

        <h1 className="whitespace-pre-line text-3xl font-extrabold leading-snug text-ink-900">
          {steps[step].title}
        </h1>
        <p className="mt-4 whitespace-pre-line text-lg text-ink-700/80">
          {steps[step].subtitle}
        </p>

        {assisted && step === 0 ? (
          <div className="mt-6 rounded-xl border-2 border-moss-200 bg-moss-50 p-4 text-base text-ink-900">
            👨‍👩‍👧 보호자와 함께 진행 중이에요. 천천히, 다음 버튼을 눌러가며
            진행해주세요.
          </div>
        ) : null}

        {isProfileStep ? (
          <div className="mt-8 flex flex-col gap-5">
            <div>
              <Label>별명</Label>
              <Input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="예: 정순씨"
              />
            </div>
            <div>
              <Label>동네 (구/군 단위만 알려주세요)</Label>
              <Input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="예: 서울 마포구"
              />
              <p className="mt-2 text-base text-ink-700/60">
                정확한 위치가 아니라 동네 단위만 보여요.
              </p>
            </div>
            <div>
              <Label>성별 (선택하지 않아도 괜찮아요)</Label>
              <div className="flex gap-3">
                {genderOptions.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`min-h-touch flex-1 rounded-xl border-2 text-lg font-semibold ${
                      gender === g
                        ? 'border-moss-500 bg-moss-500 text-white'
                        : 'border-moss-200 bg-white text-ink-900'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            {profileError ? (
              <p className="text-base font-bold text-clay-500">{profileError}</p>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-8 flex flex-wrap gap-3">
            {POPULAR_CATEGORIES.map((name) => {
              const active = interests.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleInterest(name)}
                  className={`min-h-touch rounded-full border-2 px-5 text-lg font-semibold ${
                    active
                      ? 'border-moss-500 bg-moss-500 text-white'
                      : 'border-moss-200 bg-white text-ink-900'
                  }`}
                >
                  {name}
                  {active ? ' ✓' : ''}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="flex gap-3">
        {step > 0 ? (
          <Button
            variant="secondary"
            onClick={() => setStep((s) => s - 1)}
            disabled={saving}
          >
            이전
          </Button>
        ) : null}
        {isLast ? (
          // 실제 <form> 제출이라야 방금 만든 로그인 세션 쿠키가 곧바로
          // 다음 화면(/)에 반영됩니다 — 그래서 이 버튼만 진짜 폼으로 감쌌어요.
          <form
            action={completeSignupAction}
            className="flex-1"
            onSubmit={() => setSaving(true)}
          >
            <input type="hidden" name="nickname" value={nickname.trim()} />
            <input type="hidden" name="region" value={region.trim()} />
            <input type="hidden" name="genderDisplay" value={gender} />
            {interests.map((name) => (
              <input key={name} type="hidden" name="interests" value={name} />
            ))}
            <Button type="submit" fullWidth disabled={saving}>
              머무름 시작하기
            </Button>
          </form>
        ) : (
          <Button fullWidth disabled={saving} onClick={goNext}>
            다음
          </Button>
        )}
      </div>
    </div>
  );
}
