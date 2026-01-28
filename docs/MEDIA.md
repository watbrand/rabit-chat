# Media Upload Guide

**Last Updated:** January 15, 2026

## Overview

RabitChat supports media uploads for user avatars and post attachments using Cloudinary as the storage provider. The system supports images, videos, and audio files (voice notes) with automatic thumbnail generation and duration detection.

## Quick Setup

### 1. Create Cloudinary Account

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Navigate to Dashboard → Settings → Access Keys
3. Copy your Cloud Name, API Key, and API Secret

### 2. Configure Environment Variables

Add these secrets in the Replit Secrets tab:

| Variable | Description |
|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |

### 3. Verify Configuration

```bash
curl http://localhost:5000/api/upload/status
```

Expected response:
```json
{
  "configured": true,
  "enabled": true,
  "maxImageSize": 10485760,
  "maxVideoSize": 52428800,
  "maxAudioSize": 20971520,
  "allowedImageTypes": ["image/jpeg", "image/png", "image/gif", "image/webp"],
  "allowedVideoTypes": ["video/mp4", "video/webm", "video/quicktime"],
  "allowedAudioTypes": ["audio/mpeg", "audio/mp4", "audio/wav", "audio/webm", "audio/ogg", "audio/aac"]
}
```

## API Reference

### Check Upload Status

```
GET /api/upload/status
```

Returns upload configuration and whether Cloudinary is properly configured.

**Response:**
```json
{
  "configured": true,
  "enabled": true,
  "maxImageSize": 10485760,
  "maxVideoSize": 52428800,
  "maxAudioSize": 20971520,
  "allowedImageTypes": [...],
  "allowedVideoTypes": [...],
  "allowedAudioTypes": [...]
}
```

### Upload File

```
POST /api/upload?folder=<folder>
Content-Type: multipart/form-data

file: <binary>
durationMs: <optional number>
```

**Query Parameters:**
- `folder`: Target folder (`avatars`, `posts`, or `general`)

**Form Data:**
| Field | Type | Description |
|-------|------|-------------|
| `file` | File | The file to upload (required) |
| `durationMs` | number | Duration in milliseconds (optional, for audio/video) |

**Response:**
```json
{
  "url": "https://res.cloudinary.com/.../video.mp4",
  "publicId": "rabitchat/posts/abc123",
  "width": 1920,
  "height": 1080,
  "format": "mp4",
  "resourceType": "video",
  "thumbnailUrl": "https://res.cloudinary.com/.../thumbnail.jpg",
  "durationMs": 30000,
  "mediaType": "video"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `url` | string | Direct URL to the uploaded file |
| `publicId` | string | Cloudinary public ID for management |
| `width` | number | Width in pixels (images/videos only) |
| `height` | number | Height in pixels (images/videos only) |
| `format` | string | File format (e.g., "mp4", "jpg") |
| `resourceType` | string | Cloudinary resource type ("image" or "video") |
| `thumbnailUrl` | string | Auto-generated thumbnail (videos) or placeholder (audio) |
| `durationMs` | number | Duration in milliseconds (audio/video) |
| `mediaType` | string | Simplified type: "image", "video", or "audio" |

**Errors:**
| Status | Message |
|--------|---------|
| 400 | "No file uploaded" |
| 400 | "Invalid file type..." |
| 400 | "File too large..." |
| 403 | "Media uploads are currently disabled." |
| 500 | Upload error details |
| 503 | "Media uploads not configured." |

## File Limits

### Images
| MIME Type | Extension | Max Size |
|-----------|-----------|----------|
| image/jpeg | .jpg, .jpeg | 10 MB |
| image/png | .png | 10 MB |
| image/gif | .gif | 10 MB |
| image/webp | .webp | 10 MB |

### Videos
| MIME Type | Extension | Max Size |
|-----------|-----------|----------|
| video/mp4 | .mp4 | 50 MB |
| video/webm | .webm | 50 MB |
| video/quicktime | .mov | 50 MB |

### Audio (Voice Notes)
| MIME Type | Extension | Max Size |
|-----------|-----------|----------|
| audio/mpeg | .mp3 | 20 MB |
| audio/mp4 | .m4a | 20 MB |
| audio/wav | .wav | 20 MB |
| audio/webm | .webm | 20 MB |
| audio/ogg | .ogg | 20 MB |
| audio/aac | .aac | 20 MB |

## Thumbnails

### Video Thumbnails
Videos automatically get a thumbnail URL generated from the first frame:
- Resolution: 400x400 pixels
- Format: JPEG
- Transformation: `so_0,w_400,h_400,c_fill`

### Audio Thumbnails
Audio files receive a default placeholder thumbnail. For custom waveforms:
1. Generate waveform client-side before upload
2. Upload the waveform image separately
3. Use that URL as the thumbnailUrl in your post

## Admin Feature Flag

### mediaUploadsEnabled

Controls whether non-admin users can upload media:
- `true` (default): All authenticated users can upload
- `false`: Only admins can upload

**To disable uploads:**
```sql
INSERT INTO app_settings (key, value, description)
VALUES ('mediaUploadsEnabled', 'false', 'Enable/disable media uploads for non-admins')
ON CONFLICT (key) DO UPDATE SET value = 'false';
```

Or via Admin Settings UI: Settings → Admin → Settings

## Creating Posts with Media

After uploading, use the returned URLs to create posts:

### Photo Post
```json
POST /api/posts
{
  "type": "PHOTO",
  "mediaUrl": "https://res.cloudinary.com/.../image.jpg",
  "caption": "Beautiful sunset"
}
```

### Video Post
```json
POST /api/posts
{
  "type": "VIDEO",
  "mediaUrl": "https://res.cloudinary.com/.../video.mp4",
  "thumbnailUrl": "https://res.cloudinary.com/.../thumbnail.jpg",
  "durationMs": 30000,
  "caption": "Check this out!"
}
```

### Voice Post
```json
POST /api/posts
{
  "type": "VOICE",
  "mediaUrl": "https://res.cloudinary.com/.../voice.mp3",
  "thumbnailUrl": "https://res.cloudinary.com/.../waveform.png",
  "durationMs": 15000,
  "caption": "My voice note"
}
```

## Client Usage

### React Native / Expo Example

```typescript
import { File } from 'expo-file-system';

