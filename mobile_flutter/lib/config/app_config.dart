import 'package:flutter_dotenv/flutter_dotenv';

class AppConfig {
  static String get apiBaseUrl {
    return dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000/api';
  }

  static Future<void> load() async {
    // Load environment file based on flavor or default to development
    const String env = String.fromEnvironment('ENV', defaultValue: 'development');
    await dotenv.load(fileName: '.env.$env');
  }
}

