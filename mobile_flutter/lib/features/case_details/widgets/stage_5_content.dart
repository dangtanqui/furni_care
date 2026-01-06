import 'package:flutter/material.dart';
import '../../../core/api/models/case_models.dart';
import 'stage_helpers.dart';

class Stage5Content extends StatelessWidget {
  final CaseDetail caseData;
  
  const Stage5Content({
    super.key,
    required this.caseData,
  });
  
  @override
  Widget build(BuildContext context) {
    // Try both '5' and 'closing' keys for stage 5 attachments
    final stage5Attachments = caseData.stageAttachments?['5'] ?? 
                             caseData.stageAttachments?['closing'] ?? [];
    
    // Check if final cost section should be shown (cost was approved in Stage 3)
    final showFinalCostSection = caseData.costRequired == true && 
                                caseData.costStatus?.toString().contains('approved') == true;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // CS Notes
        StageHelpers.buildInfoRow('Note', caseData.csNotes ?? '-'),
        const SizedBox(height: 16),
        
        // Final Cost Section (only if cost was approved in Stage 3)
        if (showFinalCostSection) ...[
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Final Cost',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Final Cost',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          caseData.finalCost != null
                              ? '\$${caseData.finalCost!.toStringAsFixed(0)}'
                              : '-',
                          style: TextStyle(
                            color: Colors.grey.shade700,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Estimated Cost',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          caseData.estimatedCost != null
                              ? '\$${caseData.estimatedCost!.toStringAsFixed(0)}'
                              : '-',
                          style: TextStyle(
                            color: Colors.grey.shade700,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Status',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          caseData.finalCostStatus != null
                              ? caseData.finalCostStatus.toString().split('.').last
                              : caseData.finalCost != null && caseData.estimatedCost != null &&
                                caseData.finalCost == caseData.estimatedCost
                                  ? 'No approval needed'
                                  : 'Pending',
                          style: TextStyle(
                            color: caseData.finalCostStatus?.toString().contains('approved') == true
                                ? Colors.green.shade700
                                : caseData.finalCostStatus?.toString().contains('rejected') == true
                                    ? Colors.red.shade700
                                    : Colors.amber.shade700,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
        
        // Client Feedback Section
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Client Feedback',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Text(
                  'Rating: ',
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                  ),
                ),
                Text(
                  caseData.finalRating != null ? '${caseData.finalRating}/5' : '-',
                  style: TextStyle(
                    color: Colors.grey.shade700,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
            if (caseData.finalFeedback != null) ...[
              const SizedBox(height: 8),
              StageHelpers.buildInfoRow('Feedback', caseData.finalFeedback!),
            ],
          ],
        ),
        
        // Attachments
        if (stage5Attachments.isNotEmpty) ...[
          const SizedBox(height: 16),
          StageHelpers.buildAttachmentsGrid(context, stage5Attachments),
        ],
      ],
    );
  }
}

