import '../api/api_client.dart';
import '../api/endpoints.dart';
import '../api/models/data_models.dart';
import '../utils/error_handler.dart';

class DataService {
  final ApiClient _apiClient;
  
  DataService(this._apiClient);
  
  Future<List<Client>> getClients() async {
    try {
      final response = await _apiClient.get<List<dynamic>>(
        ApiEndpoints.clients,
      );
      
      return (response.data as List)
          .map((json) => Client.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
  
  Future<List<Site>> getSites(int clientId) async {
    try {
      final response = await _apiClient.get<List<dynamic>>(
        ApiEndpoints.clientSites(clientId),
      );
      
      return (response.data as List)
          .map((json) => Site.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
  
  Future<List<Contact>> getContacts(int siteId) async {
    try {
      final response = await _apiClient.get<List<dynamic>>(
        ApiEndpoints.siteContacts(siteId),
      );
      
      return (response.data as List)
          .map((json) => Contact.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
  
  Future<List<Technician>> getTechnicians() async {
    try {
      final response = await _apiClient.get<List<dynamic>>(
        ApiEndpoints.technicians,
      );
      
      return (response.data as List)
          .map((json) => Technician.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
}

