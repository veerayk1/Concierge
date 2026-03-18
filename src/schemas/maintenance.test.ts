/**
 * Maintenance Schema Validation Tests — per PRD 05
 */

import { describe, expect, it } from 'vitest';
import { createMaintenanceSchema, updateMaintenanceSchema } from './maintenance';

describe('createMaintenanceSchema', () => {
  const validInput = {
    propertyId: '00000000-0000-4000-b000-000000000001',
    unitId: '00000000-0000-4000-e000-000000000001',
    description: 'Kitchen sink is leaking under the cabinet',
    priority: 'medium' as const,
    permissionToEnter: false,
  };

  it('accepts valid input', () => {
    expect(createMaintenanceSchema.safeParse(validInput).success).toBe(true);
  });

  it('requires description min 10 chars', () => {
    expect(createMaintenanceSchema.safeParse({ ...validInput, description: 'Short' }).success).toBe(
      false,
    );
    expect(
      createMaintenanceSchema.safeParse({ ...validInput, description: 'Exactly 10' }).success,
    ).toBe(true);
  });

  it('enforces description max 4000', () => {
    expect(
      createMaintenanceSchema.safeParse({ ...validInput, description: 'X'.repeat(4001) }).success,
    ).toBe(false);
  });

  it('requires unitId as UUID', () => {
    expect(createMaintenanceSchema.safeParse({ ...validInput, unitId: '' }).success).toBe(false);
  });

  it('defaults priority to medium', () => {
    const { priority, ...rest } = validInput;
    const result = createMaintenanceSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priority).toBe('medium');
  });

  it('accepts all priority levels', () => {
    for (const p of ['low', 'medium', 'high', 'urgent']) {
      expect(createMaintenanceSchema.safeParse({ ...validInput, priority: p }).success).toBe(true);
    }
  });

  it('defaults permissionToEnter to false', () => {
    const { permissionToEnter, ...rest } = validInput;
    const result = createMaintenanceSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.permissionToEnter).toBe(false);
  });

  it('enforces entryInstructions max 1000', () => {
    expect(
      createMaintenanceSchema.safeParse({
        ...validInput,
        entryInstructions: 'X'.repeat(1001),
      }).success,
    ).toBe(false);
  });
});

describe('updateMaintenanceSchema', () => {
  it('accepts status updates', () => {
    for (const s of ['open', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed']) {
      expect(updateMaintenanceSchema.safeParse({ status: s }).success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    expect(updateMaintenanceSchema.safeParse({ status: 'deleted' }).success).toBe(false);
  });

  it('accepts empty update', () => {
    expect(updateMaintenanceSchema.safeParse({}).success).toBe(true);
  });

  it('accepts assignedEmployeeId as UUID', () => {
    expect(
      updateMaintenanceSchema.safeParse({
        assignedEmployeeId: '00000000-0000-4000-a000-000000000001',
      }).success,
    ).toBe(true);
  });
});
