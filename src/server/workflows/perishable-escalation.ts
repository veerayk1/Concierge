/**
 * Perishable Package Escalation Workflow — per PRD 04 Section 5.3
 *
 * When a package is flagged as perishable, an escalation chain fires:
 * 0h:  Notify resident via ALL channels (email + sms + push)
 * 4h:  Auto-send follow-up reminder
 * 8h:  Notify secondary contact for the unit
 * 24h: Alert shift supervisor / property manager
 * 48h: Flag for management review (disposal recommendation)
 *
 * Each step is logged in PackageHistory.
 * The escalation stops if the package is released at any point.
 */

import { prisma } from '@/server/db';

export interface EscalationStep {
  hoursAfterReceipt: number;
  action: string;
  description: string;
  notifyRole?: string;
}

export const PERISHABLE_ESCALATION_CHAIN: EscalationStep[] = [
  {
    hoursAfterReceipt: 0,
    action: 'immediate_notification',
    description: 'Notify resident via ALL channels',
  },
  {
    hoursAfterReceipt: 4,
    action: 'follow_up_reminder',
    description: 'Auto-send follow-up reminder to resident',
  },
  {
    hoursAfterReceipt: 8,
    action: 'secondary_contact',
    description: 'Notify secondary/emergency contact for the unit',
  },
  {
    hoursAfterReceipt: 24,
    action: 'supervisor_alert',
    description: 'Alert shift supervisor and property manager',
    notifyRole: 'property_manager',
  },
  {
    hoursAfterReceipt: 48,
    action: 'management_review',
    description: 'Flag for management review — disposal recommendation',
    notifyRole: 'property_admin',
  },
];

/**
 * Check which escalation step a perishable package is at based on age.
 */
export function getCurrentEscalationLevel(receivedAt: Date): number {
  const hoursElapsed = (Date.now() - receivedAt.getTime()) / (1000 * 60 * 60);

  let level = 0;
  for (const step of PERISHABLE_ESCALATION_CHAIN) {
    if (hoursElapsed >= step.hoursAfterReceipt) {
      level++;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Get the next escalation step that hasn't been executed yet.
 */
export function getNextEscalationStep(
  receivedAt: Date,
  completedSteps: string[],
): EscalationStep | null {
  const hoursElapsed = (Date.now() - receivedAt.getTime()) / (1000 * 60 * 60);

  for (const step of PERISHABLE_ESCALATION_CHAIN) {
    if (hoursElapsed >= step.hoursAfterReceipt && !completedSteps.includes(step.action)) {
      return step;
    }
  }
  return null;
}

/**
 * Process perishable escalation for a specific package.
 * Called by a background job (BullMQ) on a schedule.
 *
 * Returns the action taken, or null if no action needed.
 */
export async function processPerishableEscalation(
  packageId: string,
): Promise<{ action: string; description: string } | null> {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId, deletedAt: null },
    select: {
      id: true,
      status: true,
      isPerishable: true,
      createdAt: true,
      referenceNumber: true,
      history: {
        select: { action: true },
      },
    },
  });

  if (!pkg) return null;
  if (!pkg.isPerishable) return null;
  if (pkg.status !== 'unreleased') return null; // Already released — stop escalation

  const completedSteps = pkg.history.map((h) => h.action);
  const nextStep = getNextEscalationStep(pkg.createdAt, completedSteps);

  if (!nextStep) return null; // All steps completed or not yet time

  // Log the escalation step
  await prisma.packageHistory.create({
    data: {
      packageId: pkg.id,
      action: nextStep.action,
      details: `Escalation: ${nextStep.description} (${nextStep.hoursAfterReceipt}h after receipt)`,
      actorId: '00000000-0000-0000-0000-000000000000', // System actor
      actorName: 'System',
    },
  });

  // TODO: Actually send notifications based on step.action
  // - immediate_notification: email + sms + push to resident
  // - follow_up_reminder: email reminder to resident
  // - secondary_contact: notify emergency contact
  // - supervisor_alert: notify property manager
  // - management_review: create task for admin

  return { action: nextStep.action, description: nextStep.description };
}
