import type { Metadata } from 'next';

import { ImmersiveExperience } from '@/components/experience/ImmersiveExperience';

export const metadata: Metadata = {
  title: 'Experience — BuildingAutopilot',
  description: 'Step inside a building that runs itself.',
  // Showcase / work-in-progress — keep it out of search until it ships.
  robots: { index: false, follow: false },
};

export default function ExperiencePage() {
  return <ImmersiveExperience />;
}
