/**
 * Global Search API — per PRD 15 Search & Navigation
 *
 * GET  /api/v1/search         — Search across modules with filters & pagination
 * GET  /api/v1/search?recent  — Get recent search history
 * DELETE /api/v1/search       — Clear search history
 *
 * Supports:
 * - Type filter (users, units, packages, events, announcements)
 * - Date range filter (from/to)
 * - Status filter
 * - Relevance scoring & text highlighting
 * - Recent search history (save/retrieve/clear)
 * - Pagination (page/limit params)
 * - Special character safety
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { parsePagination, buildPaginationMeta } from '@/lib/pagination';
import { appCache } from '@/server/cache';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SearchModule = 'users' | 'units' | 'packages' | 'events' | 'announcements';

interface SearchResult {
  id: string;
  type: SearchModule;
  title: string;
  subtitle?: string;
  status?: string;
  score: number;
  highlights: Record<string, string>;
}

const ALL_MODULES: SearchModule[] = ['users', 'units', 'packages', 'events', 'announcements'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Computes a simple relevance score based on where the query matches.
 * Exact match on key field = 1.0, partial = 0.5-0.8
 */
function computeScore(fields: Record<string, string | null | undefined>, query: string): number {
  const q = query.toLowerCase();
  let maxScore = 0;

  for (const value of Object.values(fields)) {
    if (!value) continue;
    const v = value.toLowerCase();
    if (v === q) {
      maxScore = Math.max(maxScore, 1.0);
    } else if (v.startsWith(q)) {
      maxScore = Math.max(maxScore, 0.8);
    } else if (v.includes(q)) {
      maxScore = Math.max(maxScore, 0.5);
    }
  }

  return maxScore;
}

/**
 * Builds highlight map — wraps matching text in <mark> tags.
 */
function buildHighlights(
  fields: Record<string, string | null | undefined>,
  query: string,
): Record<string, string> {
  const highlights: Record<string, string> = {};
  const q = query.toLowerCase();

  for (const [key, value] of Object.entries(fields)) {
    if (!value) continue;
    const idx = value.toLowerCase().indexOf(q);
    if (idx !== -1) {
      const before = value.slice(0, idx);
      const match = value.slice(idx, idx + query.length);
      const after = value.slice(idx + query.length);
      highlights[key] = `${before}<mark>${match}</mark>${after}`;
    }
  }

  return highlights;
}

/**
 * Builds date range filter for createdAt if from/to are provided.
 */
function buildDateFilter(from?: string | null, to?: string | null) {
  if (!from && !to) return undefined;
  const filter: { gte?: Date; lte?: Date } = {};
  if (from) filter.gte = new Date(from);
  if (to) filter.lte = new Date(to);
  return filter;
}

