import 'package:flutter/foundation.dart';
import '../../../core/api/models/auth_models.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/constants/roles.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService;
  
  User? _user;
  String? _token;
  bool _isLoading = false;
  
  AuthProvider(this._authService);
  
  Future<void> initialize() async {
    await _initialize();
  }
  
  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _token != null && _user != null;
  bool get isCS => _user?.role == Roles.cs;
  bool get isTechnician => _user?.role == Roles.technician;
  bool get isLeader => _user?.role == Roles.leader;
  
  Future<void> _initialize() async {
    final storedToken = await SecureStorage.getToken();
    if (storedToken != null) {
      _token = storedToken;
      await _loadUser();
    }
  }
  
  Future<void> _loadUser() async {
    try {
      final response = await _authService.getMe();
      _user = response.user;
      notifyListeners();
    } catch (e) {
      // Token is invalid, clear it
      await logout();
    }
  }
  
  Future<void> login(String email, String password, bool rememberMe) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final response = await _authService.login(email, password, rememberMe);
      
      // Calculate expiration time
      final expirationDays = rememberMe ? 30 : 1;
      final expirationTime = DateTime.now()
          .add(Duration(days: expirationDays))
          .millisecondsSinceEpoch;
      
      // Save token and expiration
      await SecureStorage.saveToken(response.token, expirationTime);
      
      // Save remember me settings
      await SecureStorage.saveRememberMe(email, rememberMe);
      
      _token = response.token;
      _user = response.user;
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }
  
  Future<void> logout() async {
    await SecureStorage.clearToken();
    _token = null;
    _user = null;
    notifyListeners();
  }
}

