import React, { useCallback, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  useTheme,
  Alert,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Delete as DeleteIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useMediaUpload } from '../../hooks';
import type { Attachment } from '../../types';
import { formatFileSize } from '../../utils';

interface FileUploaderProps {
  onUploadComplete: (attachments: Attachment[]) => void;
  existingFiles?: Attachment[];
  onRemoveExisting?: (id: string) => void;
  uploadPath: string;
  userId: string;
  maxFiles?: number;
  accept?: string;
}

interface FilePreview {
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
  existingFiles = [],
  onRemoveExisting,
  uploadPath,
  userId,
  maxFiles = 5,
  accept = 'image/*,.pdf',
}) => {
  const theme = useTheme();
  const { uploadFile, validateFile } = useMediaUpload();

  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFileIcon = (file: File | Attachment) => {
    const type = 'type' in file && typeof file.type === 'string' ? file.type : (file as File).type;
    if (type.startsWith('image') || type === 'image') {
      return <ImageIcon color="primary" />;
    }
    if (type === 'application/pdf' || type === 'pdf') {
      return <PdfIcon color="error" />;
    }
    return <FileIcon color="action" />;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setError(null);

      const droppedFiles = Array.from(e.dataTransfer.files);
      processFiles(droppedFiles);
    },
    [existingFiles.length, files.length, maxFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        processFiles(selectedFiles);
      }
    },
    [existingFiles.length, files.length, maxFiles]
  );

  const processFiles = async (newFiles: File[]) => {
    const totalFiles = existingFiles.length + files.length + newFiles.length;
    if (totalFiles > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles: FilePreview[] = [];

    for (const file of newFiles) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        continue;
      }

      const preview = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : undefined;

      validFiles.push({
        file,
        preview,
        status: 'pending',
        progress: 0,
      });
    }

    if (validFiles.length === 0) return;

    setFiles((prev) => [...prev, ...validFiles]);

    // Start uploading
    const uploadedAttachments: Attachment[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const filePreview = validFiles[i];

      setFiles((prev) =>
        prev.map((f) =>
          f.file === filePreview.file ? { ...f, status: 'uploading' } : f
        )
      );

      try {
        const attachment = await uploadFile(filePreview.file, uploadPath, userId);
        uploadedAttachments.push(attachment);

        setFiles((prev) =>
          prev.map((f) =>
            f.file === filePreview.file
              ? { ...f, status: 'success', progress: 100 }
              : f
          )
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.file === filePreview.file
              ? {
                  ...f,
                  status: 'error',
                  error: err instanceof Error ? err.message : 'Upload failed',
                }
              : f
          )
        );
      }
    }

    if (uploadedAttachments.length > 0) {
      onUploadComplete(uploadedAttachments);
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Box>
      {/* Drop Zone */}
      <Paper
        variant="outlined"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: isDragging
            ? theme.palette.primary.main
            : theme.palette.divider,
          backgroundColor: isDragging
            ? theme.palette.primary.main + '08'
            : 'transparent',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.primary.main + '08',
          },
        }}
        component="label"
      >
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <UploadIcon
          sx={{
            fontSize: 48,
            color: isDragging ? theme.palette.primary.main : theme.palette.text.disabled,
            mb: 1,
          }}
        />
        <Typography variant="body1" gutterBottom>
          Drag & drop files here or click to browse
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Supports images (JPEG, PNG, GIF) and PDF files. Max 10MB each.
        </Typography>
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* File List */}
      {(existingFiles.length > 0 || files.length > 0) && (
        <List sx={{ mt: 2 }}>
          {/* Existing Files */}
          {existingFiles.map((attachment) => (
            <ListItem
              key={attachment.id}
              sx={{
                backgroundColor: theme.palette.grey[50],
                borderRadius: 1,
                mb: 1,
              }}
            >
              <ListItemIcon>{getFileIcon(attachment)}</ListItemIcon>
              <ListItemText
                primary={attachment.name}
                secondary={formatFileSize(attachment.size)}
              />
              <ListItemSecondaryAction>
                {onRemoveExisting && (
                  <IconButton
                    edge="end"
                    onClick={() => onRemoveExisting(attachment.id)}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}

          {/* New Files */}
          {files.map((filePreview, index) => (
            <ListItem
              key={index}
              sx={{
                backgroundColor:
                  filePreview.status === 'error'
                    ? theme.palette.error.light + '20'
                    : theme.palette.grey[50],
                borderRadius: 1,
                mb: 1,
                flexDirection: 'column',
                alignItems: 'stretch',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <ListItemIcon>
                  {filePreview.preview ? (
                    <Box
                      component="img"
                      src={filePreview.preview}
                      sx={{
                        width: 40,
                        height: 40,
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                  ) : (
                    getFileIcon(filePreview.file)
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={filePreview.file.name}
                  secondary={
                    filePreview.error || formatFileSize(filePreview.file.size)
                  }
                  secondaryTypographyProps={{
                    color: filePreview.error ? 'error' : 'textSecondary',
                  }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {filePreview.status === 'success' && (
                    <SuccessIcon color="success" fontSize="small" />
                  )}
                  {filePreview.status === 'error' && (
                    <ErrorIcon color="error" fontSize="small" />
                  )}
                  <IconButton
                    edge="end"
                    onClick={() => removeFile(index)}
                    size="small"
                    disabled={filePreview.status === 'uploading'}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              {filePreview.status === 'uploading' && (
                <LinearProgress
                  variant="indeterminate"
                  sx={{ mt: 1, borderRadius: 1 }}
                />
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default FileUploader;
