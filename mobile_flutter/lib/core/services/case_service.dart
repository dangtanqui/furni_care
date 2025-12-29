import 'package:dio/dio.dart';
import '../api/api_client.dart';
import '../api/endpoints.dart';
import '../api/models/case_models.dart';
import '../utils/error_handler.dart';

class CaseService {
  final ApiClient _apiClient;
  
  CaseService(this._apiClient);
  
  Future<CasesResponse> getCases({
    int? page,
    int? perPage,
    List<Map<String, String>>? sorts,
    String? status,
    String? caseType,
    String? assignedTo,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      
      if (page != null) queryParams['page'] = page;
      if (perPage != null) queryParams['per_page'] = perPage;
      if (status != null && status.isNotEmpty) queryParams['status'] = status;
      if (caseType != null && caseType.isNotEmpty) queryParams['case_type'] = caseType;
      if (assignedTo != null && assignedTo.isNotEmpty) queryParams['assigned_to'] = assignedTo;
      
      // Handle sorts
      if (sorts != null && sorts.isNotEmpty) {
        final sortStrings = sorts.map((s) => '${s['column']}:${s['direction']}').toList();
        queryParams['sorts'] = sortStrings.join(',');
      }
      
      final response = await _apiClient.get<Map<String, dynamic>>(
        ApiEndpoints.cases,
        queryParameters: queryParams,
      );
      
      return CasesResponse.fromJson(response.data!);
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
  
  Future<CaseDetail> getCase(int id) async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        ApiEndpoints.caseById(id),
      );
      
      return CaseDetail.fromJson(response.data!);
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
  
  Future<CaseDetail> createCase(Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.post<dynamic>(
        ApiEndpoints.cases,
        data: data,
      );
      
      if (response.data == null) {
        throw Exception('Response data is null');
      }
      
      if (response.data is! Map<String, dynamic>) {
        throw Exception('Expected Map but got ${response.data.runtimeType}');
      }
      
      return CaseDetail.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      if (e is AppError) {
        rethrow;
      }
      throw AppError.fromException(e is Exception ? e : Exception(e.toString()));
    }
  }
  
  Future<CaseDetail> updateCase(int id, Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.patch<Map<String, dynamic>>(
        ApiEndpoints.caseById(id),
        data: data,
      );
      
      return CaseDetail.fromJson(response.data!);
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
  
  Future<CaseDetail> advanceStage(int id) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiEndpoints.caseAdvanceStage(id),
      );
      
      return CaseDetail.fromJson(response.data!);
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
  
  Future<CaseDetail> approveCost(int id) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiEndpoints.caseApproveCost(id),
      );
      
      return CaseDetail.fromJson(response.data!);
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
  
  Future<CaseDetail> rejectCost(int id) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiEndpoints.caseRejectCost(id),
      );
      
      return CaseDetail.fromJson(response.data!);
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
  
  Future<CaseDetail> approveFinalCost(int id) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiEndpoints.caseApproveFinalCost(id),
      );
      
      return CaseDetail.fromJson(response.data!);
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
  
  Future<CaseDetail> rejectFinalCost(int id) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiEndpoints.caseRejectFinalCost(id),
      );
      
      return CaseDetail.fromJson(response.data!);
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
  
  Future<CaseDetail> redoCase(int id) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiEndpoints.caseRedo(id),
      );
      
      return CaseDetail.fromJson(response.data!);
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
  
  Future<CaseDetail> cancelCase(int id) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiEndpoints.caseCancel(id),
      );
      
      return CaseDetail.fromJson(response.data!);
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
  
  Future<void> uploadAttachments(
    int id,
    int stage,
    List<String> filePaths, {
    String? attachmentType,
  }) async {
    try {
      final formData = FormData();
      formData.fields.add(MapEntry('stage', stage.toString()));
      if (attachmentType != null) {
        formData.fields.add(MapEntry('attachment_type', attachmentType));
      }
      
      for (final filePath in filePaths) {
        formData.files.add(MapEntry(
          'files[]',
          await MultipartFile.fromFile(filePath),
        ));
      }
      
      await _apiClient.postFormData(
        ApiEndpoints.caseAttachments(id),
        formData: formData,
      );
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
  
  Future<void> deleteAttachment(int caseId, int attachmentId) async {
    try {
      await _apiClient.delete(
        ApiEndpoints.caseAttachment(caseId, attachmentId),
      );
    } catch (e) {
      throw AppError.fromException(e as Exception);
    }
  }
}

