import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { createCase, uploadAttachments } from '../../api/cases';
import type { CaseDetail } from '../../api/cases';
import { getClients, getSites, getContacts } from '../../api/data';
import type { Client, Site, Contact } from '../../api/data';

export function useCreateCase() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  // Track which file index corresponds to each preview index
  const [previewToFileIndex, setPreviewToFileIndex] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    
    // Update files state
    setFiles(prev => {
      const startFileIndex = prev.length;
      const newFiles = [...prev, ...selectedFiles];
      
      // Process only NEW image files
      selectedFiles.forEach((file, idx) => {
        if (file.type.startsWith('image/')) {
          // Create unique identifier for this file (name + size + lastModified)
          const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
          
          // Skip if already processed
          if (processedFilesRef.current.has(fileKey)) {
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
            }
          };
          
          reader.onerror = () => {
            // Remove from processed set on error so it can be retried
            processedFilesRef.current.delete(fileKey);
          };
          
          reader.readAsDataURL(file);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation cho các field bắt buộc
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
    
    // Nếu có lỗi validation, hiển thị và dừng lại
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors({});
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
      setFiles([]);
      setPreviews([]);
      setPreviewToFileIndex([]);
      processedFilesRef.current.clear();
      navigate('/');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        const responseErrors = error.response.data.errors as Record<string, string[]>;
        const normalizedErrors = Object.entries(responseErrors).reduce<Record<string, string>>((acc, [key, value]) => {
          acc[key] = Array.isArray(value) ? value.join(' ') : String(value);
          return acc;
        }, {});
        setErrors(normalizedErrors);
      } else {
        // Nếu không có lỗi cụ thể từ backend, không hiển thị gì
        setErrors({});
      }
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
  };
}

