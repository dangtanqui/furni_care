import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCase } from '../api/cases';
import { getClients, getSites, getContacts } from '../api/data';
import type { Client, Site, Contact } from '../api/data';
import { ArrowLeft, Upload } from 'lucide-react';

export default function CreateCase() {
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
    await createCase({
      client_id: Number(form.client_id),
      site_id: Number(form.site_id),
      contact_id: Number(form.contact_id),
      description: form.description,
      case_type: form.case_type,
      priority: form.priority,
    } as any);
    navigate('/');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 mb-6 hover:text-[#1e3a5f]">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>
      
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f] mb-6">Create New Case</h1>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select
              value={form.client_id}
              onChange={e => setForm({ ...form, client_id: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site *</label>
            <select
              value={form.site_id}
              onChange={e => setForm({ ...form, site_id: e.target.value })}
              className="input-field"
              required
              disabled={!form.client_id}
            >
              <option value="">Select site...</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {s.city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
            <select
              value={form.contact_id}
              onChange={e => setForm({ ...form, contact_id: e.target.value })}
              className="input-field"
              required
              disabled={!form.site_id}
            >
              <option value="">Select contact...</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input-field h-32"
              placeholder="Describe the issue..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photos / Attachments</label>
            <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0d9488] cursor-pointer block mb-3">
              <input type="file" multiple className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} />
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Click to upload photos/documents</p>
            </label>
            {previews.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative">
                    <img src={src} alt={`Upload ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
              <select
                value={form.case_type}
                onChange={e => setForm({ ...form, case_type: e.target.value })}
                className="input-field"
              >
                <option value="warranty">Warranty</option>
                <option value="maintenance">Maintenance</option>
                <option value="repair">Repair</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-accent w-full">Submit Case</button>
        </form>
      </div>
    </div>
  );
}

