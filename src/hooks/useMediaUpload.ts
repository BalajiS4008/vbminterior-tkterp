import { useState, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from '../config/constants';
import type { Attachment } from '../types';

interface UploadProgress {
  progress: number;
  fileName: string;
}

interface UseMediaUploadReturn {
  uploading: boolean;
  progress: UploadProgress[];
  error: string | null;
  uploadFile: (file: File, path: string, userId: string) => Promise<Attachment>;
  uploadMultipleFiles: (files: File[], path: string, userId: string) => Promise<Attachment[]>;
  deleteFile: (fileUrl: string) => Promise<void>;
  validateFile: (file: File) => { valid: boolean; error?: string };
}

export function useMediaUpload(): UseMediaUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
      };
    }

    // Check file type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type);

    if (!isImage && !isDocument) {
      return {
        valid: false,
        error: 'File type not allowed. Please upload images (JPEG, PNG, GIF, WebP) or PDF documents.',
      };
    }

    return { valid: true };
  }, []);

  const getFileType = (file: File): 'image' | 'pdf' | 'document' => {
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    return 'document';
  };

  const uploadFile = useCallback(
    async (file: File, path: string, userId: string): Promise<Attachment> => {
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      setUploading(true);
      setError(null);

      try {
        const fileId = uuidv4();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${fileId}.${fileExtension}`;
        const fullPath = `${path}/${fileName}`;
        const storageRef = ref(storage, fullPath);

        return new Promise((resolve, reject) => {
          const uploadTask = uploadBytesResumable(storageRef, file);

          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progressPercent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress((prev) => {
                const existing = prev.find((p) => p.fileName === file.name);
                if (existing) {
                  return prev.map((p) =>
                    p.fileName === file.name ? { ...p, progress: progressPercent } : p
                  );
                }
                return [...prev, { fileName: file.name, progress: progressPercent }];
              });
            },
            (error) => {
              setError(error.message);
              setUploading(false);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const attachment: Attachment = {
                  id: fileId,
                  name: file.name,
                  url: downloadURL,
                  type: getFileType(file),
                  size: file.size,
                  uploadedBy: userId,
                  uploadedAt: new Date(),
                };
                setProgress((prev) => prev.filter((p) => p.fileName !== file.name));
                setUploading(false);
                resolve(attachment);
              } catch (err) {
                setUploading(false);
                reject(err);
              }
            }
          );
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload file';
        setError(message);
        setUploading(false);
        throw err;
      }
    },
    [validateFile]
  );

  const uploadMultipleFiles = useCallback(
    async (files: File[], path: string, userId: string): Promise<Attachment[]> => {
      const attachments: Attachment[] = [];

      for (const file of files) {
        try {
          const attachment = await uploadFile(file, path, userId);
          attachments.push(attachment);
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
          // Continue with other files
        }
      }

      return attachments;
    },
    [uploadFile]
  );

  const deleteFile = useCallback(async (fileUrl: string): Promise<void> => {
    try {
      const storageRef = ref(storage, fileUrl);
      await deleteObject(storageRef);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete file';
      setError(message);
      throw err;
    }
  }, []);

  return {
    uploading,
    progress,
    error,
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    validateFile,
  };
}

export default useMediaUpload;
