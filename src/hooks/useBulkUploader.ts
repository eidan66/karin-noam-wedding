import { useState, useRef } from 'react';
import { API_BASE } from '../config';
import { WeddingMedia } from '../Entities/WeddingMedia';
import type { WeddingMediaItem } from '../Entities/WeddingMedia';
import { generateVideoThumbnail, isMobile } from '../utils';

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
    const e: Promise<void> = p.then(() => {
      const idx = executing.indexOf(e);
      if (idx >= 0) executing.splice(idx, 1);
    }) as unknown as Promise<void>;
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
  return Math.min(Math.max(hw - 2, 3), 6);
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

export const useBulkUploader = () => {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const uploadControllers = useRef<AbortController[]>([]);

  const uploadFiles = async (files: File[], uploaderName: string, caption: string) => {
    uploadControllers.current = [];
    setUploads(files.map(file => ({ file, status: 'pending' as UploadStatus, progress: 0 })));

    const concurrency = resolveConcurrency();

    await asyncPool<File, void>(concurrency, files, async (file, idx) => {
      const controller = new AbortController();
      uploadControllers.current[idx] = controller;

      setUploads(prev =>
        prev.map((u, i) =>
          i === idx ? { ...u, status: 'uploading' as UploadStatus, progress: 0 } : u
        )
      );

      try {
        // 1. Get pre-signed URL (with retry)
        const { url } = await withRetry(async () => {
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
            signal: controller.signal,
          });
          if (!res.ok) {
            // Best-effort parse
            let code: string | undefined; let message: string | undefined;
            try {
              const data = await res.json();
              code = (data as { code?: string }).code;
              message = (data as { message?: string }).message;
            } catch {}
            const errorMsg = `[${code || 'ERROR'}] ${message || 'Failed to get upload URL'}`;
            throw new Error(errorMsg);
          }
          return res.json() as Promise<{ url: string }>; 
        });

        // 2. Upload to S3 with progress (and timeout)
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', url, true);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.timeout = 180_000; // 3 minutes per object
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setUploads(prev =>
                prev.map((u, i) =>
                  i === idx
                    ? { ...u, progress: Math.round((event.loaded / event.total) * 100) }
                    : u
                )
              );
            }
          };
          xhr.ontimeout = () => {
            setUploads(prev => prev.map((u, i) => i === idx ? { ...u, status: 'error', error: 'Upload timeout' } : u));
            reject(new Error('Upload timeout'));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              setUploads(prev => prev.map((u, i) => i === idx ? { ...u, status: 'error', error: `Upload failed (${xhr.status})` } : u));
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          };
          xhr.onerror = () => {
            setUploads(prev => prev.map((u, i) => i === idx ? { ...u, status: 'error', error: 'Network error during upload' } : u));
            reject(new Error('Network error during upload'));
          };
          xhr.onabort = () => {
            setUploads(prev => prev.map((u, i) => i === idx ? { ...u, status: 'error', error: 'Upload aborted' } : u));
            reject(new Error('Upload aborted'));
          };
          xhr.send(file);
        });

        // 3. Generate thumbnail for videos (skip on mobile to keep UX snappy)
        let thumbnailUrl: string | undefined;
        if (file.type.startsWith('video/') && !isMobile()) {
          try {
            thumbnailUrl = await generateVideoThumbnail(file);
          } catch {
            // ignore thumbnail errors on background
          }
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

  return { uploads, uploadFiles, cancelUploads };
};