import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/case_service.dart';
import '../../../core/services/data_service.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/button.dart';
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
        title: const Text('Case List'),
        backgroundColor: const Color(0xFF1e3a5f),
        foregroundColor: Colors.white,
        actions: [
          Consumer<AuthProvider>(
            builder: (context, authProvider, _) {
              if (authProvider.isCS) {
                return IconButton(
                  icon: const Icon(Icons.add),
                  onPressed: () {
                    context.go('/cases/new');
                  },
                  tooltip: 'Create Case',
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
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

