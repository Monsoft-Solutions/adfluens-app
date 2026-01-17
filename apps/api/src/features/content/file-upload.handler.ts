/**
 * File Upload Handler
 *
 * Express route handler for uploading files from the user's computer.
 * Uses multer for multipart/form-data parsing and GCS for storage.
 */

import type { Request, Response } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { auth } from "@repo/auth";
import { memberTable, organizationTable } from "@repo/auth/schema";
import { db, eq, and } from "@repo/db";
import { mediaStorage } from "@repo/media-storage";
import { Logger } from "@repo/logger";
import sharp from "sharp";

const logger = new Logger({ context: "file-upload" });

// Allowed MIME types for file uploads
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
]);

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Max files per upload: 10
const MAX_FILES = 10;

// Configure multer with memory storage
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type ${file.mimetype} is not allowed. Allowed types: ${Array.from(ALLOWED_MIME_TYPES).join(", ")}`
      )
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

type UploadedFileResult = {
  url: string;
  storedUrl: string;
  width: number | null;
  height: number | null;
  mimeType: string;
};

/**
 * Handler for POST /api/content/upload
 *
 * Accepts multipart/form-data with files and organizationId.
 * Returns array of uploaded file metadata.
 */
export async function handleFileUpload(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Authenticate user via Better Auth session
    // Convert IncomingHttpHeaders to Headers for better-auth compatibility
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
    }
    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Get organization ID from request body
    const organizationId = req.body.organizationId;

    if (!organizationId || typeof organizationId !== "string") {
      res.status(400).json({ error: "organizationId is required" });
      return;
    }

    // Verify user has access to the organization
    const [membership] = await db
      .select()
      .from(memberTable)
      .where(
        and(
          eq(memberTable.userId, session.user.id),
          eq(memberTable.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!membership) {
      res.status(403).json({ error: "Access denied to this organization" });
      return;
    }

    // Verify organization exists
    const [organization] = await db
      .select()
      .from(organizationTable)
      .where(eq(organizationTable.id, organizationId))
      .limit(1);

    if (!organization) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    // Get uploaded files
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    logger.info("Processing file uploads", {
      userId: session.user.id,
      organizationId,
      fileCount: files.length,
    });

    // Process and upload each file
    const uploadPromises = files.map(
      async (file): Promise<UploadedFileResult> => {
        // Generate unique path for file
        const uploadId = randomUUID();
        const extension = getExtensionFromMimeType(file.mimetype);
        const filename = `${uploadId}${extension}`;
        const storagePath = `content/${organizationId}/uploads/${filename}`;

        // Get image dimensions using sharp
        let width: number | null = null;
        let height: number | null = null;

        try {
          const metadata = await sharp(file.buffer).metadata();
          width = metadata.width ?? null;
          height = metadata.height ?? null;
        } catch (err) {
          logger.warn("Failed to get image dimensions", {
            filename: file.originalname,
            error: err instanceof Error ? err.message : err,
          });
        }

        // Upload to GCS
        const storedUrl = await mediaStorage.uploadFile(
          file.buffer,
          storagePath,
          file.mimetype
        );

        return {
          url: storedUrl, // Original and stored are the same since we upload directly
          storedUrl,
          width,
          height,
          mimeType: file.mimetype,
        };
      }
    );

    const results = await Promise.all(uploadPromises);

    logger.info("File uploads completed", {
      userId: session.user.id,
      organizationId,
      uploadedCount: results.length,
    });

    res.json({ files: results });
  } catch (error) {
    logger.error("File upload failed", error);

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res
          .status(400)
          .json({
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          });
        return;
      }
      if (error.code === "LIMIT_FILE_COUNT") {
        res
          .status(400)
          .json({ error: `Too many files. Maximum is ${MAX_FILES} files` });
        return;
      }
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : "Upload failed",
    });
  }
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
  };
  return mimeToExt[mimeType] || ".bin";
}
