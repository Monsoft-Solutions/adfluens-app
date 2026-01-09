declare module "heic-convert" {
  interface ConvertOptions {
    /** Input HEIC/HEIF buffer */
    buffer: Buffer;
    /** Output format */
    format: "JPEG" | "PNG";
    /** Quality for JPEG (0-1), ignored for PNG */
    quality?: number;
  }

  /**
   * Convert HEIC/HEIF image to JPEG or PNG
   * @param options Conversion options
   * @returns Promise resolving to the converted image buffer
   */
  function convert(options: ConvertOptions): Promise<Buffer>;

  export default convert;
}
