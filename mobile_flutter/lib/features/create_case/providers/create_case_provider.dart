import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'dart:io';
import '../../../core/api/models/data_models.dart';
import '../../../core/services/case_service.dart';
import '../../../core/services/data_service.dart';
import '../../../core/utils/error_handler.dart';
import '../../../shared/utils/file_duplicate_check.dart';
import '../../../shared/utils/toast_helper.dart';

class CreateCaseProvider with ChangeNotifier {
  final CaseService _caseService;
  final DataService _dataService;
  
  List<Client> _clients = [];
  List<Site> _sites = [];
  List<Contact> _contacts = [];
  bool _isLoading = false;
  Map<String, String> _errors = {};
  
  // Form data
  String _clientId = '';
  String _siteId = '';
  String _contactId = '';
  String _description = '';
  String _caseType = '';
  String _priority = '';
  List<String> _filePaths = [];
  Set<String> _processedFiles = {}; // Track processed files to prevent duplicates
  
  CreateCaseProvider(this._caseService, this._dataService) {
    _loadClients();
  }
  
  List<Client> get clients => _clients;
  List<Site> get sites => _sites;
  List<Contact> get contacts => _contacts;
  bool get isLoading => _isLoading;
  Map<String, String> get errors => _errors;
  
  String get clientId => _clientId;
  String get siteId => _siteId;
  String get contactId => _contactId;
  String get description => _description;
  String get caseType => _caseType;
  String get priority => _priority;
  List<String> get filePaths => _filePaths;
  
  bool get isFormValid {
    return _clientId.isNotEmpty &&
        _siteId.isNotEmpty &&
        _contactId.isNotEmpty &&
        _caseType.isNotEmpty &&
        _priority.isNotEmpty;
  }
  
  Future<void> _loadClients() async {
    try {
      _clients = await _dataService.getClients();
      notifyListeners();
    } catch (e) {
      // Handle error
    }
  }
  
  void setClientId(String clientId) {
    _clientId = clientId;
    _siteId = '';
    _contactId = '';
    _sites = [];
    _contacts = [];
    _errors.remove('client_id');
    _errors.remove('site_id');
    _errors.remove('contact_id');
    notifyListeners();
    
    if (clientId.isNotEmpty) {
      _loadSites(int.parse(clientId));
    }
  }
  
  Future<void> _loadSites(int clientId) async {
    try {
      _sites = await _dataService.getSites(clientId);
      notifyListeners();
    } catch (e) {
      // Handle error
    }
  }
  
  void setSiteId(String siteId) {
    _siteId = siteId;
    _contactId = '';
    _contacts = [];
    _errors.remove('site_id');
    _errors.remove('contact_id');
    notifyListeners();
    
    if (siteId.isNotEmpty) {
      _loadContacts(int.parse(siteId));
    }
  }
  
  Future<void> _loadContacts(int siteId) async {
    try {
      _contacts = await _dataService.getContacts(siteId);
      _errors.remove('contact_id');
      notifyListeners();
    } catch (e) {
      _contacts = [];
      final errorMessage = e is AppError ? e.message : 'Failed to load contacts';
      _errors['contact_id'] = errorMessage;
      notifyListeners();
    }
  }
  
  void setContactId(String contactId) {
    _contactId = contactId;
    _errors.remove('contact_id');
    notifyListeners();
  }
  
  void setDescription(String description) {
    _description = description;
    _errors.remove('description');
    notifyListeners();
  }
  
  void setCaseType(String caseType) {
    _caseType = caseType;
    _errors.remove('case_type');
    notifyListeners();
  }
  
  void setPriority(String priority) {
    _priority = priority;
    _errors.remove('priority');
    notifyListeners();
  }
  
  void addFile(String filePath, BuildContext context) {
    addFiles([filePath], context);
  }
  
  void addFiles(List<String> filePaths, BuildContext context) {
    print('🟢 [DUPLICATE UPLOAD] addFiles called with ${filePaths.length} files');
    print('   Current _filePaths count: ${_filePaths.length}');
    print('   Current _processedFiles count: ${_processedFiles.length}');
    
    for (final path in filePaths) {
      final fileName = path.split('/').last;
      print('   File: $fileName');
    }
    
    // Use filterDuplicateFiles utility first (like frontend does)
    // It checks against _processedFiles and shows error message
    final uniqueFiles = filterDuplicateFiles(
      filePaths,
      _processedFiles,
      context,
    );
    
    print('🟢 [DUPLICATE UPLOAD] After filterDuplicateFiles:');
    print('   Unique files count: ${uniqueFiles.length}');
    print('   _processedFiles count after: ${_processedFiles.length}');
    
    if (uniqueFiles.isEmpty) {
      print('❌ [DUPLICATE UPLOAD] All files were duplicates');
      // All files were duplicates, already showed error toast
      return;
    }
    
    // Add unique files
    _filePaths.addAll(uniqueFiles);
    print('✅ [DUPLICATE UPLOAD] Added ${uniqueFiles.length} unique files');
    print('   Total _filePaths count: ${_filePaths.length}');
    notifyListeners();
    
    // Show success toast
    final count = uniqueFiles.length;
    final message = count == 1 
        ? 'File uploaded successfully' 
        : '$count files uploaded successfully';
    ToastHelper.showSuccess(context, message);
  }
  
