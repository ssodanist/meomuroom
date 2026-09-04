import { redirect } from 'next/navigation';
import { getSignupProgress } from '@/lib/data';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const progress = await getSignupProgress();
  if (!progress) redirect('/login');
  if (!progress.verified) {
    redirect(`/onboarding/verify${progress.assisted ? '?assisted=1' : ''}`);
  }

  return <OnboardingClient assisted={progress.assisted} />;
}
