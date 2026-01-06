import 'package:flutter/material.dart';
import '../../../core/api/models/case_models.dart';
import 'stage_helpers.dart';

class Stage3Content extends StatelessWidget {
  final CaseDetail caseData;
  
  const Stage3Content({
    super.key,
    required this.caseData,
  });
  
  @override
  Widget build(BuildContext context) {
    // Try both '3' and 'solution' keys for stage 3 attachments
    final stage3Attachments = caseData.stageAttachments?['3'] ?? 
                             caseData.stageAttachments?['solution'] ?? [];
    // Filter out cost attachments (they have attachment_type='cost')
    final solutionAttachments = stage3Attachments.where((att) => 
      att.attachmentType != 'cost'
    ).toList();
    final costAttachments = stage3Attachments.where((att) => 
      att.attachmentType == 'cost'
    ).toList();
    
    // Parse checklist from JSON string
    List<bool> checklist = [];
    if (caseData.solutionChecklist != null && caseData.solutionChecklist!.isNotEmpty) {
      try {
        final parsed = caseData.solutionChecklist!.startsWith('[')
            ? caseData.solutionChecklist!
            : '[$caseData.solutionChecklist]';
        final list = parsed.replaceAll('[', '').replaceAll(']', '').split(',');
        checklist = list.map((e) => e.trim().toLowerCase() == 'true').toList();
      } catch (e) {
        checklist = [];
      }
    }
    final checklistItems = ['Identify root cause', 'Propose solution', 'Estimate timeline'];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Root Cause
        StageHelpers.buildInfoRow('Root Cause', caseData.rootCause ?? 'No root cause documented'),
        const SizedBox(height: 16),
        
        // Solution Description
        StageHelpers.buildInfoRow('Solution Description', caseData.solutionDescription ?? 'No solution documented'),
        const SizedBox(height: 16),
        
        // Photos / Attachments
        StageHelpers.buildAttachmentsGrid(context, solutionAttachments),
        const SizedBox(height: 16),
        
        // Checklist
        StageHelpers.buildChecklist(checklistItems, checklist),
        if (caseData.plannedExecutionDate != null) ...[
          const SizedBox(height: 16),
          StageHelpers.buildInfoRow('Planned Execution Date', caseData.plannedExecutionDate!),
        ],
        
        // Cost Section
        if (caseData.costRequired == true) ...[
          const SizedBox(height: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Checkbox(
                    value: true,
                    onChanged: null,
                    fillColor: MaterialStateProperty.resolveWith<Color>(
                      (Set<MaterialState> states) {
                        if (states.contains(MaterialState.selected)) {
                          return const Color(0xFF0d9488);
                        }
                        return Colors.white;
                      },
                    ),
                    side: const BorderSide(
                      color: Color(0xFF0d9488),
                      width: 2,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Cost Required',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
                          caseData.costStatus != null
                              ? caseData.costStatus.toString().split('.').last
                              : 'Pending',
                          style: TextStyle(
                            color: caseData.costStatus?.toString().contains('approved') == true
                                ? Colors.green.shade700
                                : caseData.costStatus?.toString().contains('rejected') == true
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
              if (caseData.costDescription != null) ...[
                const SizedBox(height: 16),
                StageHelpers.buildInfoRow('Cost Description', caseData.costDescription!),
              ],
              if (costAttachments.isNotEmpty) ...[
                const SizedBox(height: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Attachments',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    StageHelpers.buildAttachmentsGrid(context, costAttachments),
                  ],
                ),
              ],
            ],
          ),
        ],
      ],
    );
  }
}

