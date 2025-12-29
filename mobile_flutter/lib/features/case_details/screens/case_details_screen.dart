import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/models/case_models.dart';
import '../../../core/services/case_service.dart';
import '../../../shared/widgets/button.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../../shared/widgets/empty_state.dart';
import '../providers/case_details_provider.dart';
import '../widgets/case_header.dart';

class CaseDetailsScreen extends StatelessWidget {
  final int caseId;
  
  const CaseDetailsScreen({
    super.key,
    required this.caseId,
  });
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Case Details'),
        backgroundColor: const Color(0xFF1e3a5f),
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: ChangeNotifierProvider(
        create: (context) {
          final caseService = Provider.of<CaseService>(context, listen: false);
          return CaseDetailsProvider(caseService, caseId);
        },
        child: Consumer<CaseDetailsProvider>(
          builder: (context, provider, _) {
            if (provider.isLoading && provider.caseData == null) {
              return const Center(
                child: CircularProgressIndicator(),
              );
            }
            
            if (provider.caseData == null) {
              return const EmptyState(
                icon: Icons.error_outline,
                title: 'Case not found',
                description: 'The case you are looking for does not exist.',
              );
            }
            
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  CaseHeader(caseData: provider.caseData!),
                  const SizedBox(height: 16),
                  
                  // Stage sections would go here
                  // Simplified for now
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Stage ${provider.caseData!.currentStage}',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(provider.caseData!.stageName),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

