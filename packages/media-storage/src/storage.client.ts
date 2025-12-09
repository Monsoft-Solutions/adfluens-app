import { Storage } from "@google-cloud/storage";
import { env } from "@repo/env";
import path from "path";

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
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch image from ${url}: ${response.statusText}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Determine content type
      const contentType =
        response.headers.get("content-type") || "application/octet-stream";

      // Determine filename
      let finalFilename = filename;
      if (!finalFilename) {
        // Try to get extension from content-type or url
        const ext =
          this.getExtensionFromContentType(contentType) ||
          path.extname(url).split("?")[0] ||
          ".bin";
        const name = path.basename(url).split("?")[0] || `file-${Date.now()}`;
        finalFilename = `${name}${ext.startsWith(".") ? "" : "."}${ext}`;
      }

      const destinationPath = `${destinationFolder}/${finalFilename}`;

      return await this.uploadFile(buffer, destinationPath, contentType);
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
      "video/mp4": "mp4",
      "video/quicktime": "mov",
      "application/pdf": "pdf",
    };
    return mimeToExt[contentType] || null;
  }
}

export const mediaStorage = new MediaStorageService();
