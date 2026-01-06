import 'package:go_router/go_router.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/case_list/screens/case_list_screen.dart';
import '../features/create_case/screens/create_case_screen.dart';
import '../features/case_details/screens/case_details_screen.dart';
import '../features/auth/providers/auth_provider.dart';

class AppRoutes {
  static const String login = '/login';
  static const String caseList = '/';
  static const String createCase = '/cases/new';
  static const String caseDetails = '/cases/:id';
  
  static GoRouter createRouter(AuthProvider authProvider) {
    return GoRouter(
      initialLocation: caseList,
      redirect: (context, state) {
        final isAuthenticated = authProvider.isAuthenticated;
        final isLoginRoute = state.matchedLocation == login;
        
        if (!isAuthenticated && !isLoginRoute) {
          return login;
        }
        
        if (isAuthenticated && isLoginRoute) {
          return caseList;
        }
        
        return null;
      },
      errorBuilder: (context, state) {
        return authProvider.isAuthenticated
            ? const CaseListScreen()
            : const LoginScreen();
      },
      routes: [
        GoRoute(
          path: login,
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: caseList,
          builder: (context, state) => const CaseListScreen(),
        ),
        GoRoute(
          path: createCase,
          builder: (context, state) => const CreateCaseScreen(),
        ),
        GoRoute(
          path: caseDetails,
          builder: (context, state) {
            final id = int.parse(state.pathParameters['id']!);
            return CaseDetailsScreen(caseId: id);
          },
        ),
      ],
    );
  }
}

