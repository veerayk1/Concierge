/**
 * In-memory demo data store.
 *
 * Provides CRUD over demo entities so the platform can be demoed
 * without a running database.  Data lives for the duration of the
 * server process and resets on restart — perfect for sales demos.
 */

import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Store singleton
// ---------------------------------------------------------------------------

type Entity = Record<string, unknown>;

class DemoDataStore {
  private data = new Map<string, Entity[]>();

  // --- Seed helpers --------------------------------------------------------

  seed(entity: string, rows: Entity[]) {
    this.data.set(entity, rows);
  }

  // --- Read ----------------------------------------------------------------

  getAll(
    entity: string,
    opts?: {
      where?: Record<string, unknown>;
      search?: { fields: string[]; query: string };
      page?: number;
      pageSize?: number;
    },
  ): {
    data: Entity[];
    meta?: { page: number; pageSize: number; total: number; totalPages: number };
  } {
    let rows = [...(this.data.get(entity) ?? [])];

    // Simple where-clause filter
    if (opts?.where) {
      for (const [key, value] of Object.entries(opts.where)) {
        if (value === undefined || value === null) continue;
        rows = rows.filter((r) => r[key] === value);
      }
    }

    // Text search
    if (opts?.search && opts.search.query) {
      const q = opts.search.query.toLowerCase();
      rows = rows.filter((r) =>
        opts.search!.fields.some((f) => {
          const v = r[f];
          return typeof v === 'string' && v.toLowerCase().includes(q);
        }),
      );
    }

    const total = rows.length;

    // Pagination
    if (opts?.page && opts?.pageSize) {
      const start = (opts.page - 1) * opts.pageSize;
      rows = rows.slice(start, start + opts.pageSize);
      return {
        data: rows,
        meta: {
          page: opts.page,
          pageSize: opts.pageSize,
          total,
          totalPages: Math.ceil(total / opts.pageSize),
        },
      };
    }

    return { data: rows };
  }

  getById(entity: string, id: string): Entity | undefined {
    return (this.data.get(entity) ?? []).find((r) => r.id === id);
  }

  // --- Write (session-scoped) ----------------------------------------------

  create(entity: string, row: Entity): Entity {
    const record = { id: randomUUID(), createdAt: new Date().toISOString(), ...row };
    const list = this.data.get(entity) ?? [];
    list.unshift(record); // newest first
    this.data.set(entity, list);
    return record;
  }

  update(entity: string, id: string, patch: Partial<Entity>): Entity | undefined {
    const list = this.data.get(entity) ?? [];
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    return list[idx];
  }

  delete(entity: string, id: string): boolean {
    const list = this.data.get(entity) ?? [];
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    return true;
  }

  // --- Aggregation helpers -------------------------------------------------

  count(entity: string, where?: Record<string, unknown>): number {
    return this.getAll(entity, { where }).data.length;
  }
}

// ---------------------------------------------------------------------------
// Singleton — persisted on globalThis to survive Next.js hot-reloads
// ---------------------------------------------------------------------------

const globalForDemo = globalThis as unknown as { __demoStore?: DemoDataStore };

export function getDemoStore(): DemoDataStore {
  if (!globalForDemo.__demoStore) {
    globalForDemo.__demoStore = new DemoDataStore();
    // Lazy-import the initialiser to avoid circular deps
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { seedDemoData } = require('./demo-data-init');
    seedDemoData(globalForDemo.__demoStore);
  }
  return globalForDemo.__demoStore;
}

export type { DemoDataStore };
