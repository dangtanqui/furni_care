import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/case_service.dart';
import '../../../shared/widgets/empty_state.dart';
import '../providers/case_details_provider.dart';
import '../widgets/case_header.dart';
import '../widgets/stage_sections.dart';

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
        backgroundColor: const Color(0xFF0d9488),
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
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
                  
                  // Stage sections with accordion
                  StageSections(caseData: provider.caseData!),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

