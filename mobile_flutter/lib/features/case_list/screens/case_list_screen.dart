import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/case_service.dart';
import '../../../core/services/data_service.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../providers/case_list_provider.dart';
import '../widgets/case_table.dart';
import '../widgets/case_filters.dart';

class CaseListScreen extends StatelessWidget {
  const CaseListScreen({super.key});
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0d9488),
        foregroundColor: Colors.white,
        flexibleSpace: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              children: [
                // Logo/App Name
                const Text(
                  'FurniCare',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                // User info and logout
                Consumer<AuthProvider>(
                  builder: (context, authProvider, _) {
                    if (authProvider.user != null) {
                      return Row(
                        children: [
                          // User name
                          Text(
                            authProvider.user!.name,
                            style: const TextStyle(fontSize: 14),
                          ),
                          const SizedBox(width: 12),
                          // Logout button
                          IconButton(
                            icon: const Icon(Icons.logout, size: 20),
                            onPressed: () async {
                              await authProvider.logout();
                              if (context.mounted) {
                                context.go('/login');
                              }
                            },
                            tooltip: 'Logout',
                          ),
                          // Add case button (for CS only)
                          if (authProvider.isCS) ...[
                            const SizedBox(width: 8),
                            IconButton(
                              icon: const Icon(Icons.add, size: 20),
                              onPressed: () {
                                context.go('/cases/new');
                              },
                              tooltip: 'Create Case',
                            ),
                          ],
                        ],
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ],
            ),
          ),
        ),
      ),
      body: ChangeNotifierProvider(
        create: (context) {
          final caseService = Provider.of<CaseService>(context, listen: false);
          final dataService = Provider.of<DataService>(context, listen: false);
          return CaseListProvider(caseService, dataService);
        },
        child: Consumer<CaseListProvider>(
          builder: (context, provider, _) {
            return Column(
              children: [
                // Filters
                const CaseFilters(),
                
                // Error message
                if (provider.error != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    color: Colors.red.shade50,
                    child: Text(
                      provider.error!,
                      style: TextStyle(color: Colors.red.shade700),
                    ),
                  ),
                
                // Case table
                Expanded(
                  child: provider.isLoading && provider.cases.isEmpty
                      ? ListView.builder(
                          itemCount: 5,
                          itemBuilder: (context, index) => const Padding(
                            padding: EdgeInsets.all(8.0),
                            child: SkeletonLoader(height: 60),
                          ),
                        )
                      : provider.cases.isEmpty
                          ? const EmptyState(
                              icon: Icons.inbox,
                              title: 'No cases found',
                              description: 'Try adjusting your filters or create a new case to get started.',
                            )
                          : const CaseTable(),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

