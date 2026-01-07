import { useEffect, useRef, useState } from 'react';
import Button from '../../../Button';

interface SignatureCanvasProps {
  value: string;
  onChange: (signature: string) => void;
  canEdit: boolean;
}

export default function SignatureCanvas({ value, onChange, canEdit }: SignatureCanvasProps) {
  const signatureRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Save canvas state to history
  const saveToHistory = () => {
    if (!signatureRef.current) return;
    const canvas = signatureRef.current;
    const dataURL = canvas.toDataURL('image/png');
    
    // Don't save if it's the same as the current state in history
    if (historyRef.current.length > 0 && historyRef.current[historyIndexRef.current] === dataURL) {
      return;
    }
    
    // Remove any future history if we're not at the end
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }
    
    // Add new state to history
    historyRef.current.push(dataURL);
    historyIndexRef.current = historyRef.current.length - 1;
    
    // Limit history size to prevent memory issues
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
    
    // Update button states
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  };

  // Initialize signature canvas and add touch event listeners
  useEffect(() => {
    if (signatureRef.current && canEdit) {
      const canvas = signatureRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Load existing signature if available
        if (value) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            saveToHistory();
          };
          img.src = value;
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          saveToHistory();
        }

        const startDrawing = (e: MouseEvent | TouchEvent) => {
          e.preventDefault();
          isDrawingRef.current = true;
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
          const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
          ctx.beginPath();
          ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
        };

        const draw = (e: MouseEvent | TouchEvent) => {
          if (!isDrawingRef.current) return;
          e.preventDefault();
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
          const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
          ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
          ctx.stroke();
        };

        const stopDrawing = () => {
          if (isDrawingRef.current) {
            isDrawingRef.current = false;
            saveToHistory();
            if (signatureRef.current) {
              onChange(signatureRef.current.toDataURL('image/png'));
            }
          }
        };

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);
        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);

        return () => {
          canvas.removeEventListener('mousedown', startDrawing);
          canvas.removeEventListener('mousemove', draw);
          canvas.removeEventListener('mouseup', stopDrawing);
          canvas.removeEventListener('mouseleave', stopDrawing);
          canvas.removeEventListener('touchstart', startDrawing);
          canvas.removeEventListener('touchmove', draw);
          canvas.removeEventListener('touchend', stopDrawing);
        };
      }
    } else if (signatureRef.current && !canEdit && value) {
      // Load signature for display only
      const canvas = signatureRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = value;
      }
    }
  }, [canEdit, value, onChange]);

  const handleClear = () => {
    if (!signatureRef.current) return;
    const ctx = signatureRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, signatureRef.current.width, signatureRef.current.height);
      saveToHistory();
      onChange('');
    }
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const prevState = historyRef.current[historyIndexRef.current];
      if (signatureRef.current) {
        const ctx = signatureRef.current.getContext('2d');
        if (ctx && prevState) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, signatureRef.current!.width, signatureRef.current!.height);
            ctx.drawImage(img, 0, 0);
            onChange(prevState);
          };
          img.src = prevState;
        }
      }
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const nextState = historyRef.current[historyIndexRef.current];
      if (signatureRef.current) {
        const ctx = signatureRef.current.getContext('2d');
        if (ctx && nextState) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, signatureRef.current!.width, signatureRef.current!.height);
            ctx.drawImage(img, 0, 0);
            onChange(nextState);
          };
          img.src = nextState;
        }
      }
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  };

  return (
    <div className="stage4-signature-section">
      <label className="stage4-label" id="signature-canvas-label">Client Signature</label>
      <div className="stage4-signature-container">
        <canvas
          ref={signatureRef}
          width={600}
          height={200}
          className={`stage4-signature-canvas ${canEdit ? 'stage4-signature-canvas-editable' : 'stage4-signature-canvas-readonly'}`}
          aria-label="Client signature canvas"
          aria-labelledby="signature-canvas-label"
          role="img"
        />
      </div>
      {canEdit && (
        <div className="stage4-signature-actions">
          <Button onClick={handleClear} variant="tertiary" alwaysAutoWidth>
            Clear
          </Button>
          <Button onClick={handleUndo} variant="tertiary" disabled={!canUndo} alwaysAutoWidth>
            Undo
          </Button>
          <Button onClick={handleRedo} variant="tertiary" disabled={!canRedo} alwaysAutoWidth>
            Redo
          </Button>
        </div>
      )}
    </div>
  );
}
