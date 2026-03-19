/**
 * Maintenance SLA Enforcement Workflow — per PRD 05
 *
 * Each maintenance category has an SLA timer defining the expected
 * resolution time. When a request exceeds its SLA:
 *
 * - 75% of SLA:   Status = "approaching" (visual warning)
 * - 100% of SLA:  Status = "overdue" — priority auto-bumped one level
 * - 200% of SLA:  Status = "critical" — priority forced to urgent,
 *                  notify property manager (2x SLA) and property admin (3x SLA)
 *
 * The escalation stops if the request is resolved at any point.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SlaStatus = 'within_sla' | 'approaching' | 'overdue' | 'critical';

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';

export type MaintenanceCategory =
  | 'Plumbing'
  | 'Electrical'
  | 'HVAC'
  | 'Appliance'
  | 'General'
  | 'Emergency';

// ---------------------------------------------------------------------------
// Default SLA Hours per Category
// ---------------------------------------------------------------------------

export const DEFAULT_SLA_HOURS: Record<MaintenanceCategory, number> = {
  Plumbing: 24,
  Electrical: 12,
  HVAC: 8, // Heating/cooling failures are urgent
  Appliance: 48,
  General: 72,
  Emergency: 4,
};

// ---------------------------------------------------------------------------
// SLA Status Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the current SLA status for a maintenance request.
 *
 * Thresholds (as percentage of SLA time):
 * - under 75%:   within_sla
 * - 75% – 100%:  approaching
 * - 100% – 200%: overdue
 * - 200%+:       critical
 *
 * @param createdAt  When the maintenance request was created
 * @param slaHours   The SLA deadline in hours for this category
 */
export function calculateSlaStatus(createdAt: Date, slaHours: number): SlaStatus {
  const hoursElapsed = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const percentage = hoursElapsed / slaHours;

  if (percentage < 0 || percentage < 0.75) {
    return 'within_sla';
  }
  if (percentage < 1) {
    return 'approaching';
  }
  if (percentage < 2) {
    return 'overdue';
  }
  return 'critical';
}

// ---------------------------------------------------------------------------
// Priority Bumping
// ---------------------------------------------------------------------------

const PRIORITY_ORDER: MaintenancePriority[] = ['low', 'medium', 'high', 'urgent'];

/**
 * Determine the new priority for a maintenance request based on its SLA status.
 *
 * Rules:
 * - within_sla / approaching: no change
 * - overdue: bump one level (low→medium, medium→high)
 * - critical: force to urgent
 *
 * @param currentPriority  The current priority of the request
 * @param slaStatus        The calculated SLA status
 */
export function getSlaPriorityBump(
  currentPriority: MaintenancePriority,
  slaStatus: SlaStatus,
): MaintenancePriority {
  if (slaStatus === 'within_sla' || slaStatus === 'approaching') {
    return currentPriority;
  }

  if (slaStatus === 'critical') {
    return 'urgent';
  }

  // overdue: bump one level (but cap at high — urgent is reserved for critical)
  // If already high or urgent, don't bump further on overdue
  if (currentPriority === 'high' || currentPriority === 'urgent') {
    return currentPriority;
  }
  const currentIndex = PRIORITY_ORDER.indexOf(currentPriority);
  return PRIORITY_ORDER[currentIndex + 1] as MaintenancePriority;
}
