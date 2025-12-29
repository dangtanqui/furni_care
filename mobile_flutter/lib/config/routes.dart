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
        
        // If not authenticated and not on login page, redirect to login
        if (!isAuthenticated && !isLoginRoute) {
          return login;
        }
        
        // If authenticated and on login page, redirect to home
        if (isAuthenticated && isLoginRoute) {
          return caseList;
        }
        
        return null;
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
          path: '/cases/:id',
          builder: (context, state) {
            final id = int.parse(state.pathParameters['id']!);
            return CaseDetailsScreen(caseId: id);
          },
        ),
      ],
    );
  }
}

