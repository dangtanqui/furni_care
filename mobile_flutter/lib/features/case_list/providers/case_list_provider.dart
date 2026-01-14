import 'package:flutter/foundation.dart';
import '../../../core/api/models/case_models.dart';
import '../../../core/services/case_service.dart';
import '../../../core/services/data_service.dart';
import '../../../core/api/models/data_models.dart';

class CaseListProvider with ChangeNotifier {
  final CaseService _caseService;
  final DataService _dataService;
  bool _disposed = false;
  
  List<CaseListItem> _cases = [];
  List<Technician> _technicians = [];
  bool _isLoading = false;
  String? _error;
  
  // Filters
  String _statusFilter = '';
  String _caseTypeFilter = '';
  String _assignedToFilter = '';
  
  // Sorting
  List<Map<String, String>> _sorts = [];
  
  // Pagination
  int _currentPage = 1;
  int _perPage = 20;
  int _total = 0;
  int _totalPages = 0;
  
  CaseListProvider(this._caseService, this._dataService) {
    _loadTechnicians();
    _loadCases();
  }

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }

  void _safeNotify() {
    if (_disposed) return;
    notifyListeners();
  }
  
  List<CaseListItem> get cases => _cases;
  List<Technician> get technicians => _technicians;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get statusFilter => _statusFilter;
  String get caseTypeFilter => _caseTypeFilter;
  String get assignedToFilter => _assignedToFilter;
  List<Map<String, String>> get sorts => _sorts;
  int get currentPage => _currentPage;
  int get totalPages => _totalPages;
  int get total => _total;
  int get perPage => _perPage;
  
  Future<void> _loadTechnicians() async {
    try {
      _technicians = await _dataService.getTechnicians();
      _safeNotify();
    } catch (e) {
      // Silently fail - technicians are optional
    }
  }
  
  Future<void> _loadCases() async {
    if (_disposed) return;
    _isLoading = true;
    _error = null;
    _safeNotify();
    
    try {
      final response = await _caseService.getCases(
        page: _currentPage,
        perPage: _perPage,
        sorts: _sorts,
        status: _statusFilter.isEmpty ? null : _statusFilter,
        caseType: _caseTypeFilter.isEmpty ? null : _caseTypeFilter,
        assignedTo: _assignedToFilter.isEmpty ? null : _assignedToFilter,
      );
      
      _cases = response.data;
      _currentPage = response.pagination.page;
      _totalPages = response.pagination.totalPages;
      _total = response.pagination.total;
      
      _isLoading = false;
      _safeNotify();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      _safeNotify();
    }
  }
  
  void setStatusFilter(String status) {
    _statusFilter = status;
    _currentPage = 1;
    _loadCases();
  }
  
  void setCaseTypeFilter(String caseType) {
    _caseTypeFilter = caseType;
    _currentPage = 1;
    _loadCases();
  }
  
  void setAssignedToFilter(String assignedTo) {
    _assignedToFilter = assignedTo;
    _currentPage = 1;
    _loadCases();
  }
  
  void handleSort(String column) {
    final existingIndex = _sorts.indexWhere((s) => s['column'] == column);
    
    if (existingIndex != -1) {
      final existing = _sorts[existingIndex];
      if (existing['direction'] == 'asc') {
        // Change to desc
        _sorts[existingIndex] = {'column': column, 'direction': 'desc'};
      } else {
        // Remove from sort
        _sorts.removeAt(existingIndex);
      }
    } else {
      // Add new sort with asc
      _sorts.add({'column': column, 'direction': 'asc'});
    }
    
    _currentPage = 1;
    _loadCases();
  }
  
  void handlePageChange(int page) {
    _currentPage = page;
    _loadCases();
  }
  
  void refresh() {
    _loadCases();
  }
}

