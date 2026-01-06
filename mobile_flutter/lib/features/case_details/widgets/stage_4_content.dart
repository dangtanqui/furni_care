import 'package:flutter/material.dart';
import '../../../core/api/models/case_models.dart';
import 'stage_helpers.dart';

class Stage4Content extends StatelessWidget {
  final CaseDetail caseData;
  
  const Stage4Content({
    super.key,
    required this.caseData,
  });
  
  @override
  Widget build(BuildContext context) {
    // Try both '4' and 'execution' keys for stage 4 attachments
    final stage4Attachments = caseData.stageAttachments?['4'] ?? 
                             caseData.stageAttachments?['execution'] ?? [];
    
    // Parse checklist from JSON string
    List<bool> checklist = [];
    if (caseData.executionChecklist != null && caseData.executionChecklist!.isNotEmpty) {
      try {
        final parsed = caseData.executionChecklist!.startsWith('[')
            ? caseData.executionChecklist!
            : '[$caseData.executionChecklist]';
        final list = parsed.replaceAll('[', '').replaceAll(']', '').split(',');
        checklist = list.map((e) => e.trim().toLowerCase() == 'true').toList();
      } catch (e) {
        checklist = [];
      }
    }
    final checklistItems = ['Work completed as planned', 'Client satisfied with work'];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Execution Report
        StageHelpers.buildInfoRow('Execution Report', caseData.executionReport ?? 'No report yet'),
        const SizedBox(height: 16),
        
        // Photos / Attachments
        StageHelpers.buildAttachmentsGrid(context, stage4Attachments),
        const SizedBox(height: 16),
        
        // Checklist
        StageHelpers.buildChecklist(checklistItems, checklist),
        const SizedBox(height: 16),
        
        // Client Signature
        if (caseData.clientSignature != null) ...[
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Client Signature',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 8),
              Image.network(
                caseData.clientSignature!,
                height: 100,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) {
                  return const Text('Signature image unavailable');
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
        
        // Client Feedback
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
                  caseData.clientRating != null ? '${caseData.clientRating}/5' : '-',
                  style: TextStyle(
                    color: Colors.grey.shade700,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
            if (caseData.clientFeedback != null) ...[
              const SizedBox(height: 8),
              StageHelpers.buildInfoRow('Feedback', caseData.clientFeedback!),
            ],
          ],
        ),
      ],
    );
  }
}

