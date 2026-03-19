/**
 * Document Library API — per PRD research (all 3 platforms)
 * Manage building documents (rules, forms, minutes, etc.)
 *
 * GET  /api/v1/library — List documents with filters, search, pagination
 * POST /api/v1/library — Upload document metadata (file upload handled via /api/v1/upload)
 *
 * Uses LibraryFile + LibraryFolder Prisma models for real DB persistence.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const DOCUMENT_CATEGORIES = [
  'rules',
  'policies',
  'procedures',
  'minutes',
  'safety',
  'insurance',
  'financials',
  'forms',
  'notices',
  'other',
] as const;

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
];

const uploadDocumentSchema = z.object({
  propertyId: z.string().uuid(),
  folderId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  filePath: z.string().min(1).max(500),
  fileSize: z.number().int().min(0).max(100_000_000), // 100MB limit
  mimeType: z.string().max(100),
  description: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const folderId = searchParams.get('folderId');
    const category = searchParams.get('category');
    const search = searchParams.get('search') || '';
    const isPublic = searchParams.get('isPublic');
    const sortBy = searchParams.get('sortBy') || 'uploadedAt'; // 'name' | 'uploadedAt'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20', 10), 100);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // If folderId is provided, list files in that folder
    // If no folderId, list all files for the property
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileWhere: Record<string, any> = { propertyId };

    if (folderId) fileWhere.folderId = folderId;

    if (search) {
      fileWhere.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Folder-level filtering by category (folder name matching)
    if (category) {
      if (!DOCUMENT_CATEGORIES.includes(category as (typeof DOCUMENT_CATEGORIES)[number])) {
        return NextResponse.json(
          {
            error: 'INVALID_CATEGORY',
            message: `Invalid category. Must be one of: ${DOCUMENT_CATEGORIES.join(', ')}`,
          },
          { status: 400 },
        );
      }
      fileWhere.folder = { name: { equals: category, mode: 'insensitive' } };
    }

    // Sort order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any = sortBy === 'name' ? { fileName: 'asc' } : { createdAt: 'desc' };

    const [files, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.libraryFile.findMany as any)({
        where: fileWhere,
        include: {
          folder: { select: { id: true, name: true, description: true } },
        },
        orderBy,
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.libraryFile.count({
        where: fileWhere,
      } as Parameters<typeof prisma.libraryFile.count>[0]),
    ]);

    // Also fetch folders if listing root or a specific folder's contents
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const folderWhere: Record<string, any> = { propertyId };
    if (folderId) {
      folderWhere.parentFolderId = folderId;
    } else {
      folderWhere.parentFolderId = null; // root-level folders only
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const folders = await (prisma.libraryFolder.findMany as any)({
      where: folderWhere,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { files: true, childFolders: true } },
      },
    });

    // If isPublic filter is set, apply it (placeholder for role-based visibility)
    let filteredFiles = files;
    if (isPublic === 'true' || isPublic === 'false') {
      // For now, all files are treated as accessible if the user has property access
      // Role-based visibility to be implemented via visibleToRoles field in a future schema update
      filteredFiles = files;
    }

    return NextResponse.json({
      data: {
        files: filteredFiles,
        folders,
      },
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/library error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch documents' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager'],
    });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = uploadDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
      return NextResponse.json(
        {
          error: 'INVALID_FILE_TYPE',
          message: `File type ${input.mimeType} is not allowed. Accepted types: PDF, Word, Excel, PowerPoint, text, images.`,
        },
        { status: 400 },
      );
    }

    // Verify folder exists and belongs to this property
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const folder = await (prisma.libraryFolder.findUnique as any)({
      where: { id: input.folderId },
    });
    if (!folder || (folder as { propertyId: string }).propertyId !== input.propertyId) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Folder not found or does not belong to this property' },
        { status: 404 },
      );
    }

    // Create the file record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const file = await (prisma.libraryFile.create as any)({
      data: {
        propertyId: input.propertyId,
        folderId: input.folderId,
        fileName: stripControlChars(stripHtml(input.fileName)),
        filePath: input.filePath,
        fileSize: BigInt(input.fileSize),
        mimeType: input.mimeType,
        description: input.description ? stripControlChars(stripHtml(input.description)) : null,
        version: 1,
        downloadCount: 0,
        uploadedById: auth.user.userId,
      },
    });

    // Serialize BigInt for JSON response
    const serialized = {
      ...file,
      fileSize: Number(file.fileSize),
    };

    return NextResponse.json({ data: serialized, message: 'Document uploaded.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/library error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to upload document' },
      { status: 500 },
    );
  }
}
