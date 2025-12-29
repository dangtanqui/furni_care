import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/app_config.dart';
import 'config/routes.dart';
import 'core/api/api_client.dart';
import 'core/services/auth_service.dart';
import 'core/services/case_service.dart';
import 'core/services/data_service.dart';
import 'features/auth/providers/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load environment configuration
  await AppConfig.load();
  
  // Initialize services
  final apiClient = ApiClient();
  final authService = AuthService(apiClient);
  final caseService = CaseService(apiClient);
  final dataService = DataService(apiClient);
  
  // Initialize auth provider
  final authProvider = AuthProvider(authService);
  await authProvider.initialize();
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authProvider),
        Provider.value(value: caseService),
        Provider.value(value: dataService),
      ],
      child: const FurniCareApp(),
    ),
  );
}

class FurniCareApp extends StatelessWidget {
  const FurniCareApp({super.key});
  
  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    
    return MaterialApp.router(
      title: 'FurniCare',
      theme: ThemeData(
        primaryColor: const Color(0xFF0d9488),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0d9488),
        ),
        useMaterial3: true,
      ),
      routerConfig: AppRoutes.createRouter(authProvider),
    );
  }
}

