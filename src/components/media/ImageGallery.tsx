import React, { useState } from 'react';
import {
  Box,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton,
  Dialog,
  DialogContent,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  ZoomIn as ZoomIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
} from '@mui/icons-material';
import type { Attachment } from '../../types';

interface ImageGalleryProps {
  images: Attachment[];
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onDelete,
  readOnly = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const imageAttachments = images.filter((img) => img.type === 'image');

  const handleOpen = (index: number) => {
    setSelectedIndex(index);
  };

  const handleClose = () => {
    setSelectedIndex(null);
  };

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < imageAttachments.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') handleClose();
  };

  if (imageAttachments.length === 0) {
    return null;
  }

  const cols = isMobile ? 2 : Math.min(imageAttachments.length, 4);

  return (
    <>
      <ImageList cols={cols} gap={8}>
        {imageAttachments.map((image, index) => (
          <ImageListItem
            key={image.id}
            sx={{
              borderRadius: 1,
              overflow: 'hidden',
              cursor: 'pointer',
              '&:hover .MuiImageListItemBar-root': {
                opacity: 1,
              },
            }}
            onClick={() => handleOpen(index)}
          >
            <img
              src={image.url}
              alt={image.name}
              loading="lazy"
              style={{
                height: 150,
                objectFit: 'cover',
              }}
            />
            <ImageListItemBar
              sx={{
                opacity: 0,
                transition: 'opacity 0.2s',
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
              }}
              title={image.name}
              actionIcon={
                <Box sx={{ display: 'flex' }}>
                  <IconButton
                    sx={{ color: 'white' }}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpen(index);
                    }}
                  >
                    <ZoomIcon fontSize="small" />
                  </IconButton>
                  {!readOnly && onDelete && (
                    <IconButton
                      sx={{ color: 'white' }}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(image.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              }
            />
          </ImageListItem>
        ))}
      </ImageList>

      {/* Lightbox Dialog */}
      <Dialog
        open={selectedIndex !== null}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        onKeyDown={handleKeyDown}
        PaperProps={{
          sx: {
            backgroundColor: 'black',
            m: 1,
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            minHeight: '60vh',
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white',
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Download Button */}
          {selectedIndex !== null && (
            <IconButton
              onClick={() => handleDownload(imageAttachments[selectedIndex])}
              sx={{
                position: 'absolute',
                top: 8,
                right: 56,
                color: 'white',
                zIndex: 1,
              }}
            >
              <DownloadIcon />
            </IconButton>
          )}

          {/* Previous Button */}
          {selectedIndex !== null && selectedIndex > 0 && (
            <IconButton
              onClick={handlePrev}
              sx={{
                position: 'absolute',
                left: 8,
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.5)',
                },
              }}
            >
              <PrevIcon />
            </IconButton>
          )}

          {/* Image */}
          {selectedIndex !== null && (
            <Box
              component="img"
              src={imageAttachments[selectedIndex].url}
              alt={imageAttachments[selectedIndex].name}
              sx={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
              }}
            />
          )}

          {/* Next Button */}
          {selectedIndex !== null &&
            selectedIndex < imageAttachments.length - 1 && (
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  right: 8,
                  color: 'white',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.5)',
                  },
                }}
              >
                <NextIcon />
              </IconButton>
            )}

          {/* Image Counter */}
          {selectedIndex !== null && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.5)',
                px: 2,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              {selectedIndex + 1} / {imageAttachments.length}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageGallery;
