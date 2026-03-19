/**
 * Upload API Route — Presigned URL generation for file uploads
 *
 * POST /api/v1/upload
 *   Accepts: { module, fileName, contentType }
 *   Returns: { url, key, fields } presigned upload URL
 *
 * Requires authentication. Validates file type and module.
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/server/middleware/api-guard';
import {
  generatePresignedUploadUrl,
  validateFileType,
  FileValidationError,
  UPLOAD_MODULES,
  type UploadModule,
} from '@/server/storage';

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { module, fileName, contentType } = body as {
      module?: string;
      fileName?: string;
      contentType?: string;
    };

    // Validate required fields
    if (!module || !fileName || !contentType) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'module, fileName, and contentType are required.',
        },
        { status: 400 },
      );
    }

    // Validate module
    if (!UPLOAD_MODULES.includes(module as UploadModule)) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Invalid module "${module}". Allowed: ${UPLOAD_MODULES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Validate file type (also checks filename extension)
    try {
      validateFileType(contentType, fileName);
    } catch (err) {
      if (err instanceof FileValidationError) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: err.message },
          { status: 400 },
        );
      }
      throw err;
    }

    // Generate presigned upload URL
    const result = await generatePresignedUploadUrl({
      contentType,
      propertyId: auth.user.propertyId,
      module: module as UploadModule,
    });

    return NextResponse.json({
      data: {
        url: result.url,
        key: result.key,
        fields: result.fields,
      },
    });
  } catch (error) {
    console.error('POST /api/v1/upload error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to generate upload URL.' },
      { status: 500 },
    );
  }
}
