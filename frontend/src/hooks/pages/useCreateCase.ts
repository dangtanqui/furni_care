import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCase, uploadAttachments } from '../../api/cases';
import { getClients, getSites, getContacts } from '../../api/data';
import type { Client, Site, Contact } from '../../api/data';

export function useCreateCase() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const [form, setForm] = useState({
    client_id: '',
    site_id: '',
    contact_id: '',
    description: '',
    case_type: 'warranty',
    priority: 'medium',
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
    setFiles(prev => [...prev, ...selectedFiles]);

    selectedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string]);
        reader.readAsDataURL(file);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createCase({
      client_id: Number(form.client_id),
      site_id: Number(form.site_id),
      contact_id: Number(form.contact_id),
      description: form.description,
      case_type: form.case_type,
      priority: form.priority,
    } as any);
    if (files.length) {
      await uploadAttachments(res.data.id, 1, files, 'case_creation');
    }
    setFiles([]);
    setPreviews([]);
    navigate('/');
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
    handleSubmit,
  };
}

