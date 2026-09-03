'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { POPULAR_CATEGORIES } from '@/lib/mockData';
import { finishOnboardingAction } from '@/lib/actions';

const steps = [
  {
    title: '머무름에 오신 것을\n환영합니다',
    subtitle: '취미를 나누고, 모임을 만들고,\n마음 편히 이야기할 수 있는 공간이에요.',
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

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
    );
  };

  const isLast = step === steps.length - 1;

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

        {step === 1 ? (
          <div className="mt-8 flex flex-wrap gap-3">
            {POPULAR_CATEGORIES.map((name) => {
              const active = selected.includes(name);
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
        <Button
          fullWidth
          disabled={saving}
          onClick={async () => {
            if (isLast) {
              setSaving(true);
              await finishOnboardingAction(selected);
              router.push('/');
            } else {
              setStep((s) => s + 1);
            }
          }}
        >
          {isLast ? '머무름 시작하기' : '다음'}
        </Button>
      </div>
    </div>
  );
}
