/**
 * File Upload Storage Service — Presigned URL generation for S3
 *
 * Handles secure file uploads for maintenance request photos/documents,
 * package photos, incident reports, and library documents.
 *
 * Path structure: {propertyId}/{module}/{YYYY-MM}/{uuid}.{ext}
 *
 * In dev mode (no AWS_S3_BUCKET), returns placeholder local URLs
 * so developers can work without AWS credentials.
 *
 * @module server/storage
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Allowed MIME types mapped to their file extensions. */
export const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};

/** File extensions that are explicitly blocked. */
const BLOCKED_EXTENSIONS = new Set(['exe', 'sh', 'bat', 'js', 'cmd', 'com', 'msi', 'vbs', 'ps1']);

/** Maximum file sizes by category (bytes). */
export const MAX_FILE_SIZES = {
  image: 4 * 1024 * 1024, // 4 MB
  document: 10 * 1024 * 1024, // 10 MB
} as const;

/** Valid modules that support file uploads. */
export const UPLOAD_MODULES = ['maintenance', 'packages', 'incidents', 'library'] as const;
export type UploadModule = (typeof UPLOAD_MODULES)[number];

/** Presigned URL expiration (seconds). */
const PRESIGNED_URL_EXPIRY = 3600; // 1 hour

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PresignedUploadRequest {
  /** S3 object key (or leave empty to auto-generate). */
  key?: string;
  /** MIME content type of the file. */
  contentType: string;
  /** Max allowed file size in bytes (overrides default if provided). */
  maxSize?: number;
  /** Property ID for path generation. */
  propertyId?: string;
  /** Module for path generation. */
  module?: UploadModule;
}

export interface PresignedUploadResult {
  /** The presigned URL to upload to. */
  url: string;
  /** The S3 object key for the uploaded file. */
  key: string;
  /** Additional fields for multipart form upload (S3 POST). */
  fields: Record<string, string>;
}

export interface PresignedDownloadResult {
  /** The presigned download URL. */
  url: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isImageContentType(contentType: string): boolean {
  return contentType.startsWith('image/');
}

function getExtensionFromFileName(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1]!.toLowerCase() : '';
}

/**
 * Validates that a content type is in the allowlist and the file extension
 * is not blocked. Returns the file extension on success.
 */
export function validateFileType(contentType: string, fileName?: string): string {
  const ext = ALLOWED_CONTENT_TYPES[contentType];
  if (!ext) {
    throw new FileValidationError(
      `File type "${contentType}" is not allowed. Allowed types: ${Object.values(ALLOWED_CONTENT_TYPES).join(', ')}`,
    );
  }

  // Also check filename extension if provided
  if (fileName) {
    const fileExt = getExtensionFromFileName(fileName);
    if (BLOCKED_EXTENSIONS.has(fileExt)) {
      throw new FileValidationError(`File extension ".${fileExt}" is not allowed.`);
    }
  }

  return ext;
}

/**
 * Validates file size against the limits for the content type category.
 */
export function validateFileSize(contentType: string, size: number): void {
  const limit = isImageContentType(contentType) ? MAX_FILE_SIZES.image : MAX_FILE_SIZES.document;
  if (size > limit) {
    const limitMB = limit / (1024 * 1024);
    const category = isImageContentType(contentType) ? 'images' : 'documents';
    throw new FileValidationError(`File size exceeds the ${limitMB}MB limit for ${category}.`);
  }
}

/**
 * Generates a unique S3 key with property/module/date path structure.
 *
 * Format: {propertyId}/{module}/{YYYY-MM}/{uuid}.{ext}
 */
export function generateStorageKey(propertyId: string, module: string, ext: string): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const uuid = randomUUID();
  return `${propertyId}/${module}/${yearMonth}/${uuid}.${ext}`;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileValidationError';
  }
}

// ---------------------------------------------------------------------------
// S3 Client (lazy singleton)
// ---------------------------------------------------------------------------

let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: process.env.AWS_S3_REGION || 'ca-central-1',
      credentials:
        process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.S3_ACCESS_KEY_ID,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }
  return _s3Client;
}

/** Reset client (for testing). */
export function resetS3Client(): void {
  _s3Client = null;
}

// ---------------------------------------------------------------------------
// Dev mode helpers
// ---------------------------------------------------------------------------

function isDevMode(): boolean {
  return !process.env.AWS_S3_BUCKET;
}

function devUploadResult(key: string, contentType: string): PresignedUploadResult {
  return {
    url: `http://localhost:3000/api/v1/upload/local/${key}`,
    key,
    fields: {
      'Content-Type': contentType,
      'x-dev-mode': 'true',
    },
  };
}

function devDownloadResult(key: string): PresignedDownloadResult {
  return {
    url: `http://localhost:3000/api/v1/upload/local/${key}`,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a presigned URL for uploading a file to S3.
 *
 * Validates content type and enforces size limits before generating the URL.
 * In dev mode (no AWS_S3_BUCKET), returns a local placeholder URL.
 */
export async function generatePresignedUploadUrl(
  request: PresignedUploadRequest,
): Promise<PresignedUploadResult> {
  const { contentType, maxSize, propertyId, module } = request;

  // Validate content type
  const ext = validateFileType(contentType);

  // Validate size if provided
  if (maxSize !== undefined) {
    validateFileSize(contentType, maxSize);
  }

  // Generate key if not provided
  const key = request.key || generateStorageKey(propertyId || 'unknown', module || 'general', ext);

  // Dev mode: return local URLs
  if (isDevMode()) {
    return devUploadResult(key, contentType);
  }

  // Generate presigned PUT URL
  const bucket = process.env.AWS_S3_BUCKET!;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(getS3Client(), command, {
    expiresIn: PRESIGNED_URL_EXPIRY,
  });

  return {
    url,
    key,
    fields: {
      'Content-Type': contentType,
    },
  };
}

/**
 * Generates a presigned URL for downloading a file from S3.
 *
 * In dev mode (no AWS_S3_BUCKET), returns a local placeholder URL.
 */
export async function generatePresignedDownloadUrl(key: string): Promise<PresignedDownloadResult> {
  if (isDevMode()) {
    return devDownloadResult(key);
  }

  const bucket = process.env.AWS_S3_BUCKET!;
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const url = await getSignedUrl(getS3Client(), command, {
    expiresIn: PRESIGNED_URL_EXPIRY,
  });

  return { url };
}

/**
 * Deletes a file from S3 storage.
 *
 * In dev mode (no AWS_S3_BUCKET), returns successfully (no-op).
 */
export async function deleteFile(key: string): Promise<void> {
  if (isDevMode()) {
    return;
  }

  const bucket = process.env.AWS_S3_BUCKET!;
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await getS3Client().send(command);
}
