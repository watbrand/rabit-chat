import { getApiUrl } from "./query-client";
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

// File size limits (must match server values)
export const MAX_IMAGE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
export const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB

// Threshold for using direct Cloudinary upload (bypasses server for large files)
export const DIRECT_UPLOAD_THRESHOLD = 20 * 1024 * 1024; // 20MB - use direct upload for files larger than this

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Validate file size before upload (saves bandwidth)
export async function validateFileSize(
  uri: string,
  mimeType?: string
): Promise<{ valid: boolean; size: number; maxSize: number; error?: string }> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    
    if (!info.exists) {
      return { valid: false, size: 0, maxSize: 0, error: "File not found" };
    }
    
    const size = info.size ?? 0;
    const isVideo = mimeType?.includes("video") || uri.toLowerCase().includes(".mp4") || uri.toLowerCase().includes(".mov");
    const isAudio = mimeType?.includes("audio") || uri.toLowerCase().includes(".m4a") || uri.toLowerCase().includes(".mp3");
    
    let maxSize: number;
    let fileType: string;
    
    if (isVideo) {
      maxSize = MAX_VIDEO_SIZE;
      fileType = "video";
    } else if (isAudio) {
      maxSize = MAX_AUDIO_SIZE;
      fileType = "audio";
    } else {
      maxSize = MAX_IMAGE_SIZE;
      fileType = "image";
    }
    
    if (size > maxSize) {
      return {
        valid: false,
        size,
        maxSize,
        error: `This ${fileType} is too large (${formatFileSize(size)}). Maximum size is ${formatFileSize(maxSize)}.`,
      };
    }
    
    return { valid: true, size, maxSize };
  } catch (error) {
    // If we can't get file size (web platform), allow upload and let server validate
    console.log("[Upload] Could not validate file size:", error);
    return { valid: true, size: 0, maxSize: MAX_VIDEO_SIZE };
  }
}

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format: string;
  resourceType: string;
  thumbnailUrl?: string;
  durationMs?: number;
  mediaType?: "image" | "video" | "audio";
}

export interface UploadStatus {
  configured: boolean;
  maxImageSize: number;
  maxVideoSize: number;
  maxAudioSize: number;
  allowedImageTypes: string[];
  allowedVideoTypes: string[];
  allowedAudioTypes: string[];
}

export interface UploadProgressCallback {
  (progress: number): void;
}

interface SignedUploadParams {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
}

// Get signed upload parameters from server for direct Cloudinary upload
async function getSignedUploadParams(
  folder: string,
  resourceType: "image" | "video" | "raw"
): Promise<SignedUploadParams> {
  const baseUrl = getApiUrl();
  const url = new URL("/api/upload/sign", baseUrl);
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ folder, resourceType }),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to get upload signature" }));
    throw new Error(error.message || "Failed to get upload signature");
  }
  
  return res.json();
}

