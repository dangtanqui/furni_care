import 'package:dio/dio.dart';

class AppError {
  final String message;
  final int? statusCode;
  final String? category;
  
  AppError({
    required this.message,
    this.statusCode,
    this.category,
  });
  
  static AppError fromDioError(DioException error) {
    if (error.response != null) {
      // Server responded with error
      final statusCode = error.response!.statusCode;
      final data = error.response!.data;
      
      String message = 'An error occurred';
      
      if (data is Map<String, dynamic>) {
        if (data.containsKey('message')) {
          message = data['message'] as String;
        } else if (data.containsKey('error')) {
          message = data['error'] as String;
        } else if (data.containsKey('errors')) {
          // Handle validation errors
          final errors = data['errors'] as Map<String, dynamic>;
          final firstError = errors.values.first;
          if (firstError is List && firstError.isNotEmpty) {
            message = firstError.first as String;
          } else if (firstError is String) {
            message = firstError;
          }
        }
      }
      
      String? category;
      if (statusCode == 401) {
        category = 'authentication';
      } else if (statusCode == 403) {
        category = 'authorization';
      } else if (statusCode == 422) {
        category = 'validation';
      } else if (statusCode == 429) {
        category = 'rate_limit';
      }
      
      return AppError(
        message: message,
        statusCode: statusCode,
        category: category,
      );
    } else if (error.type == DioExceptionType.connectionTimeout ||
               error.type == DioExceptionType.receiveTimeout) {
      return AppError(
        message: 'Connection timeout. Please check your internet connection.',
        category: 'network',
      );
    } else if (error.type == DioExceptionType.connectionError) {
      return AppError(
        message: 'Unable to connect to server. Please check your internet connection.',
        category: 'network',
      );
    } else {
      return AppError(
        message: error.message ?? 'An unexpected error occurred',
        category: 'unknown',
      );
    }
  }
  
  static AppError fromException(Exception exception) {
    if (exception is DioException) {
      return fromDioError(exception);
    }
    
    // Handle TypeError and other runtime errors
    final message = exception.toString();
    String cleanMessage = message;
    
    // Extract meaningful error message
    if (message.contains('_TypeError')) {
      cleanMessage = 'Data format error. Please try again.';
    } else if (message.contains('type') && message.contains('is not a subtype')) {
      cleanMessage = 'Data format error. Please try again.';
    } else {
      // Remove "Exception: " prefix if present
      cleanMessage = message.replaceFirst(RegExp(r'^.*Exception:\s*'), '');
    }
    
    return AppError(
      message: cleanMessage,
      category: 'unknown',
    );
  }
}

