import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/models/case_models.dart';
import '../providers/case_list_provider.dart';

class CaseTableNew extends StatelessWidget {
  const CaseTableNew({super.key});
  
  String _formatStatus(CaseStatus status) {
    final statusStr = status.toString().split('.').last;
    // Convert snake_case to Title Case
    final formatted = statusStr
        .split('_')
        .map((word) => word[0].toUpperCase() + word.substring(1).toLowerCase())
        .join(' ');
    // Fix "Inprogress" to "In progress"
    return formatted.replaceAll('Inprogress', 'In progress');
  }
  
  String _formatPriority(CasePriority priority) {
    final priorityStr = priority.toString().split('.').last;
    // Capitalize first letter
    return priorityStr[0].toUpperCase() + priorityStr.substring(1).toLowerCase();
  }
  
  IconData _getStatusIcon(CaseStatus status) {
    switch (status) {
      case CaseStatus.open:
      case CaseStatus.inProgress:
        return Icons.access_time;
      case CaseStatus.pending:
        return Icons.info_outline;
      case CaseStatus.completed:
      case CaseStatus.closed:
        return Icons.check_circle;
      case CaseStatus.cancelled:
        return Icons.cancel;
      case CaseStatus.rejected:
        return Icons.cancel_outlined;
    }
  }
  
  IconData _getPriorityIcon(CasePriority priority) {
    switch (priority) {
      case CasePriority.low:
        return Icons.trending_down;
      case CasePriority.medium:
        return Icons.warning_amber;
      case CasePriority.high:
        return Icons.trending_up;
    }
  }
  
  Color _getStatusColor(CaseStatus status) {
    switch (status) {
      case CaseStatus.open:
        return Colors.blue.shade800; // Darker for better readability
      case CaseStatus.inProgress:
      case CaseStatus.pending:
        return Colors.orange.shade800; // Darker yellow/orange
      case CaseStatus.completed:
      case CaseStatus.closed:
        return Colors.green.shade800; // Darker green
      case CaseStatus.cancelled:
        return Colors.grey.shade800; // Darker grey
      case CaseStatus.rejected:
        return Colors.red.shade800; // Darker red
    }
  }
  
  Color _getPriorityColor(CasePriority priority) {
    switch (priority) {
      case CasePriority.low:
        return Colors.grey.shade700; // Darker for better readability
      case CasePriority.medium:
        return Colors.orange.shade700; // Darker yellow/orange
      case CasePriority.high:
        return Colors.red.shade700; // Darker red
    }
  }
  