// Direct upload to Cloudinary (bypasses server for large files)
async function uploadDirectToCloudinary(
  uri: string,
  folder: string,
  mimeType: string | undefined,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  console.log("[Upload] Using DIRECT Cloudinary upload to bypass server limits");
  
  // Determine resource type
  const isVideo = mimeType?.includes("video") || uri.toLowerCase().includes(".mp4") || uri.toLowerCase().includes(".mov");
  const isAudio = mimeType?.includes("audio") || uri.toLowerCase().includes(".m4a") || uri.toLowerCase().includes(".mp3");
  const resourceType: "image" | "video" | "raw" = isVideo || isAudio ? "video" : "image";
  
  // Get signed params from our server
  const signedParams = await getSignedUploadParams(folder, resourceType);
  console.log("[Upload] Got signed params, uploading to:", signedParams.uploadUrl);
  
  // Normalize URI for upload
  const normalizedUri = await normalizeUriForUpload(uri, mimeType);
  const filename = normalizedUri.split("/").pop() || "upload";
  const type = getMimeType(normalizedUri, mimeType);
  
  return new Promise<UploadResult>((resolve, reject) => {
    const formData = new FormData();
    
    // Add file
    if (Platform.OS === "web") {
      // Web platform - need to fetch blob first
      fetch(uri)
        .then(r => r.blob())
        .then(blob => {
          formData.append("file", blob, filename);
          sendRequest();
        })
        .catch(reject);
    } else {
      formData.append("file", {
        uri: normalizedUri,
        name: filename,
        type,
      } as any);
      sendRequest();
    }
    
    function sendRequest() {
      // Add Cloudinary params
      formData.append("api_key", signedParams.apiKey);
      formData.append("timestamp", String(signedParams.timestamp));
      formData.append("signature", signedParams.signature);
      formData.append("folder", signedParams.folder);
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.min(100, Math.round((event.loaded / event.total) * 100));
          onProgress(progress);
        }
      };
      
      xhr.onload = () => {
        console.log("[Upload] Direct upload complete, status:", xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const cloudinaryResult = JSON.parse(xhr.responseText);
            
            // Generate thumbnail URL for videos (Cloudinary auto-generates video thumbnails)
            let thumbnailUrl: string | undefined;
            if (isVideo && cloudinaryResult.secure_url) {
              // Replace video extension with .jpg and add thumbnail transformation
              thumbnailUrl = cloudinaryResult.secure_url
                .replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.jpg')
                .replace('/upload/', '/upload/so_0,c_fill,w_720,h_900/');
            }
            
            // Transform Cloudinary response to our format
            const result: UploadResult = {
              url: cloudinaryResult.secure_url || cloudinaryResult.url,
              publicId: cloudinaryResult.public_id,
              width: cloudinaryResult.width,
              height: cloudinaryResult.height,
              format: cloudinaryResult.format,
              resourceType: cloudinaryResult.resource_type,
              durationMs: cloudinaryResult.duration ? Math.round(cloudinaryResult.duration * 1000) : undefined,
              mediaType: isVideo ? "video" : isAudio ? "audio" : "image",
              thumbnailUrl,
            };
            resolve(result);
          } catch (e) {
            reject(new Error("Failed to parse Cloudinary response"));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error?.message || `Direct upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Direct upload failed with status ${xhr.status}`));
          }
        }
      };
      
      xhr.onerror = () => {
        console.error("[Upload] Direct upload XHR error");
        reject(new Error("Network error during direct upload"));
      };
      
      xhr.ontimeout = () => {
        reject(new Error("Direct upload timed out"));
      };
      
      xhr.open("POST", signedParams.uploadUrl);
      xhr.timeout = 900000; // 15 minute timeout for large files
      xhr.send(formData);
    }
  });
}

// Get file size for determining upload method
async function getFileSize(uri: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? (info.size ?? 0) : 0;
  } catch {
    return 0;
  }
}

export async function getUploadStatus(): Promise<UploadStatus> {
  const baseUrl = getApiUrl();
  const url = new URL("/api/upload/status", baseUrl);
  
  const res = await fetch(url, {
    credentials: "include",
  });
  
  if (!res.ok) {
    throw new Error("Failed to get upload status");
  }
  
  return res.json();
}

function getMimeType(uri: string, assetMimeType?: string): string {
  if (assetMimeType) {
    return assetMimeType;
  }
  
  const filename = uri.split("/").pop() || "";
  const ext = filename.split(".").pop()?.toLowerCase();
  
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
    aac: "audio/aac",
    ogg: "audio/ogg",
    "3gp": "audio/3gpp",
    caf: "audio/x-caf",
  };
  
  return ext && mimeMap[ext] ? mimeMap[ext] : "application/octet-stream";
}