async function uploadMedia(uri: string, durationMs?: number) {
  const formData = new FormData();
  const file = new File(uri);
  formData.append('file', file);
  
  if (durationMs) {
    formData.append('durationMs', String(durationMs));
  }

  const response = await fetch('/api/upload?folder=posts', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  return response.json();
}
```

### HTML Audio Player

Audio URLs returned from upload are directly playable:

```html
<audio controls>
  <source src="https://res.cloudinary.com/.../voice.mp3" type="audio/mpeg">
</audio>
```

### Avatar Upload (Profile Screen)

```typescript
import { pickImage, uploadFile } from "@/lib/upload";

const handleAvatarUpload = async () => {
  const uri = await pickImage();
  if (!uri) return;
  
  const result = await uploadFile(uri, "avatars");
  setAvatarUrl(result.url);
};
```

## Upload Folders

| Folder | Purpose |
|--------|---------|
| `avatars` | User profile pictures |
| `posts` | Post media attachments |
| `general` | Other uploads |

Files are organized in Cloudinary:
```
rabitchat/
├── avatars/
│   └── user123_avatar.jpg
├── posts/
│   ├── post456_photo.jpg
│   ├── post789_video.mp4
│   └── post012_voice.mp3
└── general/
    └── other_files...
```

## Cloudinary Features

### Automatic Optimizations

Uploaded images are automatically optimized:
- `quality: auto` - Optimal quality/size balance
- `fetch_format: auto` - Best format for browser

### CDN & Performance

Cloudinary automatically serves files from a global CDN. No additional configuration needed.

## Troubleshooting

### "Media uploads not configured"

Ensure all three environment variables are set:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Restart the server after adding secrets.

### "Media uploads are currently disabled"

An admin has disabled uploads. Contact your administrator or check the `mediaUploadsEnabled` setting.

### "File too large"

Check size limits:
- Images: Max 10 MB
- Videos: Max 50 MB
- Audio: Max 20 MB

Compress or resize before uploading.

### "Invalid file type"

Only allowed MIME types are accepted. Check `/api/upload/status` for the complete list.

### Upload fails on mobile

Ensure the Expo app has media library permissions granted. The app will request permission automatically on first upload attempt.

### Duration not detected

If duration is not returned (e.g., for some audio formats), pass it from the client:
```typescript
formData.append('durationMs', String(audioLength));
```

## Security

- **Authentication Required**: All upload endpoints require a valid session
- **File Type Validation**: Server-side MIME type validation
- **Size Limits**: Enforced per media type
- **Feature Flag**: Admins can disable uploads entirely
- **Signed URLs**: Cloudinary URLs are secure and globally distributed

## Costs

Cloudinary offers a free tier with:
- 25,000 transformations/month
- 25 GB storage
- 25 GB bandwidth/month

Monitor usage at [cloudinary.com/console](https://cloudinary.com/console).

## Related Documentation

- [Posts API](./API_POSTS.md)
- [Policy Engine](./POLICY.md)
- [Database Schema](./DB_SCHEMA.md)
