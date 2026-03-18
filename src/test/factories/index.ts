/**
 * Concierge — Test Factories Barrel Export
 *
 * Re-exports all factory functions and types for convenient imports:
 *   import { createProperty, createUser, createUnit } from '@/test/factories';
 *
 * @module test/factories
 */

// Property factories
export {
  createProperty,
  createPropertyOverrides,
  createProperties,
  type PropertyFactoryData,
} from './property';

// User factories
export {
  createUser,
  createUserWithRole,
  createSuperAdmin,
  createPropertyAdmin,
  createPropertyManager,
  createFrontDesk,
  createSecurityGuard,
  createMaintenanceStaff,
  createBoardMember,
  createResidentOwner,
  createResidentTenant,
  createFamilyMember,
  createOffsiteOwner,
  createVisitor,
  createUsers,
  createAllRoleUsers,
  createInactiveUser,
  type UserFactoryData,
  type UserPropertyFactoryData,
  type RoleFactoryData,
} from './user';

// Unit factories
export {
  createUnit,
  createUnitWithNumber,
  createUnitsForFloors,
  createUnitWithResidents,
  createBuilding,
  createVacantUnit,
  createCommercialUnit,
  type UnitFactoryData,
  type BuildingFactoryData,
} from './unit';

// Event factories
export {
  createEventGroup,
  createDefaultEventGroups,
  createEventType,
  createDefaultEventConfig,
  createEvent,
  createClosedEvent,
  createEvents,
  type EventGroupFactoryData,
  type EventTypeFactoryData,
  type EventFactoryData,
} from './event';