async function normalizeUriForUpload(uri: string, mimeType?: string): Promise<string> {
  console.log("[Upload] normalizeUriForUpload - Platform:", Platform.OS, "URI:", uri, "MimeType:", mimeType);
  
  const isVideo = mimeType?.includes("video") || uri.toLowerCase().includes(".mp4") || uri.toLowerCase().includes(".mov");
  const isAudio = mimeType?.includes("audio") || uri.toLowerCase().includes(".m4a") || uri.toLowerCase().includes(".mp3");
  
  // Determine file extension
  const getExtension = () => {
    if (isVideo) return ".mp4";
    if (isAudio) return ".m4a";
    // Try to get extension from URI
    const uriExt = uri.split(".").pop()?.toLowerCase();
    if (uriExt && ["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(uriExt)) {
      return `.${uriExt}`;
    }
    return ".jpg";
  };
  
  // iOS handling
  if (Platform.OS === "ios") {
    // iOS videos and audio should be copied to cache for reliable access
    // This handles ph:// asset URIs and permission issues
    if (isVideo || isAudio || uri.startsWith("ph://") || uri.includes("PHAsset")) {
      try {
        const ext = getExtension();
        const filename = `upload_${Date.now()}${ext}`;
        const destUri = `${FileSystem.cacheDirectory}${filename}`;
        
        console.log("[Upload] iOS: Copying to cache:", uri, "->", destUri);
        await FileSystem.copyAsync({
          from: uri,
          to: destUri,
        });
        
        console.log("[Upload] iOS: Successfully copied to:", destUri);
        return destUri;
      } catch (error) {
        console.error("[Upload] iOS: Failed to copy, using original:", error);
        // Fall through to return original URI
      }
    }
    
    // For iOS images that don't need copying, ensure proper file:// prefix
    if (!uri.startsWith("file://") && !uri.startsWith("http")) {
      return `file://${uri}`;
    }
    
    return uri;
  }
  
  // Android handling
  if (Platform.OS === "android") {
    // Android content:// URIs need to be copied to cache
    if (uri.startsWith("content://")) {
      try {
        const ext = getExtension();
        const filename = `upload_${Date.now()}${ext}`;
        const destUri = `${FileSystem.cacheDirectory}${filename}`;
        
        console.log("[Upload] Android: Copying content:// to cache:", uri, "->", destUri);
        await FileSystem.copyAsync({
          from: uri,
          to: destUri,
        });
        
        console.log("[Upload] Android: Successfully copied to:", destUri);
        return destUri;
      } catch (error) {
        console.error("[Upload] Android: Failed to copy content://, using original:", error);
        return uri;
      }
    }
    
    // Ensure file:// prefix for Android paths
    if (!uri.startsWith("file://") && !uri.startsWith("content://") && !uri.startsWith("http")) {
      return `file://${uri}`;
    }
  }
  
  return uri;
}

export async function uploadFile(
  uri: string,
  folder: "avatars" | "covers" | "posts" | "general" = "general",
  mimeType?: string
): Promise<UploadResult> {
  const baseUrl = getApiUrl();
  const url = new URL(`/api/upload?folder=${folder}`, baseUrl);

  const formData = new FormData();

  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const blob = await response.blob();
    formData.append("file", blob, "upload");
  } else {
    // Normalize URI for Android - copy content:// to cache for videos/large files
    const normalizedUri = await normalizeUriForUpload(uri, mimeType);
    const filename = normalizedUri.split("/").pop() || "upload";
    const type = getMimeType(normalizedUri, mimeType);

    formData.append("file", {
      uri: normalizedUri,
      name: filename,
      type,
    } as any);
  }

  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = "Upload failed";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    return res.json();
  } catch (error: any) {
    // Handle network errors specifically
    if (error.message === "Network request failed") {
      throw new Error("Network error - please check your connection and try again");
    }
    throw error;
  }
}

export interface PickedAsset {
  uri: string;
  mimeType?: string;
  type?: "image" | "video" | "audio";
  duration?: number;
  width?: number;
  height?: number;
}

export async function pickImage(): Promise<PickedAsset | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== "granted") {
    throw new Error("Permission to access media library was denied");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType,
    type: asset.type === "video" ? "video" : "image",
  };
}

