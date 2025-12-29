import 'package:flutter/material.dart';
import '../../../core/api/models/case_models.dart';

class CaseHeader extends StatelessWidget {
  final CaseDetail caseData;
  
  const CaseHeader({
    super.key,
    required this.caseData,
  });
  
  String _formatStatus(CaseStatus status) {
    return status.toString().split('.').last.split(RegExp(r'(?=[A-Z])')).join(' ');
  }
  
  Color _getStatusColor(CaseStatus status) {
    switch (status) {
      case CaseStatus.open:
        return Colors.blue.shade700;
      case CaseStatus.inProgress:
      case CaseStatus.pending:
        return Colors.yellow.shade700;
      case CaseStatus.completed:
      case CaseStatus.closed:
        return Colors.green.shade700;
      case CaseStatus.cancelled:
        return Colors.grey.shade700;
      case CaseStatus.rejected:
        return Colors.red.shade700;
    }
  }
  
  Color _getPriorityColor(CasePriority priority) {
    switch (priority) {
      case CasePriority.low:
        return Colors.grey.shade600;
      case CasePriority.medium:
        return Colors.yellow.shade600;
      case CasePriority.high:
        return Colors.red.shade600;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Case number
            Row(
              children: [
                const Text(
                  'Case ID: ',
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    color: Colors.grey,
                  ),
                ),
                Text(
                  caseData.caseNumber,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            
            // Client
            Row(
              children: [
                const Text(
                  'Client: ',
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    color: Colors.grey,
                  ),
                ),
                Text(caseData.client.name),
              ],
            ),
            const SizedBox(height: 12),
            
            // Current stage
            Row(
              children: [
                const Text(
                  'Current Stage: ',
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    color: Colors.grey,
                  ),
                ),
                Text('${caseData.currentStage} - ${caseData.stageName}'),
                if (caseData.attemptNumber > 1)
                  Container(
                    margin: const EdgeInsets.only(left: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade100,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'Attempt #${caseData.attemptNumber}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.orange.shade700,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            
            // Status and Priority
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _getStatusColor(caseData.status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    _formatStatus(caseData.status),
                    style: TextStyle(
                      color: _getStatusColor(caseData.status),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  'Priority: ${caseData.priority.toString().split('.').last}',
                  style: TextStyle(
                    color: _getPriorityColor(caseData.priority),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // Stage progress indicator
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(5, (index) {
                final stageNum = index + 1;
                final isCompleted = stageNum < caseData.currentStage;
                final isCurrent = stageNum == caseData.currentStage && 
                    caseData.status != CaseStatus.closed;
                
                return Column(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isCompleted
                            ? Colors.green
                            : isCurrent
                                ? Colors.blue
                                : Colors.grey.shade300,
                      ),
                      child: Center(
                        child: isCompleted
                            ? const Icon(Icons.check, color: Colors.white, size: 20)
                            : Text(
                                '$stageNum',
                                style: TextStyle(
                                  color: isCurrent ? Colors.white : Colors.grey.shade600,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                    if (index < 4)
                      Container(
                        width: 40,
                        height: 2,
                        color: isCompleted ? Colors.green : Colors.grey.shade300,
                      ),
                  ],
                );
              }),
            ),
          ],
        ),
      ),
    );
  }
}

