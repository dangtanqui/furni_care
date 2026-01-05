import 'package:flutter/foundation.dart';
import '../../../core/api/models/case_models.dart';
import '../../../core/services/case_service.dart';

class CaseDetailsProvider with ChangeNotifier {
  final CaseService _caseService;
  final int _caseId;
  
  CaseDetail? _caseData;
  bool _isLoading = false;
  String? _error;
  
  CaseDetailsProvider(this._caseService, this._caseId) {
    _loadCase();
  }
  
  CaseDetail? get caseData => _caseData;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  Future<void> _loadCase() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      _caseData = await _caseService.getCase(_caseId);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      _caseData = null;
      notifyListeners();
    }
  }
  
  Future<void> refresh() async {
    await _loadCase();
  }
  
  Future<void> updateCase(Map<String, dynamic> data) async {
    try {
      _caseData = await _caseService.updateCase(_caseId, data);
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }
  
  Future<void> advanceStage() async {
    try {
      _caseData = await _caseService.advanceStage(_caseId);
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }
}

