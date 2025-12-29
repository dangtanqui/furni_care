import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/models/case_models.dart';
import '../providers/case_list_provider.dart';

class CaseTable extends StatelessWidget {
  const CaseTable({super.key});
  
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
    final provider = Provider.of<CaseListProvider>(context);
    
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            itemCount: provider.cases.length,
            itemBuilder: (context, index) {
              final caseItem = provider.cases[index];
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: InkWell(
                  onTap: () {
                    context.go('/cases/${caseItem.id}');
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              caseItem.caseNumber,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            Icon(
                              Icons.chevron_right,
                              color: Colors.grey.shade400,
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text('Client: ${caseItem.client}'),
                        Text('Site: ${caseItem.site}'),
                        Text('Stage: ${caseItem.currentStage} - ${caseItem.stageName}'),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: _getStatusColor(caseItem.status).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                _formatStatus(caseItem.status),
                                style: TextStyle(
                                  color: _getStatusColor(caseItem.status),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Priority: ${caseItem.priority.toString().split('.').last}',
                              style: TextStyle(
                                color: _getPriorityColor(caseItem.priority),
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                        if (caseItem.assignedTo != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              'Assigned: ${caseItem.assignedTo}',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade600,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        
        // Pagination
        if (provider.totalPages > 1)
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: provider.currentPage > 1
                      ? () => provider.handlePageChange(provider.currentPage - 1)
                      : null,
                ),
                Text(
                  'Page ${provider.currentPage} of ${provider.totalPages}',
                  style: const TextStyle(fontSize: 14),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: provider.currentPage < provider.totalPages
                      ? () => provider.handlePageChange(provider.currentPage + 1)
                      : null,
                ),
              ],
            ),
          ),
      ],
    );
  }
}

