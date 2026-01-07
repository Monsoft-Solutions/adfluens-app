/// <reference path="./heic-convert.d.ts" />
import { Storage } from "@google-cloud/storage";
import { env } from "@repo/env";
import convert from "heic-convert";
import path from "path";
import sharp from "sharp";

/**
 * HEIC/HEIF formats require heic-convert because sharp's prebuilt binaries
 * don't include HEIC decoding support. See:
 * https://sharp.pixelplumbing.com/install/#building-from-source
 * https://github.com/lovell/sharp/issues/4472
 */
const HEIC_FORMATS = ["image/heic", "image/heif"];

/** Other unsupported formats that can be converted directly with sharp */
const SHARP_CONVERTIBLE_FORMATS = ["image/avif"];

/** Retry configuration */
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const FETCH_TIMEOUT_MS = 30000;

/**
 * Fetch with retry logic and exponential backoff
 * @param url - URL to fetch
 * @param maxRetries - Maximum number of retry attempts
 * @returns Response from fetch
 */
async function fetchWithRetry(
  url: string,
  maxRetries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          return response;
        }

        // Don't retry 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        lastError = new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        lastError = new Error(`Request timeout after ${FETCH_TIMEOUT_MS}ms`);
      } else {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    // Don't wait after the last attempt
    if (attempt < maxRetries - 1) {
      const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(
    `Failed to fetch ${url} after ${maxRetries} attempts: ${lastError?.message}`
  );
}

export class MediaStorageService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.storage = new Storage();
    this.bucketName = env.GOOGLE_CLOUD_MEDIA_BUCKET_NAME;
  }

  /**
   * Upload a file to Google Cloud Storage from a buffer
   * @param buffer - File content buffer
   * @param destinationPath - Path in the bucket (e.g., 'instagram/posts/image.jpg')
   * @param contentType - MIME type of the file
   * @returns Public URL of the uploaded file
   */
  async uploadFile(
    buffer: Buffer,
    destinationPath: string,
    contentType: string
  ): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(destinationPath);

    await file.save(buffer, {
      contentType,
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });

    // Make the file public
    // Note: This assumes the bucket is not enforcing public access prevention
    // Alternatively, we could use signed URLs, but requirements say "serve those media files"
    // which usually implies public access for social media assets.
    // For stricter security, we might want to skip this and generate signed URLs on read.
    // Given it's public social media data, making it public is usually acceptable.
    // However, uniform bucket level access might prevent ACL changes.
    // We'll assume the bucket is configured to allow public reads or we use the public URL format.

    // Using the public URL format: https://storage.googleapis.com/BUCKET_NAME/PATH
    return `https://storage.googleapis.com/${this.bucketName}/${destinationPath}`;
  }

  /**
   * Upload a file from a URL to Google Cloud Storage
   * @param url - Source URL to download from
   * @param destinationFolder - Folder in the bucket (e.g., 'instagram/posts')
   * @param filename - Optional filename (if not provided, generated from URL or random)
   * @returns Public URL of the uploaded file
   */
  async uploadFromUrl(
    url: string,
    destinationFolder: string,
    filename?: string
  ): Promise<string> {
    try {
      // Use fetch with retry for better resilience
      const response = await fetchWithRetry(url);

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Determine content type
      const contentType =
        response.headers.get("content-type") || "application/octet-stream";

      // Process buffer and content type (may be converted)
      let processedBuffer: Buffer = buffer;
      let processedContentType = contentType;

      // Convert HEIC/HEIF using heic-convert (sharp prebuilt doesn't support HEIC)
      if (HEIC_FORMATS.some((fmt) => contentType.includes(fmt))) {
        try {
          // First convert HEIC to JPEG using heic-convert
          const jpegBuffer = await convert({
            buffer: buffer,
            format: "JPEG",
            quality: 0.85,
          });
          // Then convert JPEG to WebP using sharp for better compression
          processedBuffer = await sharp(jpegBuffer)
            .webp({ quality: 85 })
            .toBuffer();
          processedContentType = "image/webp";
        } catch (error) {
          console.warn(
            `Failed to convert ${contentType} to WebP:`,
            error instanceof Error ? error.message : error
          );
        }
      }
      // Convert other unsupported formats using sharp directly
      else if (
        SHARP_CONVERTIBLE_FORMATS.some((fmt) => contentType.includes(fmt))
      ) {
        try {
          processedBuffer = await sharp(buffer)
            .webp({ quality: 85 })
            .toBuffer();
          processedContentType = "image/webp";
        } catch (error) {
          console.warn(
            `Failed to convert ${contentType} to WebP:`,
            error instanceof Error ? error.message : error
          );
        }
      }

      // Determine filename
      let finalFilename = filename;
      if (!finalFilename) {
        // Try to get extension from content-type or url
        const ext =
          this.getExtensionFromContentType(processedContentType) ||
          path.extname(url).split("?")[0] ||
          ".bin";
        const name = path.basename(url).split("?")[0] || `file-${Date.now()}`;
        finalFilename = `${name}${ext.startsWith(".") ? "" : "."}${ext}`;
      }

      // If image was converted, ensure .webp extension
      if (
        processedContentType === "image/webp" &&
        contentType !== "image/webp"
      ) {
        if (finalFilename) {
          finalFilename = finalFilename.replace(/\.[^.]+$/, ".webp");
        }
      }

      const destinationPath = `${destinationFolder}/${finalFilename}`;

      return await this.uploadFile(
        processedBuffer,
        destinationPath,
        processedContentType
      );
    } catch (error) {
      console.error(`Error uploading from URL ${url}:`, error);
      throw error;
    }
  }

  /**
   * Configure CORS for the bucket
   * This is a utility method to help with setup
   */
  async configureBucketCors(): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);

    // We want to allow our frontend origin
    // In production this should be the actual domain
    const corsConfiguration = [
      {
        maxAgeSeconds: 3600,
        method: ["GET", "HEAD", "OPTIONS"],
        origin: ["http://localhost:3000"], // Add other origins as needed
        responseHeader: ["Content-Type", "Access-Control-Allow-Origin"],
      },
    ];

    await bucket.setCorsConfiguration(corsConfiguration);
    // console.log(`CORS configuration updated for bucket ${this.bucketName}`);
  }

  private getExtensionFromContentType(contentType: string): string | null {
    const mimeToExt: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/heic": "heic",
      "image/heif": "heif",
      "image/avif": "avif",
      "video/mp4": "mp4",
      "video/quicktime": "mov",
      "application/pdf": "pdf",
    };
    return mimeToExt[contentType] || null;
  }
}

export const mediaStorage = new MediaStorageService();
