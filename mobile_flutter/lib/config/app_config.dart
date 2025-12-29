import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static String get apiBaseUrl {
    String baseUrl = dotenv.env['API_BASE_URL'] ?? 'https://furni-care.onrender.com/api';
    // Ensure base URL ends with /api
    if (!baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.endsWith('/') ? '${baseUrl}api' : '$baseUrl/api';
    }
    return baseUrl;
  }

  static Future<void> load() async {
    // Load environment file based on flavor or default to development
    const String env = String.fromEnvironment('ENV', defaultValue: 'development');
    await dotenv.load(fileName: '.env.$env');
  }
}

