import { v2 as cloudinary } from "cloudinary";
import * as fs from "fs";
import * as path from "path";

// Temp directory for large file uploads
export const UPLOAD_TEMP_DIR = path.join(process.cwd(), "tmp", "uploads");

// Ensure temp directory exists
if (!fs.existsSync(UPLOAD_TEMP_DIR)) {
  fs.mkdirSync(UPLOAD_TEMP_DIR, { recursive: true });
}

if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  console.warn(`
⚠️  Cloudinary is not configured!

To enable media uploads, add these secrets:
1. CLOUDINARY_CLOUD_NAME - Your Cloudinary cloud name
2. CLOUDINARY_API_KEY - Your Cloudinary API key
3. CLOUDINARY_API_SECRET - Your Cloudinary API secret

Get these from https://cloudinary.com/console
`);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",       // iOS HEIC format
  "image/heif",       // HEIF format
  "image/bmp",        // BMP images
  "image/tiff",       // TIFF images
  "image/svg+xml",    // SVG images
  "application/octet-stream",  // Fallback for unknown types
];

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",      // M4V video
  "video/3gpp",       // 3GP mobile video
  "video/3gpp2",      // 3G2 mobile video
  "video/x-msvideo",  // AVI
  "video/mpeg",       // MPEG
  "video/ogg",        // OGG video
  "video/x-matroska", // MKV video
  "video/x-flv",      // FLV video
  "video/x-ms-wmv",   // WMV video
  "application/octet-stream",  // Fallback for unknown types
];

export const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",      // mp3
  "audio/mp4",       // m4a
  "audio/x-m4a",     // m4a alternative
  "audio/m4a",       // m4a variant
  "audio/wav",
  "audio/x-wav",     // wav alternative
  "audio/webm",
  "audio/ogg",
  "audio/aac",
  "audio/x-aac",     // aac alternative
  "audio/3gpp",      // Android recordings
  "audio/3gpp2",     // Android recordings
  "audio/amr",       // Android older format
  "audio/amr-wb",    // Android wideband
  "audio/x-caf",     // iOS Core Audio Format
  "audio/caf",       // iOS caf variant
  "audio/flac",      // FLAC audio
  "audio/x-flac",    // FLAC alternative
];

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB for images (increased limit)
export const MAX_VIDEO_SIZE = 2048 * 1024 * 1024; // 2GB for videos (Cloudinary limit)
export const MAX_AUDIO_SIZE = 1024 * 1024 * 1024; // 1GB for audio (increased limit)

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format: string;
  resourceType: string;
  duration?: number; // Duration in seconds for video/audio
  thumbnailUrl?: string; // Auto-generated thumbnail for video
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `rabitchat/${folder}`,
        resource_type: resourceType,
        timeout: 600000,
        transformation: resourceType === "image" ? [
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ] : undefined,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          let thumbnailUrl: string | undefined;
          
          if (result.resource_type === "video") {
            thumbnailUrl = result.secure_url
              .replace(/\.[^.]+$/, ".jpg")
              .replace("/video/upload/", "/video/upload/so_0,w_400,h_400,c_fill/");
          }
          
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            resourceType: result.resource_type,
            duration: result.duration,
            thumbnailUrl,
          });
        } else {
          reject(new Error("Upload failed with no result"));
        }
      }
    );
    
    uploadStream.end(buffer);
  });
}

export async function uploadToCloudinaryFromFile(
  filePath: string,
  folder: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const fileSize = fs.statSync(filePath).size;
    const isLargeFile = fileSize > 100 * 1024 * 1024;
    
    console.log(`[Cloudinary] Uploading file: ${filePath}, size: ${(fileSize / 1024 / 1024).toFixed(2)}MB, large: ${isLargeFile}`);
    
    const uploadOptions: any = {
      folder: `rabitchat/${folder}`,
      resource_type: resourceType,
      timeout: 600000,
      transformation: resourceType === "image" ? [
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ] : undefined,
    };

    if (isLargeFile) {
      uploadOptions.chunk_size = 20 * 1024 * 1024;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error("[Cloudinary] Upload error:", error.message);
          reject(error);
        } else if (result) {
          let thumbnailUrl: string | undefined;
          
          if (result.resource_type === "video") {
            thumbnailUrl = result.secure_url
              .replace(/\.[^.]+$/, ".jpg")
              .replace("/video/upload/", "/video/upload/so_0,w_400,h_400,c_fill/");
          }
          
          console.log(`[Cloudinary] Upload successful: ${result.public_id}`);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            resourceType: result.resource_type,
            duration: result.duration,
            thumbnailUrl,
          });
        } else {
          reject(new Error("Upload failed with no result"));
        }
      }
    );

    const readStream = fs.createReadStream(filePath, { highWaterMark: 2 * 1024 * 1024 });
    
    readStream.on("error", (err) => {
      console.error("[Cloudinary] Read stream error:", err.message);
      reject(new Error(`Failed to read file: ${err.message}`));
    });
    
    readStream.pipe(uploadStream);
  });
}

export function cleanupTempFile(filePath: string): void {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Cleanup] Removed temp file: ${filePath}`);
    }
  } catch (error) {
    console.error(`[Cleanup] Failed to remove temp file: ${filePath}`, error);
  }
}

export function cleanupOldTempFiles(maxAgeMinutes: number = 60): void {
  try {
    if (!fs.existsSync(UPLOAD_TEMP_DIR)) return;
    
    const files = fs.readdirSync(UPLOAD_TEMP_DIR);
    const now = Date.now();
    const maxAge = maxAgeMinutes * 60 * 1000;
    
    for (const file of files) {
      const filePath = path.join(UPLOAD_TEMP_DIR, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`[Cleanup] Removed old temp file: ${file}`);
        }
      } catch (e) {
        // Ignore errors for individual files
      }
    }
  } catch (error) {
    console.error("[Cleanup] Error cleaning temp files:", error);
  }
}

export function generateAudioThumbnailUrl(): string {
  // Return a default waveform/audio icon placeholder
  // In production, this could be a custom waveform generator
  return "https://res.cloudinary.com/demo/image/upload/v1/samples/audio-placeholder.png";
}

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Generate signed upload parameters for direct client-to-Cloudinary uploads
export function generateSignedUploadParams(
  folder: string,
  resourceType: "image" | "video" | "raw" = "video"
): {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadPreset?: string;
} {
  const timestamp = Math.round(Date.now() / 1000);
  
  const paramsToSign: Record<string, string | number> = {
    folder: `rabitchat/${folder}`,
    timestamp,
  };
  
  // Generate signature
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );
  
  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder: `rabitchat/${folder}`,
  };
}

// Get the direct upload URL for Cloudinary
export function getCloudinaryUploadUrl(resourceType: "image" | "video" | "raw" = "video"): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
}

export default cloudinary;
