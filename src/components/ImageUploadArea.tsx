import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

import { 
  validateImage, 
  compressImage, 
  generateImageFileName,
  getImagePreviewUrl,
  revokeImagePreviewUrl,
  ALLOWED_EXTENSIONS
} from '@/utils/imageUtils';

interface ImageUploadAreaProps {
  projectId: string;
  onUpload: (file: File, compressedBlob: Blob, fileName: string) => Promise<void>;
  className?: string;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  previewUrl?: string;
  error?: string;
}

export default function ImageUploadArea({ projectId, onUpload, className = '' }: ImageUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const fileId = `${file.name}-${Date.now()}`;
      
      // Validate file
      const validation = validateImage(file);
      if (!validation.isValid) {
        setUploadingFiles(prev => [...prev, {
          id: fileId,
          name: file.name,
          progress: 0,
          error: validation.error
        }]);
        continue;
      }

      // Add to uploading files
      setUploadingFiles(prev => [...prev, {
        id: fileId,
        name: file.name,
        progress: 0
      }]);

      try {
        // Compress image
        const compressedBlob = await compressImage(file);
        const previewUrl = getImagePreviewUrl(compressedBlob);
        
        // Update with preview
        setUploadingFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress: 30, previewUrl } : f
        ));

        // Generate filename
        const fileName = generateImageFileName(file.name, projectId);
        
        // Upload
        await onUpload(file, compressedBlob, fileName);
        
        // Update progress to complete
        setUploadingFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress: 100 } : f
        ));

        // Remove after 3 seconds
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
          if (previewUrl) revokeImagePreviewUrl(previewUrl);
        }, 3000);
        
      } catch (error) {
        console.error('Upload error:', error);
        setUploadingFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            progress: 0, 
            error: error instanceof Error ? error.message : 'Upload failed' 
          } : f
        ));
      }
    }
  }, [projectId, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const removeFile = useCallback((fileId: string) => {
    setUploadingFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.previewUrl) {
        revokeImagePreviewUrl(file.previewUrl);
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  return (
    <div className={className}>
      {/* Drop zone overlay */}
      {isDragging && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Card className="p-12 bg-white/95 dark:bg-gray-900/95 border-2 border-dashed border-purple-500">
            <ImageIcon className="h-16 w-16 text-purple-500 mx-auto mb-4" />
            <p className="text-xl font-semibold font-display text-center">Drop images here</p>
            <p className="text-sm text-gray-500 text-center mt-2">
              Max 2MB • {ALLOWED_EXTENSIONS.join(', ')}
            </p>
          </Card>
        </div>
      )}

      {/* Upload button */}
      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Upload Images
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Uploading files list */}
      {uploadingFiles.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40 space-y-2 max-w-sm">
          {uploadingFiles.map(file => (
            <Card key={file.id} className="p-3 shadow-lg">
              <div className="flex items-start gap-3">
                {file.previewUrl ? (
                  <img 
                    src={file.previewUrl} 
                    alt={file.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  
                  {file.error ? (
                    <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {file.error}
                    </div>
                  ) : (
                    <div className="mt-1">
                      <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeFile(file.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}