  Widget _buildSortIcon(String column, CaseListProvider provider) {
    final sort = provider.sorts.firstWhere(
      (s) => s['column'] == column,
      orElse: () => {},
    );
    
    if (sort.isEmpty) {
      return const Icon(Icons.unfold_more, size: 16, color: Colors.grey);
    }
    
    return Icon(
      sort['direction'] == 'asc' ? Icons.arrow_upward : Icons.arrow_downward,
      size: 16,
      color: const Color(0xFF0d9488),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<CaseListProvider>(context);
    
    // Calculate table height based on number of rows (48px per row + 56px header)
    final rowHeight = 48.0;
    final headerHeight = 56.0;
    final tableHeight = headerHeight + (provider.cases.length * rowHeight);
    final maxHeight = MediaQuery.of(context).size.height * 0.6;
    final actualHeight = tableHeight < maxHeight ? tableHeight : maxHeight;
    
    return Column(
      children: [
        // Table with horizontal scroll
        SizedBox(
          height: actualHeight,
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: SingleChildScrollView(
              child: DataTable(
                showCheckboxColumn: false,
                headingRowColor: MaterialStateProperty.all(Colors.grey.shade50),
                columns: [
                  DataColumn(
                    label: GestureDetector(
                      onTap: () => provider.handleSort('case_number'),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('Case ID', style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(width: 4),
                          _buildSortIcon('case_number', provider),
                        ],
                      ),
                    ),
                  ),
                  DataColumn(
                    label: GestureDetector(
                      onTap: () => provider.handleSort('client'),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('Client', style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(width: 4),
                          _buildSortIcon('client', provider),
                        ],
                      ),
                    ),
                  ),
                  DataColumn(
                    label: GestureDetector(
                      onTap: () => provider.handleSort('site'),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('Site', style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(width: 4),
                          _buildSortIcon('site', provider),
                        ],
                      ),
                    ),
                  ),
                  DataColumn(
                    label: GestureDetector(
                      onTap: () => provider.handleSort('current_stage'),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('Stage', style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(width: 4),
                          _buildSortIcon('current_stage', provider),
                        ],
                      ),
                    ),
                  ),
                  DataColumn(
                    label: GestureDetector(
                      onTap: () => provider.handleSort('status'),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('Status', style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(width: 4),
                          _buildSortIcon('status', provider),
                        ],
                      ),
                    ),
                  ),
                  DataColumn(
                    label: GestureDetector(
                      onTap: () => provider.handleSort('priority'),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('Priority', style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(width: 4),
                          _buildSortIcon('priority', provider),
                        ],
                      ),
                    ),
                  ),
                  DataColumn(
                    label: GestureDetector(
                      onTap: () => provider.handleSort('assigned_to'),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('Assigned', style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(width: 4),
                          _buildSortIcon('assigned_to', provider),
                        ],
                      ),
                    ),
                  ),
                  // Empty column for chevron icon
                  const DataColumn(label: SizedBox.shrink()),
                ],
                rows: provider.cases.map((caseItem) {
                  return DataRow(
                    onSelectChanged: (_) {
                      context.go('/cases/${caseItem.id}');
                    },
                    cells: [
                      DataCell(Text(caseItem.caseNumber)),
                      DataCell(Text(caseItem.client)),
                      DataCell(Text(caseItem.site)),
                      DataCell(
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              caseItem.currentStage < 5 ? Icons.access_time : Icons.check_circle,
                              size: 16,
                              color: caseItem.currentStage < 5 
                                  ? Colors.orange.shade500  // Yellow/orange for clock
                                  : Colors.green.shade500,  // Green for check
                            ),
                            const SizedBox(width: 4),
                            Text('Stage ${caseItem.currentStage}'),
                          ],
                        ),
                      ),
                      DataCell(
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _getStatusColor(caseItem.status).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                _getStatusIcon(caseItem.status),
                                size: 14,
                                color: _getStatusColor(caseItem.status),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                _formatStatus(caseItem.status),
                                style: TextStyle(
                                  color: _getStatusColor(caseItem.status),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600, // Bolder
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      DataCell(
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              _getPriorityIcon(caseItem.priority),
                              size: 14,
                              color: _getPriorityColor(caseItem.priority),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _formatPriority(caseItem.priority),
                              style: TextStyle(
                                color: _getPriorityColor(caseItem.priority),
                                fontSize: 12,
                                fontWeight: FontWeight.w600, // Bolder
                              ),
                            ),
                          ],
                        ),
                      ),
                      DataCell(Text(caseItem.assignedTo ?? '-')),
                      DataCell(
                        Padding(
                          padding: const EdgeInsets.only(left: 4.0),
                          child: Icon(
                            Icons.chevron_right,
                            size: 20,
                            color: Colors.grey.shade400,
                          ),
                        ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
        ),
        
        // Pagination info and controls
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border(top: BorderSide(color: Colors.grey.shade200)),
            color: Colors.grey.shade50,
          ),
          child: Column(
            children: [
              // Pagination info
              Text(
                'Showing ${(provider.currentPage - 1) * provider.perPage + 1} to ${provider.currentPage * provider.perPage < provider.total ? provider.currentPage * provider.perPage : provider.total} of ${provider.total} cases',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade700,
                ),
              ),
              const SizedBox(height: 12),
              // Pagination controls
              if (provider.totalPages > 1)
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Previous button
                    TextButton.icon(
                      onPressed: provider.currentPage > 1
                          ? () => provider.handlePageChange(provider.currentPage - 1)
                          : null,
                      icon: const Icon(Icons.chevron_left, size: 18),
                      label: const Text('Previous'),
                      style: TextButton.styleFrom(
                        foregroundColor: provider.currentPage > 1 
                            ? const Color(0xFF0d9488) 
                            : Colors.grey,
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        minimumSize: const Size(0, 32),
                      ),
                    ),
                    const SizedBox(width: 4),
                    // Page numbers
                    ...List.generate(
                      provider.totalPages <= 5 ? provider.totalPages : 5,
                      (index) {
                        int pageNum;
                        if (provider.totalPages <= 5) {
                          pageNum = index + 1;
                        } else if (provider.currentPage <= 3) {
                          pageNum = index + 1;
                        } else if (provider.currentPage >= provider.totalPages - 2) {
                          pageNum = provider.totalPages - 4 + index;
                        } else {
                          pageNum = provider.currentPage - 2 + index;
                        }
                        final isActive = provider.currentPage == pageNum;
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2),
                          child: TextButton(
                            onPressed: () => provider.handlePageChange(pageNum),
                            style: TextButton.styleFrom(
                              backgroundColor: isActive 
                                  ? const Color(0xFF0d9488) 
                                  : Colors.transparent,
                              foregroundColor: isActive 
                                  ? Colors.white 
                                  : const Color(0xFF0d9488),
                              minimumSize: const Size(32, 32),
                              padding: EdgeInsets.zero,
                              side: BorderSide(
                                color: isActive 
                                    ? const Color(0xFF0d9488) 
                                    : Colors.grey.shade300,
                                width: 1,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(6),
                              ),
                            ),
                            child: Text(
                              '$pageNum',
                              style: TextStyle(
                                fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(width: 4),
                    // Next button - icon on right side
                    TextButton(
                      onPressed: provider.currentPage < provider.totalPages
                          ? () => provider.handlePageChange(provider.currentPage + 1)
                          : null,
                      style: TextButton.styleFrom(
                        foregroundColor: provider.currentPage < provider.totalPages 
                            ? const Color(0xFF0d9488) 
                            : Colors.grey,
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        minimumSize: const Size(0, 32),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('Next'),
                          SizedBox(width: 4),
                          Icon(Icons.chevron_right, size: 18),
                        ],
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ],
    );
  }
}

