import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/case_list_provider.dart';

class CaseFilters extends StatelessWidget {
  const CaseFilters({super.key});
  
  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<CaseListProvider>(context);
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade200),
        ),
      ),
      child: Wrap(
        spacing: 12,
        runSpacing: 12,
        children: [
          // Status filter
          SizedBox(
            width: 150,
            child: DropdownButtonFormField<String>(
              value: provider.statusFilter.isEmpty ? null : provider.statusFilter,
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
          ),
          
          // Case type filter
          SizedBox(
            width: 150,
            child: DropdownButtonFormField<String>(
              value: provider.caseTypeFilter.isEmpty ? null : provider.caseTypeFilter,
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
          ),
          
          // Assigned to filter
          SizedBox(
            width: 150,
            child: DropdownButtonFormField<String>(
              value: provider.assignedToFilter.isEmpty ? null : provider.assignedToFilter,
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
          ),
        ],
      ),
    );
  }
}

