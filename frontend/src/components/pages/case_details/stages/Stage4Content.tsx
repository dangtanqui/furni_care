import { useState, useEffect, useRef } from 'react';
import Button from '../../../../fields/Button';
import AttachmentGrid from '../../../AttachmentGrid';
import FileUpload from '../../../FileUpload';
import type { Stage4Props } from '../../../../types/components/pages/CaseDetails';
import { getCase } from '../../../../api/cases';
import '../../../../styles/components/pages/case_details/stages/Stage4Content.css';

export default function Stage4Content({ caseData, canEdit, isCS, isLeader, onUpdate, onAdvance, onOpenStage, onUploadAttachments, onDeleteAttachment }: Stage4Props) {
  const [form, setForm] = useState({
    execution_report: caseData.execution_report || '',
    client_feedback: caseData.client_feedback || '',
    client_rating: caseData.client_rating || 5,
    client_signature: caseData.client_signature || '',
  });
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    try {
      return JSON.parse(caseData.execution_checklist || '[]');
    } catch { return [false, false]; }
  });
  const signatureRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const isCurrent = caseData.current_stage === 4;
  const attachments = caseData.stage_attachments?.['4'] || [];
  const checklistItems = ['Work completed as planned', 'Client satisfied with work'];

  // Sync state with caseData when component mounts or caseData changes
  useEffect(() => {
    setForm({
      execution_report: caseData.execution_report || '',
      client_feedback: caseData.client_feedback || '',
      client_rating: caseData.client_rating || 5,
      client_signature: caseData.client_signature || '',
    });
    try {
      setChecklist(JSON.parse(caseData.execution_checklist || '[]'));
    } catch {
      setChecklist([false, false]);
    }
  }, [caseData.id, caseData.execution_report, caseData.client_feedback, caseData.client_rating, caseData.execution_checklist, caseData.client_signature]);

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
        if (caseData.client_signature) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            // Initialize history with existing signature
            historyRef.current = [caseData.client_signature];
            historyIndexRef.current = 0;
            setCanUndo(false);
            setCanRedo(false);
          };
          img.src = caseData.client_signature;
        } else {
          // Initialize with empty canvas
          const emptyDataURL = canvas.toDataURL('image/png');
          historyRef.current = [emptyDataURL];
          historyIndexRef.current = 0;
          setCanUndo(false);
          setCanRedo(false);
        }
      }

      // Add touch event listeners with passive: false to allow preventDefault
      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        if (!signatureRef.current || !canEdit) return;
        const canvas = signatureRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const touch = e.touches[0];
        if (!touch) return;
        
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        // Save current state to history before starting to draw (only if not already drawing)
        if (!isDrawingRef.current) {
          const dataURL = canvas.toDataURL('image/png');
          const currentState = historyRef.current.length > 0 ? historyRef.current[historyIndexRef.current] : null;
          if (currentState !== dataURL) {
            if (historyIndexRef.current < historyRef.current.length - 1) {
              historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
            }
            historyRef.current.push(dataURL);
            historyIndexRef.current = historyRef.current.length - 1;
            setCanUndo(historyIndexRef.current > 0);
            setCanRedo(false);
          }
        }
        
        isDrawingRef.current = true;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.moveTo(x, y);
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (!isDrawingRef.current || !signatureRef.current || !canEdit) return;
        const canvas = signatureRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const touch = e.touches[0];
        if (!touch) return;
        
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      };

      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        if (!signatureRef.current) return;
        const wasDrawing = isDrawingRef.current;
        isDrawingRef.current = false;
        if (wasDrawing) {
          saveToHistory();
          const canvas = signatureRef.current;
          const dataURL = canvas.toDataURL('image/png');
          setForm((prev) => ({ ...prev, client_signature: dataURL }));
        }
      };

      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
      canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

      return () => {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
        canvas.removeEventListener('touchcancel', handleTouchEnd);
      };
    }
  }, [canEdit, caseData.client_signature]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    await onUploadAttachments(4, selectedFiles);
    e.target.value = '';
  };

  const toggleChecklist = (idx: number) => {
    const newChecklist = [...checklist];
    newChecklist[idx] = !newChecklist[idx];
    setChecklist(newChecklist);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!signatureRef.current) return { x: 0, y: 0 };
    const canvas = signatureRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Handle both mouse and touch events
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!signatureRef.current || !canEdit) return;
    if ('touches' in e) {
      e.preventDefault(); // Prevent scrolling on touch devices
    }
    // Save current state to history before starting to draw (only if not already drawing)
    if (!isDrawingRef.current) {
      // Save the state before we start drawing
      const canvas = signatureRef.current;
      const dataURL = canvas.toDataURL('image/png');
      
      // Only save if it's different from the current state in history (at current index)
      const currentState = historyRef.current.length > 0 ? historyRef.current[historyIndexRef.current] : null;
      if (currentState !== dataURL) {
        // Remove any future history if we're not at the end
        if (historyIndexRef.current < historyRef.current.length - 1) {
          historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        }
        // Add current state to history before starting to draw
        historyRef.current.push(dataURL);
        historyIndexRef.current = historyRef.current.length - 1;
        // Update button states
        setCanUndo(historyIndexRef.current > 0);
        setCanRedo(false);
      }
    }
    isDrawingRef.current = true;
    const canvas = signatureRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const { x, y } = getCoordinates(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !signatureRef.current || !canEdit) return;
    if ('touches' in e) {
      e.preventDefault(); // Prevent scrolling on touch devices
    }
    const canvas = signatureRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const { x, y } = getCoordinates(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!signatureRef.current) return;
    const wasDrawing = isDrawingRef.current;
    isDrawingRef.current = false;
    // Save to history only if we were actually drawing
    if (wasDrawing) {
      saveToHistory();
      // Save signature to form
      const canvas = signatureRef.current;
      const dataURL = canvas.toDataURL('image/png');
      setForm({ ...form, client_signature: dataURL });
    }
  };

  const undo = () => {
    if (historyIndexRef.current > 0 && signatureRef.current) {
      historyIndexRef.current--;
      const canvas = signatureRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          setForm({ ...form, client_signature: dataURL });
          // Update button states
          setCanUndo(historyIndexRef.current > 0);
          setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
        };
        img.src = historyRef.current[historyIndexRef.current];
      }
    }
  };

  const redo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1 && signatureRef.current) {
      historyIndexRef.current++;
      const canvas = signatureRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          setForm({ ...form, client_signature: dataURL });
          // Update button states
          setCanUndo(historyIndexRef.current > 0);
          setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
        };
        img.src = historyRef.current[historyIndexRef.current];
      }
    }
  };

  const clearSignature = () => {
    if (!signatureRef.current) return;
    const canvas = signatureRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setForm({ ...form, client_signature: '' });
      // Save empty state to history
      saveToHistory();
    }
  };

  return (
    <div className="stage4-container">
      <div>
        <label htmlFor="execution_report" className="stage4-label">Execution Report</label>
        {canEdit ? (
          <textarea
            id="execution_report"
            name="execution_report"
            value={form.execution_report}
            onChange={e => setForm({ ...form, execution_report: e.target.value })}
            className="stage4-textarea"
            placeholder="Document execution details..."
          />
        ) : (
          <p className="stage4-readonly-content">{caseData.execution_report || '-'}</p>
        )}
      </div>

      <div>
        {canEdit ? (
          <FileUpload
            id="stage4-attachments"
            name="stage4-attachments"
            accept="image/*,.pdf"
            onFileChange={handleFileChange}
            disabled={!canEdit}
          />
        ) : (
          <label className="stage4-label">Photos / Attachments</label>
        )}
        <AttachmentGrid attachments={attachments} canEdit={canEdit} onDelete={onDeleteAttachment} />
        {!canEdit && attachments.length === 0 && (
          <p className="stage4-no-attachments">No attachments</p>
        )}
      </div>

      <div>
        <label className="stage4-checklist-label">Execution Checklist</label>
        <div className="stage4-checklist-container">
          {checklistItems.map((item, idx) => (
            <label key={idx} htmlFor={`stage4-checklist-${idx}`} className="stage4-checklist-item">
              <input
                id={`stage4-checklist-${idx}`}
                name={`stage4-checklist-${idx}`}
                type="checkbox"
                checked={checklist[idx] || false}
                onChange={() => canEdit && toggleChecklist(idx)}
                disabled={!canEdit}
                className="stage4-checklist-checkbox"
              />
              <span className={checklist[idx] ? 'stage4-checklist-completed' : ''}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="stage4-signature-label">Client Signature</label>
        {canEdit ? (
          <div className="stage4-signature-container">
            <canvas
              ref={signatureRef}
              width={600}
              height={200}
              className="stage4-signature-canvas"
              style={{ maxWidth: '100%', height: 'auto', touchAction: 'none' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            <div className="stage4-signature-controls">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                className={`stage4-signature-button ${canUndo ? 'stage4-signature-button-enabled' : 'stage4-signature-button-disabled'}`}
              >
                Undo
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                className={`stage4-signature-button ${canRedo ? 'stage4-signature-button-enabled' : 'stage4-signature-button-disabled'}`}
              >
                Redo
              </button>
              <Button
                type="button"
                onClick={clearSignature}
                variant="tertiary"
              >
                Clear
              </Button>
            </div>
          </div>
        ) : (
          <div className="stage4-signature-display">
            {caseData.client_signature ? (
              <img src={caseData.client_signature} alt="Client Signature" className="stage4-signature-image" />
            ) : (
              <p className="stage4-signature-empty">No signature</p>
            )}
          </div>
        )}
      </div>

      <div className="stage4-feedback-section">
        <h4 className="stage4-feedback-title">Client Feedback</h4>
        <div className="space-y-3">
          <div>
            <label className="stage4-rating-label">Rating</label>
            <div className="stage4-rating-container">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => canEdit && setForm({ ...form, client_rating: n })}
                  disabled={!canEdit}
                  className={`stage4-rating-button ${form.client_rating >= n ? 'stage4-rating-button-active' : 'stage4-rating-button-inactive'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="client_feedback" className="stage4-label">Feedback</label>
            {canEdit ? (
              <textarea
                id="client_feedback"
                name="client_feedback"
                value={form.client_feedback}
                onChange={e => setForm({ ...form, client_feedback: e.target.value })}
                className="stage4-feedback-textarea"
              />
            ) : (
              <p>{caseData.client_feedback || '-'}</p>
            )}
          </div>
        </div>
      </div>

      {canEdit && (
        <Button 
          onClick={async () => {
            await onUpdate({
              ...form,
              execution_checklist: JSON.stringify(checklist),
            });
            // Only advance if Stage 4 is the current stage
            if (isCurrent) {
              await onAdvance();
              // Open Stage 5 after advancing
              setTimeout(() => {
                onOpenStage(5);
              }, 100);
            } else {
              // If updating a completed stage, reload case data to get updated current_stage, then open it
              const updatedCase = await getCase(caseData.id);
              setTimeout(() => {
                onOpenStage(updatedCase.data.current_stage);
              }, 100);
            }
          }} 
          variant="primary"
        >
          {isCurrent ? 'Complete' : 'Update'}
        </Button>
      )}

      {!canEdit && isCurrent && (isCS || isLeader) && (
        <div className="stage4-waiting-message">
          <p>⏳ Waiting for Technician to complete execution</p>
        </div>
      )}
    </div>
  );
}

