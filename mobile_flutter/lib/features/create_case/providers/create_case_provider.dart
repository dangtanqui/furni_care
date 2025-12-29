import 'package:flutter/foundation.dart';
import '../../../core/api/models/data_models.dart';
import '../../../core/services/case_service.dart';
import '../../../core/services/data_service.dart';
import '../../../core/api/models/case_models.dart';

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
      notifyListeners();
    } catch (e) {
      // Handle error
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
  
  void addFile(String filePath) {
    _filePaths.add(filePath);
    notifyListeners();
  }
  
  void removeFile(int index) {
    _filePaths.removeAt(index);
    notifyListeners();
  }
  
  Future<bool> submit() async {
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
        await _caseService.uploadAttachments(
          caseData.id,
          1,
          _filePaths,
          attachmentType: 'case_creation',
        );
      }
      
      _isLoading = false;
      return true;
    } catch (e) {
      _isLoading = false;
      if (e.toString().contains('errors')) {
        // Parse validation errors
        // Simplified error handling
      }
      notifyListeners();
      return false;
    }
  }
}

