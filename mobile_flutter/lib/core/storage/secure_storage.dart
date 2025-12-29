import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage();
  
  // Keys
  static const String _tokenKey = 'token';
  static const String _tokenExpirationKey = 'token_expiration';
  static const String _rememberedEmailKey = 'remembered_email';
  static const String _rememberMeKey = 'remember_me';
  
  // Token management
  static Future<void> saveToken(String token, int expirationTimestamp) async {
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _tokenExpirationKey, value: expirationTimestamp.toString());
  }
  
  static Future<String?> getToken() async {
    final token = await _storage.read(key: _tokenKey);
    final expiration = await _storage.read(key: _tokenExpirationKey);
    
    if (token == null || expiration == null) {
      return null;
    }
    
    // Check if token has expired
    final expirationTime = int.tryParse(expiration) ?? 0;
    if (DateTime.now().millisecondsSinceEpoch > expirationTime) {
      // Token expired, remove it
      await clearToken();
      return null;
    }
    
    return token;
  }
  
  static Future<void> clearToken() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _tokenExpirationKey);
  }
  
  // Remember me management
  static Future<void> saveRememberMe(String email, bool rememberMe) async {
    if (rememberMe) {
      await _storage.write(key: _rememberedEmailKey, value: email);
      await _storage.write(key: _rememberMeKey, value: 'true');
    } else {
      await _storage.delete(key: _rememberedEmailKey);
      await _storage.delete(key: _rememberMeKey);
    }
  }
  
  static Future<String?> getRememberedEmail() async {
    final rememberMe = await _storage.read(key: _rememberMeKey);
    if (rememberMe == 'true') {
      return await _storage.read(key: _rememberedEmailKey);
    }
    return null;
  }
  
  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}

