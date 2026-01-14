import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/case_service.dart';
import '../../../core/services/data_service.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/app_header.dart';
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
      appBar: const AppHeader(),
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
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Back button
                  Row(
                    children: [
                      GestureDetector(
                        onTap: () {
                          if (context.canPop()) {
                            context.pop();
                          } else {
                            context.go('/');
                          }
                        },
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.arrow_back,
                              size: 20,
                              color: Color(0xFF0d9488),
                            ),
                            SizedBox(width: 4),
                            Text(
                              'Back',
                              style: TextStyle(
                                fontSize: 16,
                                color: Color(0xFF0d9488),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Title
                  const Text(
                    'Case Details',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1e3a5f),
                    ),
                  ),
                  const SizedBox(height: 16),
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

