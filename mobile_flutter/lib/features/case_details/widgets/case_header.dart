import 'package:flutter/material.dart';
import '../../../core/api/models/case_models.dart';

class CaseHeader extends StatelessWidget {
  final CaseDetail caseData;
  
  const CaseHeader({
    super.key,
    required this.caseData,
  });
  
  String _formatStatus(CaseStatus status) {
    final statusStr = status.toString().split('.').last.split(RegExp(r'(?=[A-Z])')).join(' ');
    // Capitalize first letter
    return statusStr.isEmpty ? statusStr : statusStr[0].toUpperCase() + statusStr.substring(1);
  }
  
  String _formatPriority(CasePriority priority) {
    final priorityStr = priority.toString().split('.').last;
    // Capitalize first letter
    return priorityStr.isEmpty ? priorityStr : priorityStr[0].toUpperCase() + priorityStr.substring(1);
  }
  
  Color _getStatusBackgroundColor(CaseStatus status) {
    switch (status) {
      case CaseStatus.open:
        return Colors.blue.shade100;
      case CaseStatus.inProgress:
      case CaseStatus.pending:
        return Colors.yellow.shade100;
      case CaseStatus.completed:
      case CaseStatus.closed:
        return Colors.green.shade100;
      case CaseStatus.cancelled:
        return Colors.grey.shade100;
      case CaseStatus.rejected:
        return Colors.red.shade100;
    }
  }
  
  Color _getStatusTextColor(CaseStatus status) {
    switch (status) {
      case CaseStatus.open:
        return Colors.blue.shade800; // Darker for better readability
      case CaseStatus.inProgress:
      case CaseStatus.pending:
        return Colors.yellow.shade800; // Darker for better readability
      case CaseStatus.completed:
      case CaseStatus.closed:
        return Colors.green.shade800; // Darker for better readability
      case CaseStatus.cancelled:
        return Colors.grey.shade800; // Darker for better readability
      case CaseStatus.rejected:
        return Colors.red.shade800; // Darker for better readability
    }
  }
  
  Color _getPriorityColor(CasePriority priority) {
    switch (priority) {
      case CasePriority.low:
        return Colors.grey.shade500; // text-gray-500
      case CasePriority.medium:
        return Colors.amber.shade700; // More readable than yellow-600
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
                    color: Colors.black, // Changed to black
                  ),
                ),
                Text(
                  caseData.caseNumber,
                  style: const TextStyle(
                    fontWeight: FontWeight.normal, // Not bold
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
                    color: Colors.black, // Changed to black
                  ),
                ),
                Text(caseData.client.name),
              ],
            ),
            const SizedBox(height: 12),
            
            // Current stage - wrap text
            Wrap(
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 4,
              runSpacing: 4,
              children: [
                const Text(
                  'Current Stage: ',
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    color: Colors.black,
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
            
            // Status
            Row(
              children: [
                const Text(
                  'Status: ',
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    color: Colors.black, // Changed to black
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _getStatusBackgroundColor(caseData.status),
                    borderRadius: BorderRadius.circular(999), // Fully rounded pill
                  ),
                  child: Text(
                    _formatStatus(caseData.status),
                    style: TextStyle(
                      color: _getStatusTextColor(caseData.status),
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            
            // Priority - separate row
            Row(
              children: [
                const Text(
                  'Priority: ',
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    color: Colors.black, // Changed to black
                  ),
                ),
                Text(
                  _formatPriority(caseData.priority),
                  style: TextStyle(
                    color: _getPriorityColor(caseData.priority),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // Stage progress indicator - wrap if not enough space
            Wrap(
              spacing: 4,
              runSpacing: 8,
              children: List.generate(5, (index) {
                final stageNum = index + 1;
                final isCompleted = stageNum < caseData.currentStage;
                final isCurrent = stageNum == caseData.currentStage && 
                    caseData.status != CaseStatus.closed;
                
                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isCompleted
                            ? Colors.green.shade500
                            : isCurrent
                                ? const Color(0xFF0d9488) // Teal color for current stage
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
                                  fontSize: 14,
                                ),
                              ),
                      ),
                    ),
                    if (index < 4)
                      Container(
                        margin: const EdgeInsets.only(left: 0),
                        width: 32,
                        height: 3,
                        decoration: BoxDecoration(
                          color: isCompleted ? Colors.green.shade500 : Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(1.5),
                        ),
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

