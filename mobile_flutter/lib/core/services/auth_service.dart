import '../api/api_client.dart';
import '../api/endpoints.dart';
import '../api/models/auth_models.dart';
import '../utils/error_handler.dart';

class AuthService {
  final ApiClient _apiClient;
  
  AuthService(this._apiClient);
  
  Future<LoginResponse> login(String email, String password, bool rememberMe) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiEndpoints.login,
        data: LoginRequest(
          email: email,
          password: password,
          rememberMe: rememberMe,
        ).toJson(),
      );
      
      return LoginResponse.fromJson(response.data!);
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
  
  Future<GetMeResponse> getMe() async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        ApiEndpoints.getMe,
      );
      
      return GetMeResponse.fromJson(response.data!);
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
}