// ---------------------------------------------------------------------------
// GET /api/v1/search
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);

    // --- Recent searches mode ---
    if (searchParams.get('recent') === 'true') {
      const recentSearches = await prisma.searchHistory.findMany({
        where: { userId: auth.user.userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      return NextResponse.json({ data: { recentSearches } });
    }

    // --- Search mode ---
    const propertyId = searchParams.get('propertyId');
    const q = searchParams.get('q') || '';
    const typeFilter = searchParams.get('type') as SearchModule | null;
    const statusFilter = searchParams.get('status');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // Check cache for search results (keyed on full query params)
    const searchCacheKey = `search:${propertyId}:${q}:${typeFilter ?? 'all'}:${statusFilter ?? ''}:${fromDate ?? ''}:${toDate ?? ''}:${searchParams.get('page') ?? '1'}:${searchParams.get('limit') ?? ''}`;
    const cachedSearch = appCache.get(searchCacheKey);
    if (cachedSearch && propertyId && q && q.length >= 2) {
      return NextResponse.json(cachedSearch, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    // Empty or too-short query returns empty results (not everything)
    if (!propertyId || !q || q.length < 2) {
      return NextResponse.json({
        data: { users: [], units: [], packages: [], events: [], announcements: [], results: [] },
      });
    }

    // Determine which modules to search
    const modules: SearchModule[] =
      typeFilter && ALL_MODULES.includes(typeFilter) ? [typeFilter] : ALL_MODULES;

    // Parse pagination
    const { page, limit, skip } = parsePagination(searchParams);
    const hasExplicitLimit = searchParams.has('limit');
    // In typeahead mode (no type filter, no explicit limit), cap at 5 per module
    const perModuleLimit = typeFilter ? limit : hasExplicitLimit ? limit : 5;
    const dateFilter = buildDateFilter(fromDate, toDate);

    // Build queries for each module
    const searchPromises: Array<
      Promise<{ items: unknown[]; count: number; module: SearchModule }>
    > = [];

    if (modules.includes('users')) {
      const where: Record<string, unknown> = {
        deletedAt: null,
        userProperties: { some: { propertyId, deletedAt: null } },
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      };
      if (dateFilter) where.createdAt = dateFilter;

      searchPromises.push(
        Promise.all([
          prisma.user.findMany({
            where,
            select: { id: true, firstName: true, lastName: true, email: true },
            take: perModuleLimit,
            ...(typeFilter ? { skip } : {}),
          }),
          typeFilter ? prisma.user.count({ where }) : Promise.resolve(0),
        ]).then(([items, count]) => ({ items, count, module: 'users' as const })),
      );
    }

    if (modules.includes('units')) {
      const where: Record<string, unknown> = {
        propertyId,
        deletedAt: null,
        number: { contains: q, mode: 'insensitive' },
      };
      if (statusFilter) where.status = statusFilter;
      if (dateFilter) where.createdAt = dateFilter;

      searchPromises.push(
        Promise.all([
          prisma.unit.findMany({
            where,
            select: { id: true, number: true, status: true },
            take: perModuleLimit,
            ...(typeFilter ? { skip } : {}),
          }),
          typeFilter ? prisma.unit.count({ where }) : Promise.resolve(0),
        ]).then(([items, count]) => ({ items, count, module: 'units' as const })),
      );
    }

    if (modules.includes('packages')) {
      const where: Record<string, unknown> = {
        propertyId,
        deletedAt: null,
        OR: [
          { referenceNumber: { contains: q, mode: 'insensitive' } },
          { trackingNumber: { contains: q, mode: 'insensitive' } },
        ],
      };
      if (statusFilter) where.status = statusFilter;
      if (dateFilter) where.createdAt = dateFilter;

      searchPromises.push(
        Promise.all([
          prisma.package.findMany({
            where,
            select: { id: true, referenceNumber: true, status: true },
            take: perModuleLimit,
            ...(typeFilter ? { skip } : {}),
          }),
          typeFilter ? prisma.package.count({ where }) : Promise.resolve(0),
        ]).then(([items, count]) => ({ items, count, module: 'packages' as const })),
      );
    }

    if (modules.includes('events')) {
      const where: Record<string, unknown> = {
        propertyId,
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { referenceNo: { contains: q, mode: 'insensitive' } },
        ],
      };
      if (statusFilter) where.status = statusFilter;
      if (dateFilter) where.createdAt = dateFilter;

      searchPromises.push(
        Promise.all([
          prisma.event.findMany({
            where,
            select: { id: true, title: true, referenceNo: true, status: true },
            take: perModuleLimit,
            ...(typeFilter ? { skip } : {}),
          }),
          typeFilter ? prisma.event.count({ where }) : Promise.resolve(0),
        ]).then(([items, count]) => ({ items, count, module: 'events' as const })),
      );
    }

    if (modules.includes('announcements')) {
      const where: Record<string, unknown> = {
        propertyId,
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      };
      if (statusFilter) where.status = statusFilter;
      if (dateFilter) where.createdAt = dateFilter;

      searchPromises.push(
        Promise.all([
          prisma.announcement.findMany({
            where,
            select: { id: true, title: true, status: true },
            take: perModuleLimit,
            ...(typeFilter ? { skip } : {}),
          }),
          typeFilter ? prisma.announcement.count({ where }) : Promise.resolve(0),
        ]).then(([items, count]) => ({ items, count, module: 'announcements' as const })),
      );
    }

    const moduleResults = await Promise.all(searchPromises);

    // Build categorized results (backwards compatible)
    const data: Record<string, unknown[]> = {
      users: [],
      units: [],
      packages: [],
      events: [],
      announcements: [],
    };

    let totalCount = 0;

    for (const { items, count, module } of moduleResults) {
      data[module] = items;
      totalCount += typeFilter ? count : items.length;
    }

    // Build combined results with relevance scoring
    const combinedResults: SearchResult[] = [];

    for (const { items, module } of moduleResults) {
      for (const item of items as Record<string, string | null | undefined>[]) {
        const fields = getSearchableFields(item, module);
        const score = computeScore(fields, q);
        const highlights = buildHighlights(fields, q);

        combinedResults.push({
          id: item.id ?? '',
          type: module,
          title: getTitle(item, module),
          subtitle: getSubtitle(item, module),
          status: (item.status as string) ?? undefined,
          score,
          highlights,
        });
      }
    }

    // Sort combined results by relevance score descending
    combinedResults.sort((a, b) => b.score - a.score);

    // Save search to history (fire and forget, don't block response)
    try {
      prisma.searchHistory
        ?.create({
          data: {
            query: q,
            userId: auth.user.userId,
            propertyId,
          },
        })
        ?.catch(() => {
          // Silently ignore history save failures
        });
    } catch {
      // Silently ignore if searchHistory model is unavailable
    }

    // Build response
    const meta = typeFilter
      ? buildPaginationMeta({ total: totalCount, page, limit })
      : { totalResults: totalCount };

    const searchResponseBody = {
      data: { ...data, results: combinedResults },
      meta,
    };

    // Cache search results for 60 seconds
    appCache.set(searchCacheKey, searchResponseBody, {
      ttl: 60,
      tags: [`property:${propertyId}`, 'module:search'],
    });

    return NextResponse.json(searchResponseBody);
  } catch (error) {
    console.error('GET /api/v1/search error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Search failed' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/search — Clear search history
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    await prisma.searchHistory.deleteMany({
      where: { userId: auth.user.userId },
    });

    return NextResponse.json({ data: { cleared: true } });
  } catch (error) {
    console.error('DELETE /api/v1/search error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to clear search history' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Field Mapping Helpers
// ---------------------------------------------------------------------------

function getSearchableFields(
  item: Record<string, string | null | undefined>,
  module: SearchModule,
): Record<string, string | null | undefined> {
  switch (module) {
    case 'users':
      return { firstName: item.firstName, lastName: item.lastName, email: item.email };
    case 'units':
      return { number: item.number };
    case 'packages':
      return { referenceNumber: item.referenceNumber, trackingNumber: item.trackingNumber };
    case 'events':
      return { title: item.title, referenceNo: item.referenceNo };
    case 'announcements':
      return { title: item.title, content: item.content };
    default:
      return {};
  }
}

function getTitle(item: Record<string, string | null | undefined>, module: SearchModule): string {
  switch (module) {
    case 'users':
      return `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim();
    case 'units':
      return `Unit ${item.number ?? ''}`;
    case 'packages':
      return item.referenceNumber ?? '';
    case 'events':
      return item.title ?? '';
    case 'announcements':
      return item.title ?? '';
    default:
      return '';
  }
}

function getSubtitle(
  item: Record<string, string | null | undefined>,
  module: SearchModule,
): string | undefined {
  switch (module) {
    case 'users':
      return item.email ?? undefined;
    case 'packages':
      return item.trackingNumber ?? undefined;
    case 'events':
      return item.referenceNo ?? undefined;
    default:
      return undefined;
  }
}
