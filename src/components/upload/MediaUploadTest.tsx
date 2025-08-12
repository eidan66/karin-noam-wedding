"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadFile, validateFile } from '@/lib/upload';
import { useMediaPolling } from '@/hooks/useMediaPolling';
import { ProcessedMediaItem } from '@/types';

interface MediaUploadTestProps {
  coupleId: string;
}

export default function MediaUploadTest({ coupleId }: MediaUploadTestProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<Array<{
    file: File;
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    progress: number;
    key?: string;
    error?: string;
  }>>([]);

  // Poll for processed media
  const { media: processedMedia, isLoading: pollingLoading } = useMediaPolling({
    coupleId,
    pollingInterval: 3000, // Poll every 3 seconds
    enabled: true,
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    
    // Initialize upload results
    setUploadResults(files.map(file => ({
      file,
      status: 'pending',
      progress: 0,
    })));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadResults(prev => prev.map((result, idx) => 
          idx === i ? { ...result, status: 'failed', error: validation.error } : result
        ));
        continue;
      }
      
      // Update status to uploading
      setUploadResults(prev => prev.map((result, idx) => 
        idx === i ? { ...result, status: 'uploading', progress: 0 } : result
      ));
      
      try {
        // Upload file
        const result = await uploadFile(
          coupleId,
          file,
          (progress) => {
            setUploadResults(prev => prev.map((r, idx) => 
              idx === i ? { ...r, progress: progress.percentage } : r
            ));
          }
        );
        
        if (result.success) {
          setUploadResults(prev => prev.map((r, idx) => 
            idx === i ? { ...r, status: 'completed', key: result.key } : r
          ));
        } else {
            setUploadResults(prev => prev.map((r, idx) => 
                idx === i ? { ...r, status: 'failed', error: result.error } : r
                ));
        }
      } catch (error) {
        setUploadResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'failed', error: 'Upload failed' } : r
        ));
      }
    }
    
    setUploading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'uploading': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'uploading': return '⏳';
      default: return '⏸️';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Media Upload Test
        </h2>
        <p className="text-gray-600">
          Couple ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{coupleId}</span>
        </p>
      </div>

      {/* File Selection */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="cursor-pointer">
          <div className="space-y-2">
            <div className="text-4xl">📁</div>
            <div className="text-lg font-medium">Select files to upload</div>
            <div className="text-sm text-gray-500">
              Supports images and videos up to 200MB
            </div>
          </div>
        </label>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Selected Files ({selectedFiles.length})</h3>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg">
                  {file.type.startsWith('video/') ? '🎬' : '🖼️'}
                </span>
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-medium ${getStatusColor(uploadResults[index]?.status || 'pending')}`}>
                  {getStatusIcon(uploadResults[index]?.status || 'pending')} {uploadResults[index]?.status || 'pending'}
                </div>
                {uploadResults[index]?.status === 'uploading' && (
                  <div className="text-sm text-blue-600">
                    {uploadResults[index]?.progress}%
                  </div>
                )}
                {uploadResults[index]?.error && (
                  <div className="text-sm text-red-600">
                    {uploadResults[index]?.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="text-center">
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="px-8 py-3 text-lg"
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </div>
      )}

      {/* Processing Status */}
      {uploadResults.some(r => r.status === 'completed') && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Processing Status</h3>
          <div className="text-sm text-gray-600">
            Files are being processed. This may take 10-30 seconds.
          </div>
          
          {uploadResults
            .filter(r => r.status === 'completed')
            .map((result, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{result.file.name}</span>
                  <span className="text-blue-600">Processing...</span>
                </div>
                {result.key && (
                  <div className="text-sm text-gray-500 mt-1">
                    Key: <span className="font-mono">{result.key}</span>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Processed Media */}
      {processedMedia.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Processed Media ({processedMedia.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedMedia.map((item) => (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  {item.type === 'video' ? '🎬' : '🖼️'}
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium">{item.id}</div>
                  <div className="text-xs text-gray-500">
                    {item.width} × {item.height}
                    {item.duration && ` • ${item.duration.toFixed(1)}s`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Status: <span className={item.status === 'completed' ? 'text-green-600' : 'text-red-600'}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Polling Status */}
      <div className="text-center text-sm text-gray-500">
        {pollingLoading ? '🔄 Checking for new media...' : '⏸️ Polling paused'}
      </div>
    </div>
  );
}