  void removeFile(int index) {
    if (index < 0 || index >= _filePaths.length) return;
    
    final filePath = _filePaths[index];
    
    // Remove from processed files set to allow re-upload
    try {
      final file = File(filePath);
      if (file.existsSync()) {
        final stat = file.statSync();
        final fileName = filePath.split('/').last;
        final fileKey = '$fileName-${stat.size}-${stat.modified.millisecondsSinceEpoch}';
        _processedFiles.remove(fileKey);
      }
    } catch (e) {
      // If we can't get file info, try to remove by filename only
      final fileName = filePath.split('/').last;
      _processedFiles.removeWhere((key) => key.startsWith('$fileName-'));
    }
    
    _filePaths.removeAt(index);
    notifyListeners();
  }
  
  Future<bool> submit(BuildContext context) async {
    // Validation
    _errors = {};
    if (_clientId.isEmpty) _errors['client_id'] = 'is required';
    if (_siteId.isEmpty) _errors['site_id'] = 'is required';
    if (_contactId.isEmpty) _errors['contact_id'] = 'is required';
    if (_caseType.isEmpty) _errors['case_type'] = 'is required';
    if (_priority.isEmpty) _errors['priority'] = 'is required';
    
    if (_errors.isNotEmpty) {
      notifyListeners();
      return false;
    }
    
    _isLoading = true;
    notifyListeners();
    
    try {
      final caseData = await _caseService.createCase({
        'client_id': int.parse(_clientId),
        'site_id': int.parse(_siteId),
        'contact_id': int.parse(_contactId),
        'description': _description,
        'case_type': _caseType,
        'priority': _priority,
      });
      
      // Upload attachments if any
      if (_filePaths.isNotEmpty) {
        try {
          await _caseService.uploadAttachments(
            caseData.id,
            1,
            _filePaths,
            attachmentType: 'case_creation',
          );
        } catch (uploadError) {
          // If attachment upload fails, show error but don't fail the entire operation
          // The case was created successfully, attachments just failed
          _isLoading = false;
          notifyListeners();
          
          String errorMessage = 'Failed to upload attachments.';
          if (uploadError is AppError) {
            errorMessage = uploadError.message;
          } else if (uploadError is DioException && uploadError.response != null) {
            final data = uploadError.response!.data;
            if (data is Map<String, dynamic>) {
              errorMessage = data['error'] ?? data['message'] ?? errorMessage;
            }
          }
          
          ToastHelper.showError(context, 'Case created successfully, but $errorMessage');
          
          // Clear files and processed files
          _filePaths.clear();
          _processedFiles.clear();
          
          return true; // Still return success since case was created
        }
      }
      
      // Clear files and processed files on success
      _filePaths.clear();
      _processedFiles.clear();
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      
      if (e is AppError) {
        // Handle validation errors from API
        if (e.statusCode == 422) {
          // Parse validation errors - AppError already extracts the first error message
          // Set it as a general error for now (backend should return field-specific errors)
          _errors = {'general': e.message};
          // Don't show toast for validation errors - they're shown in the form
          notifyListeners();
          return false;
        }
      }
      
      // Check if it's a DioException to parse validation errors properly
      if (e is DioException && e.response != null && e.response!.statusCode == 422) {
        try {
          final data = e.response!.data;
          if (data is Map<String, dynamic> && data.containsKey('errors')) {
            final errors = data['errors'] as Map<String, dynamic>;
            // Normalize errors: join arrays into strings, similar to frontend
            _errors = errors.map((key, value) {
              if (value is List) {
                return MapEntry(key, value.join(' '));
              } else {
                return MapEntry(key, value.toString());
              }
            });
            // Don't show toast for validation errors - they're shown in the form
            notifyListeners();
            return false;
          }
        } catch (parseError) {
          // If parsing fails, fall through to show general error toast
        }
      }
      
      // Show error toast for unknown errors
      ToastHelper.showError(context, 'Failed to create case. Please try again.');
      _errors = {};
      notifyListeners();
      return false;
    }
  }
}