export async function pickPostMedia(): Promise<PickedAsset | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== "granted") {
    throw new Error("Permission to access media library was denied");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    allowsEditing: false,
    quality: 0.9,
    videoExportPreset: ImagePicker.VideoExportPreset.Passthrough,
    videoMaxDuration: 600,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  console.log("[Upload] Picked asset:", {
    uri: asset.uri?.substring(0, 50) + "...",
    type: asset.type,
    mimeType: asset.mimeType,
    duration: asset.duration,
    width: asset.width,
    height: asset.height,
  });
  
  return {
    uri: asset.uri,
    mimeType: asset.mimeType,
    type: asset.type === "video" ? "video" : "image",
    duration: asset.duration ? Math.round(asset.duration * 1000) : undefined,
    width: asset.width,
    height: asset.height,
  };
}

export async function pickAudioFile(): Promise<PickedAsset | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== "granted") {
    throw new Error("Permission to access media library was denied");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    quality: 1,
    videoExportPreset: ImagePicker.VideoExportPreset.Passthrough,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  const mimeType = asset.mimeType;
  const isAudio = mimeType?.startsWith("audio/");
  
  console.log("[Upload] Picked audio/video asset:", {
    uri: asset.uri?.substring(0, 50) + "...",
    type: asset.type,
    mimeType: asset.mimeType,
    duration: asset.duration,
  });
  
  return {
    uri: asset.uri,
    mimeType: asset.mimeType,
    type: isAudio ? "audio" : "video",
    duration: asset.duration ? Math.round(asset.duration * 1000) : undefined,
  };
}

