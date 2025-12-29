import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/case_list_provider.dart';

class CaseFilters extends StatefulWidget {
  const CaseFilters({super.key});
  
  @override
  State<CaseFilters> createState() => _CaseFiltersState();
}

class _CaseFiltersState extends State<CaseFilters> {
  bool _isExpanded = false;
  
  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<CaseListProvider>(context);
    
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade200),
        ),
      ),
      child: Column(
        children: [
          // Filter button header
          InkWell(
            onTap: () {
              setState(() {
                _isExpanded = !_isExpanded;
              });
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Icon(
                    Icons.filter_list,
                    color: Colors.grey.shade700,
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Filter',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const Spacer(),
                  Icon(
                    _isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: Colors.grey.shade700,
                  ),
                ],
              ),
            ),
          ),
          
          // Expanded filters
          if (_isExpanded)
            Container(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                children: [
                  // Status filter
                  DropdownButtonFormField<String>(
                    value: provider.statusFilter.isEmpty ? '' : provider.statusFilter,
                    decoration: const InputDecoration(
                      labelText: 'Status',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    items: [
                      const DropdownMenuItem(value: '', child: Text('All')),
                      const DropdownMenuItem(value: 'open', child: Text('Open')),
                      const DropdownMenuItem(value: 'in_progress', child: Text('In Progress')),
                      const DropdownMenuItem(value: 'pending', child: Text('Pending')),
                      const DropdownMenuItem(value: 'completed', child: Text('Completed')),
                      const DropdownMenuItem(value: 'closed', child: Text('Closed')),
                      const DropdownMenuItem(value: 'cancelled', child: Text('Cancelled')),
                      const DropdownMenuItem(value: 'rejected', child: Text('Rejected')),
                    ],
                    onChanged: (value) {
                      provider.setStatusFilter(value ?? '');
                    },
                  ),
                  const SizedBox(height: 12),
                  
                  // Case type filter
                  DropdownButtonFormField<String>(
                    value: provider.caseTypeFilter.isEmpty ? '' : provider.caseTypeFilter,
                    decoration: const InputDecoration(
                      labelText: 'Type',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    items: [
                      const DropdownMenuItem(value: '', child: Text('All')),
                      const DropdownMenuItem(value: 'warranty', child: Text('Warranty')),
                      const DropdownMenuItem(value: 'maintenance', child: Text('Maintenance')),
                      const DropdownMenuItem(value: 'repair', child: Text('Repair')),
                    ],
                    onChanged: (value) {
                      provider.setCaseTypeFilter(value ?? '');
                    },
                  ),
                  const SizedBox(height: 12),
                  
                  // Assigned to filter
                  DropdownButtonFormField<String>(
                    value: provider.assignedToFilter.isEmpty ? '' : provider.assignedToFilter,
                    decoration: const InputDecoration(
                      labelText: 'Assigned To',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    items: [
                      const DropdownMenuItem(value: '', child: Text('All')),
                      ...provider.technicians.map(
                        (tech) => DropdownMenuItem(
                          value: tech.id.toString(),
                          child: Text(tech.name),
                        ),
                      ),
                    ],
                    onChanged: (value) {
                      provider.setAssignedToFilter(value ?? '');
                    },
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

