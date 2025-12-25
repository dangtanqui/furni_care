import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCreateCase } from '../../../src/hooks/pages/useCreateCase';
import * as casesApi from '../../../src/api/cases';
import * as dataApi from '../../../src/api/data';
import { useToast } from '../../../src/contexts/ToastContext';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../src/api/cases');
vi.mock('../../../src/api/data');
vi.mock('../../../src/contexts/ToastContext');

const mockCreateCase = vi.mocked(casesApi.createCase);
const mockUploadAttachments = vi.mocked(casesApi.uploadAttachments);
const mockGetClients = vi.mocked(dataApi.getClients);
const mockGetSites = vi.mocked(dataApi.getSites);
const mockGetContacts = vi.mocked(dataApi.getContacts);
const mockUseToast = vi.mocked(useToast);

describe('useCreateCase', () => {
  const mockShowSuccess = vi.fn();
  const mockShowError = vi.fn();

  const mockClients = [
    { id: 1, name: 'Client 1', code: 'C1' },
    { id: 2, name: 'Client 2', code: 'C2' },
  ];

  const mockSites = [
    { id: 1, name: 'Site 1', city: 'City 1' },
    { id: 2, name: 'Site 2', city: 'City 2' },
  ];

  const mockContacts = [
    { id: 1, name: 'Contact 1', phone: '123' },
    { id: 2, name: 'Contact 2', phone: '456' },
  ];

  beforeEach(() => {
    mockUseToast.mockReturnValue({
      showToast: vi.fn(),
      showSuccess: mockShowSuccess,
      showError: mockShowError,
      showWarning: vi.fn(),
      showInfo: vi.fn(),
    });

    mockGetClients.mockResolvedValue({
      data: mockClients,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    } as any);
    mockGetSites.mockResolvedValue({
      data: mockSites,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    } as any);
    mockGetContacts.mockResolvedValue({
      data: mockContacts,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    } as any);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should initialize with default values', async () => {
      const { result } = renderHook(() => useCreateCase());

      await waitFor(() => {
        expect(result.current.clients).toEqual(mockClients);
      });

      expect(result.current.form).toEqual({
        client_id: '',
        site_id: '',
        contact_id: '',
        description: '',
        case_type: '',
        priority: '',
      });
      expect(result.current.sites).toEqual([]);
      expect(result.current.contacts).toEqual([]);
      expect(result.current.files).toEqual([]);
      expect(result.current.previews).toEqual([]);
      expect(result.current.errors).toEqual({});
      expect(result.current.loading).toBe(false);
    });

    it('should load clients on mount', async () => {
      renderHook(() => useCreateCase());

      await waitFor(() => {
        expect(mockGetClients).toHaveBeenCalled();
      });
    });
  });

  describe('Form state management', () => {
    it('should update form state', async () => {
      const { result } = renderHook(() => useCreateCase());
      await waitFor(() => expect(result.current.clients).toEqual(mockClients));

      act(() => {
        result.current.setForm({
          client_id: '1',
          site_id: '',
          contact_id: '',
          description: 'Test description',
          case_type: 'repair',
          priority: 'medium',
        });
      });

      await waitFor(() => {
        expect(result.current.form.client_id).toBe('1');
        expect(result.current.form.description).toBe('Test description');
      });
    });

    it('should load sites when client_id changes', async () => {
      const { result } = renderHook(() => useCreateCase());
      await waitFor(() => expect(result.current.clients).toEqual(mockClients));

      act(() => {
        result.current.setForm({
          ...result.current.form,
          client_id: '1',
        });
      });

      await waitFor(() => {
        expect(mockGetSites).toHaveBeenCalledWith(1);
        expect(result.current.sites).toEqual(mockSites);
        expect(result.current.form.site_id).toBe('');
        expect(result.current.form.contact_id).toBe('');
      });
    });

    it('should load contacts when site_id changes', async () => {
      const { result } = renderHook(() => useCreateCase());
      await waitFor(() => expect(result.current.clients).toEqual(mockClients));

      act(() => {
        result.current.setForm({
          ...result.current.form,
          client_id: '1',
          site_id: '1',
        });
      });

      await waitFor(() => {
        expect(mockGetContacts).toHaveBeenCalledWith(1);
        expect(result.current.contacts).toEqual(mockContacts);
        expect(result.current.form.contact_id).toBe('');
      });
    });
  });

  describe('File handling', () => {
    it('should handle file selection', async () => {
      const { result } = renderHook(() => useCreateCase());
      await waitFor(() => expect(result.current.clients).toEqual(mockClients));

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const event = {
        target: {
          files: [file],
          value: '',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        result: 'data:image/jpeg;base64,test',
        onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((e: ProgressEvent<FileReader>) => void) | null,
      };

      vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      result.current.handleFileChange(event);

      await waitFor(() => {
        expect(result.current.files).toHaveLength(1);
        expect(result.current.files[0]).toBe(file);
      });

      // Simulate FileReader onload
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,test' } } as ProgressEvent<FileReader>);
      }

      await waitFor(() => {
        expect(result.current.previews.length).toBeGreaterThan(0);
      });
    });

    it('should handle preview deletion', async () => {
      const { result } = renderHook(() => useCreateCase());
      await waitFor(() => expect(result.current.clients).toEqual(mockClients));

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const event = {
        target: {
          files: [file],
          value: '',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      const mockFileReader = {
        readAsDataURL: vi.fn(),
        result: 'data:image/jpeg;base64,test',
        onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((e: ProgressEvent<FileReader>) => void) | null,
      };

      vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      act(() => {
        result.current.handleFileChange(event);
      });

      // Trigger onload after a short delay to simulate async FileReader
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,test' } } as ProgressEvent<FileReader>);
        }
      });

      await waitFor(() => {
        expect(result.current.previews.length).toBeGreaterThan(0);
      });

      result.current.handleDeletePreview(0);

      await waitFor(() => {
        expect(result.current.previews).toHaveLength(0);
        expect(result.current.files).toHaveLength(0);
      });
    });

    it('should not process duplicate files', async () => {
      const { result } = renderHook(() => useCreateCase());
      await waitFor(() => expect(result.current.clients).toEqual(mockClients));

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const event = {
        target: {
          files: [file],
          value: '',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      const mockFileReader = {
        readAsDataURL: vi.fn(),
        result: 'data:image/jpeg;base64,test',
        onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((e: ProgressEvent<FileReader>) => void) | null,
      };

      vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      // Add file first time
      result.current.handleFileChange(event);
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,test' } } as ProgressEvent<FileReader>);
      }

      await waitFor(() => {
        expect(result.current.files).toHaveLength(1);
      });

      // Try to add same file again
      result.current.handleFileChange(event);

      // Should still only have one file
      expect(result.current.files).toHaveLength(1);
    });
  });

  describe('Form validation', () => {
    it('should validate required fields', async () => {
      const { result } = renderHook(() => useCreateCase());
      await waitFor(() => expect(result.current.clients).toEqual(mockClients));

      const form = document.createElement('form');
      const submitEvent = { preventDefault: vi.fn(), target: form } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(submitEvent);
      });

      await waitFor(() => {
        expect(result.current.errors).toHaveProperty('client_id');
        expect(result.current.errors).toHaveProperty('site_id');
        expect(result.current.errors).toHaveProperty('contact_id');
        expect(result.current.errors).toHaveProperty('case_type');
        expect(result.current.errors).toHaveProperty('priority');
      });
      expect(mockCreateCase).not.toHaveBeenCalled();
    });

    it('should clear errors when form changes', async () => {
      const { result } = renderHook(() => useCreateCase());
      await waitFor(() => expect(result.current.clients).toEqual(mockClients));

      // Set errors
      act(() => {
        result.current.setForm({
          ...result.current.form,
          client_id: '1',
        });
      });

      // Simulate validation error
      const form = document.createElement('form');
      const submitEvent = { preventDefault: vi.fn(), target: form } as unknown as React.FormEvent;
      await act(async () => {
        await result.current.handleSubmit(submitEvent);
      });

      await waitFor(() => {
        expect(result.current.errors).toHaveProperty('site_id');
      });

      // Change form
      act(() => {
        result.current.handleFormChange({
          ...result.current.form,
          site_id: '1',
        });
      });

      // Error should be cleared
      await waitFor(() => {
        expect(result.current.errors).not.toHaveProperty('site_id');
      });
    });
  });

  describe('Case creation', () => {
    it('should create case successfully', async () => {

      const createdCase = { id: 1, case_number: 'CASE-001' };
      mockCreateCase.mockResolvedValue({
        data: createdCase,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
      mockUploadAttachments.mockResolvedValue({
        data: { stage: 1, attachments: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCreateCase());
      await waitFor(() => expect(result.current.clients).toEqual(mockClients));

      // Set form fields in correct order
      act(() => {
        result.current.setForm({
          ...result.current.form,
          client_id: '1',
        });
      });

      await waitFor(() => expect(result.current.sites).toEqual(mockSites));

      act(() => {
        result.current.setForm({
          ...result.current.form,
          site_id: '1',
        });
      });

      await waitFor(() => expect(result.current.contacts).toEqual(mockContacts));

      act(() => {
        result.current.setForm({
          ...result.current.form,
          contact_id: '1',
          description: 'Test description',
          case_type: 'repair',
          priority: 'medium',
        });
      });

      const form = document.createElement('form');
      const submitEvent = { preventDefault: vi.fn(), target: form } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(submitEvent);
      });

      await waitFor(() => {
        expect(mockCreateCase).toHaveBeenCalledWith({
          client_id: 1,
          site_id: 1,
          contact_id: 1,
          description: 'Test description',
          case_type: 'repair',
          priority: 'medium',
        });
        expect(mockShowSuccess).toHaveBeenCalledWith('Case created successfully');
        expect(result.current.files).toHaveLength(0);
        expect(result.current.previews).toHaveLength(0);
      });
    });

    it('should upload attachments if files are provided', async () => {

      const createdCase = { id: 1, case_number: 'CASE-001' };
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      mockCreateCase.mockResolvedValue({
        data: createdCase,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);
      mockUploadAttachments.mockResolvedValue({
        data: { stage: 1, attachments: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCreateCase());
      await waitFor(() => expect(result.current.clients).toEqual(mockClients));

      // Set client_id first
      act(() => {
        result.current.setForm({
          ...result.current.form,
          client_id: '1',
        });
      });

      // Wait for sites to load
      await waitFor(() => expect(result.current.sites).toEqual(mockSites));

      // Set site_id
      act(() => {
        result.current.setForm({
          ...result.current.form,
          site_id: '1',
        });
      });

      // Wait for contacts to load
      await waitFor(() => expect(result.current.contacts).toEqual(mockContacts));

      // Set contact_id and other fields
      act(() => {
        result.current.setForm({
          ...result.current.form,
          contact_id: '1',
          description: 'Test description',
          case_type: 'repair',
          priority: 'medium',
        });
      });

      // Add file after form is set
      const event = {
        target: {
          files: [file],
          value: '',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleFileChange(event);
      });

      await waitFor(() => {
        expect(result.current.files).toHaveLength(1);
      });

      const form = document.createElement('form');
      const submitEvent = { preventDefault: vi.fn(), target: form } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(submitEvent);
      });

      await waitFor(() => {
        expect(mockUploadAttachments).toHaveBeenCalledWith(1, 1, [file], 'case_creation');
      });
    });

    it('should handle creation error with backend validation errors', async () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {
            errors: {
              description: ['is required'],
              client_id: ['is invalid'],
            },
          },
        },
      };

      mockCreateCase.mockRejectedValue(error);

      const { result } = renderHook(() => useCreateCase());
      await waitFor(() => expect(result.current.clients).toEqual(mockClients));

      // Set form fields in correct order
      act(() => {
        result.current.setForm({
          ...result.current.form,
          client_id: '1',
        });
      });

      await waitFor(() => expect(result.current.sites).toEqual(mockSites));

      act(() => {
        result.current.setForm({
          ...result.current.form,
          site_id: '1',
        });
      });

      await waitFor(() => expect(result.current.contacts).toEqual(mockContacts));

      act(() => {
        result.current.setForm({
          ...result.current.form,
          contact_id: '1',
          description: 'Test description',
          case_type: 'repair',
          priority: 'medium',
        });
      });

      const form = document.createElement('form');
      const submitEvent = { preventDefault: vi.fn(), target: form } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(submitEvent);
      });

      await waitFor(() => {
        expect(result.current.errors).toHaveProperty('description');
        expect(result.current.errors).toHaveProperty('client_id');
      });
      expect(mockShowError).toHaveBeenCalledWith('Failed to create case. Please check the form for errors.');
    });

    it('should handle creation error without specific errors', async () => {
      // Create an error that is not an AxiosError with response.data.errors
      const error = new Error('Network error');
      Object.assign(error, { isAxiosError: false });
      mockCreateCase.mockRejectedValue(error);

      const { result } = renderHook(() => useCreateCase());
      await waitFor(() => expect(result.current.clients).toEqual(mockClients));

      // Set form fields in correct order
      act(() => {
        result.current.setForm({
          ...result.current.form,
          client_id: '1',
        });
      });

      await waitFor(() => expect(result.current.sites).toEqual(mockSites));

      act(() => {
        result.current.setForm({
          ...result.current.form,
          site_id: '1',
        });
      });

      await waitFor(() => expect(result.current.contacts).toEqual(mockContacts));

      act(() => {
        result.current.setForm({
          ...result.current.form,
          contact_id: '1',
          description: 'Test description',
          case_type: 'repair',
          priority: 'medium',
        });
      });

      const form = document.createElement('form');
      const submitEvent = { preventDefault: vi.fn(), target: form } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(submitEvent);
      });

      await waitFor(() => {
        expect(result.current.errors).toEqual({});
      });
      expect(mockShowError).toHaveBeenCalledWith('Failed to create case. Please try again.');
    });

    it('should prevent double submission', async () => {
      mockCreateCase.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { result } = renderHook(() => useCreateCase());
      await waitFor(() => expect(result.current.clients).toEqual(mockClients));

      // Set form fields in correct order
      act(() => {
        result.current.setForm({
          ...result.current.form,
          client_id: '1',
        });
      });

      await waitFor(() => expect(result.current.sites).toEqual(mockSites));

      act(() => {
        result.current.setForm({
          ...result.current.form,
          site_id: '1',
        });
      });

      await waitFor(() => expect(result.current.contacts).toEqual(mockContacts));

      act(() => {
        result.current.setForm({
          ...result.current.form,
          contact_id: '1',
          description: 'Test description',
          case_type: 'repair',
          priority: 'medium',
        });
      });

      const form = document.createElement('form');
      const submitEvent = { preventDefault: vi.fn(), target: form } as unknown as React.FormEvent;

      // Start first submission (async, sets loading to true after validation)
      act(() => {
        result.current.handleSubmit(submitEvent);
      });
      
      // Wait for loading to be set (React state update happens after validation passes)
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      }, { timeout: 3000 });
      
      // Try second submission while first is still in progress (loading is true)
      // This should be blocked by the loading check at the start of handleSubmit
      act(() => {
        result.current.handleSubmit(submitEvent);
      });

      // Wait a bit to ensure second call was processed
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Should only be called once (second call should be blocked by loading check)
      expect(mockCreateCase).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearFieldError', () => {
    it('should clear specific field errors', async () => {
      // Ensure mock is setup before rendering hook
      mockGetClients.mockResolvedValue({
        data: mockClients,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCreateCase());
      
      // Wait for clients to be loaded (with longer timeout)
      await waitFor(() => {
        expect(result.current.clients).not.toBeNull();
        expect(result.current.clients).toEqual(mockClients);
      }, { timeout: 5000 });

      // Set errors manually by submitting empty form
      const form = document.createElement('form');
      const submitEvent = { preventDefault: vi.fn(), target: form } as unknown as React.FormEvent;
      await act(async () => {
        await result.current.handleSubmit(submitEvent);
      });

      await waitFor(() => {
        expect(result.current.errors).toHaveProperty('client_id');
      });

      act(() => {
        result.current.clearFieldError(['client_id']);
      });

      await waitFor(() => {
        expect(result.current.errors).not.toHaveProperty('client_id');
      });
    });
  });
});

