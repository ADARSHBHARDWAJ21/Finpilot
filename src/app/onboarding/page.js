import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { getOnboardingState } from "@/app/onboarding/actions";

export default async function OnboardingPage() {
  await requireUser();

  const { email, profile, completed } = await getOnboardingState();

  if (completed && profile?.ai_summary) {
    return (
      <OnboardingShell>
        <OnboardingWizard email={email} initialProfile={profile} />
      </OnboardingShell>
    );
  }

  if (completed) {
    redirect("/dashboard");
  }

  return (
    <OnboardingShell>
      <OnboardingWizard email={email} initialProfile={profile} />
    </OnboardingShell>
  );
}
