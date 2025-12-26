import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { createCase, uploadAttachments } from '../../api/cases';
import type { CaseDetail } from '../../api/cases';
import { getClients, getSites, getContacts } from '../../api/data';
import type { Client, Site, Contact } from '../../api/data';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';

export type CreateCaseResult = 
  | { success: true; caseId: number }
  | { success: false };

export function useCreateCase() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  // Track which file index corresponds to each preview index
  const [previewToFileIndex, setPreviewToFileIndex] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  // Track processed files to prevent duplicates
  const processedFilesRef = useRef<Set<string>>(new Set());
  
  const [form, setForm] = useState({
    client_id: '',
    site_id: '',
    contact_id: '',
    description: '',
    case_type: '',
    priority: '',
  });

  useEffect(() => {
    getClients().then(res => setClients(res.data));
  }, []);

  useEffect(() => {
    if (form.client_id) {
      getSites(Number(form.client_id)).then(res => setSites(res.data));
      setForm(f => ({ ...f, site_id: '', contact_id: '' }));
    }
  }, [form.client_id]);

  useEffect(() => {
    if (form.site_id) {
      getContacts(Number(form.site_id)).then(res => setContacts(res.data));
      setForm(f => ({ ...f, contact_id: '' }));
    }
  }, [form.site_id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    
    // Reset input value first to allow uploading the same file again
    e.target.value = '';
    
    // Track processing status for toast notifications
    const processingStatus = {
      total: selectedFiles.length,
      success: 0,
      error: 0,
      completed: 0,
    };
    
    const checkAndShowToast = () => {
      processingStatus.completed++;
      if (processingStatus.completed === processingStatus.total) {
        if (processingStatus.success > 0 && processingStatus.error === 0) {
          // All attachments succeeded
          showSuccess(processingStatus.success === 1 
            ? 'Attachments uploaded successfully' 
            : `${processingStatus.success} attachments uploaded successfully`);
        } else if (processingStatus.error > 0 && processingStatus.success === 0) {
          // All attachments failed
          showError(processingStatus.error === 1 
            ? 'Failed to uploade attachment' 
            : `Failed to uploade ${processingStatus.error} attachment${processingStatus.error > 1 ? 's' : ''}`);
        } else if (processingStatus.success > 0 && processingStatus.error > 0) {
          // Mixed results
          showSuccess(`${processingStatus.success} attachment${processingStatus.success > 1 ? 's' : ''} uploaded successfully`);
          showError(`${processingStatus.error} attachment${processingStatus.error > 1 ? 's' : ''} failed to uploade`);
        }
      }
    };
    
    // Update files state
    setFiles(prev => {
      const startFileIndex = prev.length;
      const newFiles = [...prev, ...selectedFiles];
      
      // Process files
      selectedFiles.forEach((file, idx) => {
        if (file.type.startsWith('image/')) {
          // Create unique identifier for this file (name + size + lastModified)
          const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
          
          // Skip if already processed
          if (processedFilesRef.current.has(fileKey)) {
            processingStatus.success++;
            checkAndShowToast();
            return;
          }
          
          // Mark as processed
          processedFilesRef.current.add(fileKey);
          
          const reader = new FileReader();
          const fileIndex = startFileIndex + idx;
          
          reader.onload = (ev) => {
            const result = ev.target?.result as string;
            if (result) {
              // Add preview
              setPreviews(prevPreviews => [...prevPreviews, result]);
              
              // Track mapping
              setPreviewToFileIndex(prevMapping => [...prevMapping, fileIndex]);
              processingStatus.success++;
            } else {
              processingStatus.error++;
            }
            checkAndShowToast();
          };
          
          reader.onerror = () => {
            // Remove from processed set on error so it can be retried
            processedFilesRef.current.delete(fileKey);
            processingStatus.error++;
            checkAndShowToast();
          };
          
          reader.readAsDataURL(file);
        } else {
          // Non-image files are added directly without preview
          processingStatus.success++;
          checkAndShowToast();
        }
      });
      
      return newFiles;
    });
  };

  const handleDeletePreview = (previewIndex: number) => {
    // Find the corresponding file index
    const fileIndex = previewToFileIndex[previewIndex];
    
    // Remove the file at that index and clear it from processedFilesRef
    setFiles(prev => {
      const fileToRemove = prev[fileIndex];
      if (fileToRemove) {
        // Create unique identifier for this file
        const fileKey = `${fileToRemove.name}-${fileToRemove.size}-${fileToRemove.lastModified}`;
        // Remove from processedFilesRef to allow re-uploading
        processedFilesRef.current.delete(fileKey);
      }
      return prev.filter((_, i) => i !== fileIndex);
    });
    
    // Remove the preview and its mapping
    setPreviews(prev => prev.filter((_, i) => i !== previewIndex));
    setPreviewToFileIndex(prev => {
      const newMapping = prev.filter((_, i) => i !== previewIndex);
      // Adjust indices for files that come after the deleted one
      return newMapping.map(idx => idx > fileIndex ? idx - 1 : idx);
    });
    
    // Show success toast when attachments is deleted
    showSuccess('Attachment removed successfully');
  };

  const handleFormChange = (newForm: typeof form) => {
    setForm(newForm);
    // Clear errors for fields that are being changed
    const changedFields = Object.keys(newForm).filter(key => newForm[key as keyof typeof newForm] !== form[key as keyof typeof form]);
    if (changedFields.length > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        changedFields.forEach(field => {
          // Clear both field_id and field errors
          delete newErrors[field];
          delete newErrors[field.replace('_id', '')];
        });
        return newErrors;
      });
    }
  };

  const clearFieldError = (keys: string[]) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      keys.forEach(key => {
        delete newErrors[key];
      });
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<CreateCaseResult> => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) return { success: false };
    
    // Client-side validation for required fields
    const validationErrors: Record<string, string> = {};
    
    if (!form.client_id || form.client_id === '') {
      validationErrors.client_id = 'is required';
    }
    
    if (!form.site_id || form.site_id === '') {
      validationErrors.site_id = 'is required';
    }
    
    if (!form.contact_id || form.contact_id === '') {
      validationErrors.contact_id = 'is required';
    }
    
    if (!form.case_type || form.case_type === '') {
      validationErrors.case_type = 'is required';
    }
    
    if (!form.priority || form.priority === '') {
      validationErrors.priority = 'is required';
    }
    
    // If there are validation errors, display them and stop
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return { success: false };
    }
    
    setErrors({});
    setLoading(true);
    try {
      const res = await createCase({
      client_id: Number(form.client_id),
      site_id: Number(form.site_id),
      contact_id: Number(form.contact_id),
      description: form.description,
      case_type: form.case_type,
      priority: form.priority,
    } as Partial<CaseDetail>);
      if (files.length) {
        await uploadAttachments(res.data.id, 1, files, 'case_creation');
      }
      // Invalidate case list cache to ensure new case appears immediately
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setFiles([]);
      setPreviews([]);
      setPreviewToFileIndex([]);
      processedFilesRef.current.clear();
      // Show success toast
      showSuccess('Case created successfully');
      return { success: true, caseId: res.data.id };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        const responseErrors = error.response.data.errors as Record<string, string[]>;
        const normalizedErrors = Object.entries(responseErrors).reduce<Record<string, string>>((acc, [key, value]) => {
          acc[key] = Array.isArray(value) ? value.join(' ') : String(value);
          return acc;
        }, {});
        setErrors(normalizedErrors);
        // Don't show toast for validation errors - they're shown in the form
        return { success: false };
      } else {
        // Show error toast for unknown errors
        showError('Failed to create case. Please try again.');
        setErrors({});
        return { success: false };
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    setForm,
    clients,
    sites,
    contacts,
    files,
    previews,
    handleFileChange,
    handleDeletePreview,
    handleFormChange,
    handleSubmit,
    errors,
    clearFieldError,
    loading,
  };
}

