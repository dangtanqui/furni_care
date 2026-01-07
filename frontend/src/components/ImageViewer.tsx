import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import '../styles/components/ImageViewer.css';

interface ImageViewerProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
}

export default function ImageViewer({ images, currentIndex: initialIndex, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
  }, [initialIndex]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
  }, [images.length]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if ((e.key === '+' || e.key === '=') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handlePrevious, handleNext, handleZoomIn, handleZoomOut, onClose]);

  const handleResetZoom = () => {
    setZoom(1);
  };

  if (images.length === 0) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="image-viewer-overlay" onClick={handleOverlayClick}>
      <div className="image-viewer-container" onClick={e => e.stopPropagation()}>
        <button
          className="image-viewer-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {images.length > 1 && (
          <>
            <button
              type="button"
              className="image-viewer-nav image-viewer-nav-left"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrevious();
              }}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              type="button"
              className="image-viewer-nav image-viewer-nav-right"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next image"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        <div className="image-viewer-toolbar">
          <button
            type="button"
            className="image-viewer-toolbar-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleZoomOut();
            }}
            disabled={zoom <= 0.5}
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="image-viewer-zoom-indicator">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="image-viewer-toolbar-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleZoomIn();
            }}
            disabled={zoom >= 3}
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="image-viewer-toolbar-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleResetZoom();
            }}
            disabled={zoom === 1}
            aria-label="Reset zoom"
          >
            Reset
          </button>
        </div>

        <div className="image-viewer-content">
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1} of ${images.length}`}
            className="image-viewer-image"
            style={{ '--image-zoom': zoom } as React.CSSProperties}
            onDoubleClick={handleResetZoom}
          />
        </div>

        {images.length > 1 && (
          <div className="image-viewer-counter">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
}
