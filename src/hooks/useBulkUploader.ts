import { useState, useRef } from 'react';
import { API_BASE } from '../config';
import { WeddingMedia } from '../Entities/WeddingMedia';
import type { WeddingMediaItem } from '../Entities/WeddingMedia';
import { generateVideoThumbnail, isMobile } from '../utils';
import { compressImage, replaceExtension } from '../utils/compress';

async function asyncPool<T, R>(
  poolLimit: number,
  array: T[],
  iteratorFn: (item: T, index: number, array: T[]) => Promise<R>
): Promise<R[]> {
  const ret: Promise<R>[] = [];
  const executing: Promise<void>[] = [];
  for (const [i, item] of array.entries()) {
    const p: Promise<R> = Promise.resolve().then(() => iteratorFn(item, i, array));
    ret.push(p);
    const e: Promise<void> = (p.then(() => {
      const idx = executing.indexOf(e);
      if (idx >= 0) executing.splice(idx, 1);
    }) as unknown) as Promise<void>;
    executing.push(e);
    if (executing.length >= poolLimit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface FileUploadState {
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  mediaItem?: WeddingMediaItem;
}

function resolveConcurrency(): number {
  const mobile = isMobile();
  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { hardwareConcurrency?: number; connection?: { effectiveType?: string } }) : undefined;
  const hw = nav?.hardwareConcurrency ?? 4;
  const network = nav?.connection?.effectiveType;
  const slowNet = network ? ['2g', 'slow-2g', '3g'].includes(network) : false;
  if (mobile) return slowNet ? 2 : 3;
  return Math.min(Math.max(hw - 2, 3), 8);
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise(r => setTimeout(r, 300 * (i + 1)));
    }
  }
  if (lastErr instanceof Error) throw lastErr;
  throw new Error('Operation failed');
}

async function presignSingle(file: File, caption: string, uploaderName: string, signal: AbortSignal): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      filetype: file.type,
      filesize: file.size,
      title: caption || "",
      uploaderName: uploaderName || ""
    }),
    signal,
  });
  if (!res.ok) {
    let code: string | undefined; let message: string | undefined;
    try { const data = await res.json(); code = (data as { code?: string }).code; message = (data as { message?: string }).message; } catch {}
    throw new Error(`[${code || 'ERROR'}] ${message || 'Failed to get upload URL'}`);
  }
  return res.json() as Promise<{ url: string }>;
}

async function presignBatch(files: File[], caption: string, uploaderName: string, signal: AbortSignal): Promise<string[]> {
  const payload = {
    files: files.map(f => ({ filename: f.name, filetype: f.type, filesize: f.size, title: caption || "", uploaderName: uploaderName || "" }))
  };
  const res = await fetch(`${API_BASE}/uploads/presign/batch`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal
  });
  if (!res.ok) throw new Error('Batch presign failed');
  const data = await res.json() as { urls: string[] };
  return data.urls;
}

async function uploadPutWithRetry(url: string, file: File, idx: number, setUploads: React.Dispatch<React.SetStateAction<FileUploadState[]>>): Promise<void> {
  const attempt = (tryNum: number) => new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.timeout = 180_000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploads(prev => prev.map((u, i) => i === idx ? { ...u, progress: Math.round((event.loaded / event.total) * 100) } : u));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timeout'));
    xhr.send(file);
  });

  let lastErr: unknown;
  for (let t = 0; t < 3; t++) {
    try {
      await attempt(t);
      return;
    } catch (err) {
      lastErr = err;
      if (t < 2) await new Promise(r => setTimeout(r, 500 * Math.pow(2, t))); // backoff 0.5s,1s
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('PUT failed');
}

export const useBulkUploader = () => {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const uploadControllers = useRef<AbortController[]>([]);

  const uploadFiles = async (files: File[], uploaderName: string, caption: string) => {
    uploadControllers.current = [];
    setUploads(files.map(file => ({ file, status: 'pending' as UploadStatus, progress: 0 })));

    const concurrency = resolveConcurrency();

    // Batch presign to reduce round-trips when there are many files
    let batchUrls: string[] | null = null;
    try {
      if (files.length >= 6) {
        batchUrls = await withRetry(() => presignBatch(files, caption, uploaderName, new AbortController().signal));
      }
    } catch {
      batchUrls = null; // fallback to single
    }

    await asyncPool<File, void>(concurrency, files, async (originalFile, idx) => {
      const controller = new AbortController();
      uploadControllers.current[idx] = controller;

      setUploads(prev =>
        prev.map((u, i) =>
          i === idx ? { ...u, status: 'uploading' as UploadStatus, progress: 0 } : u
        )
      );

      try {
        // Compress images on client to accelerate uploads massively
        let file = originalFile;
        if (file.type.startsWith('image/')) {
          try {
            const blob = await compressImage(file, { maxDimension: 2048, quality: 0.72 });
            const newName = replaceExtension(file.name, '.jpg');
            file = new File([blob], newName, { type: 'image/jpeg' });
          } catch {
            // If compression fails, fall back to original
          }
        }

        // 1. Get pre-signed URL (with retry)
        let url: string;
        if (batchUrls && batchUrls[idx]) {
          url = batchUrls[idx];
        } else {
          const single = await withRetry(() => presignSingle(file, caption, uploaderName, controller.signal));
          url = single.url;
        }

        // 2. Upload to S3 with progress (and timeout)
        await uploadPutWithRetry(url, file, idx, setUploads);

        // 3. Generate thumbnail for videos (skip on mobile to keep UX snappy)
        let thumbnailUrl: string | undefined;
        if (file.type.startsWith('video/') && !isMobile()) {
          try {
            thumbnailUrl = await generateVideoThumbnail(file);
          } catch {}
        }

        // 4. Create media item in backend after S3 upload succeeds
        const mediaParams = {
          title: caption || "",
          media_url: url.split('?')[0],
          media_type: (file.type.startsWith('image/') ? 'photo' : 'video') as 'photo' | 'video',
          uploader_name: uploaderName || "אורח אנונימי",
          thumbnail_url: thumbnailUrl
        };
        const createdMedia = await WeddingMedia.create(mediaParams);

        setUploads(prev =>
          prev.map((u, i) =>
            i === idx ? { ...u, status: 'success' as UploadStatus, progress: 100, mediaItem: createdMedia } : u
          )
        );
      } catch (err) {
        setUploads(prev =>
          prev.map((u, i) =>
            i === idx
              ? { ...u, status: 'error' as UploadStatus, error: (err as Error).message || 'An error occurred' }
              : u
          )
        );
      }
    });
  };

  const cancelUploads = () => {
    uploadControllers.current.forEach(controller => controller?.abort());
  };

  const isUploading = uploads.some(u => u.status === 'uploading' || u.status === 'pending');

  return { uploads, uploadFiles, cancelUploads, isUploading };
};