export async function uploadFileWithProgress(
  uri: string,
  folder: "avatars" | "covers" | "posts" | "general" = "general",
  mimeType?: string,
  durationMs?: number,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  console.log("[Upload] Starting upload");
  console.log("[Upload] File URI:", uri);
  console.log("[Upload] MimeType:", mimeType);
  console.log("[Upload] Platform:", Platform.OS);

  // Validate file size before attempting upload (saves bandwidth on large files)
  let fileSize = 0;
  if (Platform.OS !== "web") {
    const validation = await validateFileSize(uri, mimeType);
    if (!validation.valid) {
      throw new Error(validation.error || "File size validation failed");
    }
    fileSize = validation.size;
    console.log(`[Upload] File size validated: ${formatFileSize(validation.size)}`);
    
    // Use direct Cloudinary upload for large files to bypass server/proxy limits
    if (fileSize > DIRECT_UPLOAD_THRESHOLD) {
      console.log(`[Upload] File size ${formatFileSize(fileSize)} > ${formatFileSize(DIRECT_UPLOAD_THRESHOLD)}, using direct upload`);
      return uploadDirectToCloudinary(uri, folder, mimeType, onProgress);
    }
  }

  const baseUrl = getApiUrl();
  const url = new URL(`/api/upload?folder=${folder}`, baseUrl);

  const type = getMimeType(uri, mimeType);
  
  console.log("[Upload] Detected type:", type);

  // For iOS/Android, use XHR which properly shares cookie jar with fetch
  if (Platform.OS !== "web") {
    try {
      // Normalize URI for Android - copy content:// to cache for videos/large files
      const normalizedUri = await normalizeUriForUpload(uri, mimeType);
      const filename = normalizedUri.split("/").pop() || "upload";
      
      console.log("[Upload] Normalized URI:", normalizedUri);
      console.log("[Upload] Filename:", filename);
      
      // Use XHR for mobile - it shares cookies with fetch
      return new Promise<UploadResult>((resolve, reject) => {
        const formData = new FormData();
        
        formData.append("file", {
          uri: normalizedUri,
          name: filename,
          type,
        } as any);

        if (durationMs) {
          formData.append("durationMs", String(durationMs));
        }

        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.min(100, Math.round((event.loaded / event.total) * 100));
            onProgress(progress);
          }
        };

        xhr.onload = () => {
          console.log("[Upload] XHR onload - status:", xhr.status);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (e) {
              reject(new Error("Failed to parse upload response"));
            }
          } else if (xhr.status === 401) {
            reject(new Error("Please log in again to upload media"));
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.message || `Upload failed with status ${xhr.status}`));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = (e: any) => {
          console.error("[Upload] XHR error event:", JSON.stringify(e));
          console.error("[Upload] XHR status:", xhr.status);
          console.error("[Upload] XHR readyState:", xhr.readyState);
          console.error("[Upload] XHR statusText:", xhr.statusText);
          console.error("[Upload] XHR responseText:", xhr.responseText);
          
          // Create error with code if available
          const createError = (message: string, code?: number) => {
            const error = new Error(message) as any;
            if (code !== undefined) error.code = code;
            return error;
          };
          
          // Try to get error code from event
          const errorCode = e?.target?.status || e?.code || xhr.status;
          
          // Try to provide more helpful error messages
          if (xhr.readyState === 0) {
            reject(createError("Could not connect to server. Please check your internet connection.", errorCode));
          } else if (xhr.readyState === 4 && xhr.status === 0) {
            reject(createError("Network request failed. The server may be unreachable.", errorCode));
          } else if (xhr.status >= 400) {
            // Try to parse error response
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(createError(errorResponse.message || `Upload failed with status ${xhr.status}`, xhr.status));
            } catch {
              reject(createError(`Upload failed with status ${xhr.status}`, xhr.status));
            }
          } else {
            reject(createError(`Network error during upload. Please try again.`, errorCode));
          }
        };

        xhr.ontimeout = () => {
          reject(new Error("Upload timed out. Please try with a smaller file or better connection."));
        };

        xhr.open("POST", url.toString());
        xhr.withCredentials = true;
        xhr.timeout = 600000; // 10 minute timeout for large files
        
        console.log("[Upload] Sending XHR request to:", url.toString());
        xhr.send(formData);
      });
    } catch (error: any) {
      console.error("[Upload] Mobile upload error:", error);
      console.error("[Upload] Error name:", error?.name);
      console.error("[Upload] Error code:", error?.code);
      console.error("[Upload] Error message:", error?.message);
      throw new Error(error.message || "Upload failed");
    }
  }
  
  // Web platform - use XHR
  const filename = uri.split("/").pop() || "upload";
  return new Promise(async (resolve, reject) => {
    try {
      const formData = new FormData();

      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append("file", blob, filename);

      if (durationMs) {
        formData.append("durationMs", String(durationMs));
      }

      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.min(100, Math.round((event.loaded / event.total) * 100));
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch (e) {
            reject(new Error("Failed to parse upload response"));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || "Upload failed"));
          } catch (e) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = (e: any) => {
        console.error("XHR upload error:", e);
        console.error("XHR status:", xhr.status);
        console.error("XHR statusText:", xhr.statusText);
        console.error("XHR readyState:", xhr.readyState);
        reject(new Error(`Network error during upload (status: ${xhr.status}, readyState: ${xhr.readyState})`));
      };

      xhr.ontimeout = () => {
        reject(new Error("Upload timed out"));
      };

      xhr.open("POST", url.toString());
      xhr.withCredentials = true;
      xhr.timeout = 600000; // 10 minute timeout for large files
      xhr.send(formData);
    } catch (error: any) {
      reject(new Error(error.message || "Upload failed"));
    }
  });
}

export async function uploadFileWithDuration(
  uri: string,
  folder: "avatars" | "covers" | "posts" | "general" = "general",
  mimeType?: string,
  durationMs?: number,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  if (onProgress) {
    return uploadFileWithProgress(uri, folder, mimeType, durationMs, onProgress);
  }
  
  const baseUrl = getApiUrl();
  const url = new URL(`/api/upload?folder=${folder}`, baseUrl);

  const formData = new FormData();

  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const blob = await response.blob();
    formData.append("file", blob, "upload");
  } else {
    // Normalize URI for Android - copy content:// to cache for videos/large files
    const normalizedUri = await normalizeUriForUpload(uri, mimeType);
    const filename = normalizedUri.split("/").pop() || "upload";
    const type = getMimeType(normalizedUri, mimeType);

    formData.append("file", {
      uri: normalizedUri,
      name: filename,
      type,
    } as any);
  }

  if (durationMs) {
    formData.append("durationMs", String(durationMs));
  }

  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = "Upload failed";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    return res.json();
  } catch (error: any) {
    if (error.message === "Network request failed") {
      throw new Error("Network error - please check your connection and try again");
    }
    throw error;
  }
}
