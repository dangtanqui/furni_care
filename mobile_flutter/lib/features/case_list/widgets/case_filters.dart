import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../shared/widgets/custom_select.dart';
import '../providers/case_list_provider.dart';

class CaseFilters extends StatefulWidget {
  const CaseFilters({super.key});
  
  @override
  State<CaseFilters> createState() => _CaseFiltersState();
}

class _CaseFiltersState extends State<CaseFilters> {
  bool _isExpanded = false;
  
  void _closeAllDropdowns() {
    // Close all CustomSelect dropdowns using static method
    CustomSelect.closeAll();
    // Also unfocus to be safe
    FocusScope.of(context).unfocus();
  }
  
  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<CaseListProvider>(context);
    
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.shade200,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // FILTER toggle button
          InkWell(
            onTap: () {
              // Close all dropdowns first
              _closeAllDropdowns();
              // If expanded, close it; if not, open it
              if (_isExpanded) {
                setState(() {
                  _isExpanded = false;
                });
              } else {
                setState(() {
                  _isExpanded = true;
                });
              }
            },
            child: Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Filter icon - using tune which is closer to lucide-react Filter
                  Icon(
                    Icons.tune,
                    size: 20,
                    color: Colors.grey.shade500,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'FILTER',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                      color: Colors.grey.shade500,
                    ),
                  ),
                  const Spacer(),
                  Icon(
                    _isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                    size: 20,
                    color: Colors.grey.shade500,
                  ),
                ],
              ),
            ),
          ),
          
          // Expanded filters
          if (_isExpanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Status filter
                  CustomSelect(
                    value: provider.statusFilter.isEmpty ? '' : provider.statusFilter,
                    onChange: (value) {
                      provider.setStatusFilter(value);
                    },
                    placeholder: 'Filter by Status',
                    options: const [
                      SelectOption(value: '', label: 'All Status'),
                      SelectOption(value: 'open', label: 'Open'),
                      SelectOption(value: 'pending', label: 'Pending'),
                      SelectOption(value: 'in_progress', label: 'In Progress'),
                      SelectOption(value: 'completed', label: 'Completed'),
                      SelectOption(value: 'closed', label: 'Closed'),
                      SelectOption(value: 'rejected', label: 'Rejected'),
                      SelectOption(value: 'cancelled', label: 'Cancelled'),
                    ],
                  ),
                  const SizedBox(height: 12),
                  
                  // Case type filter
                  CustomSelect(
                    value: provider.caseTypeFilter.isEmpty ? '' : provider.caseTypeFilter,
                    onChange: (value) {
                      provider.setCaseTypeFilter(value);
                    },
                    placeholder: 'Filter by Type',
                    options: const [
                      SelectOption(value: '', label: 'All Types'),
                      SelectOption(value: 'warranty', label: 'Warranty'),
                      SelectOption(value: 'maintenance', label: 'Maintenance'),
                      SelectOption(value: 'repair', label: 'Repair'),
                    ],
                  ),
                  const SizedBox(height: 12),
                  
                  // Assigned to filter
                  CustomSelect(
                    value: provider.assignedToFilter.isEmpty ? '' : provider.assignedToFilter,
                    onChange: (value) {
                      provider.setAssignedToFilter(value);
                    },
                    placeholder: 'Filter by Technician',
                    options: [
                      const SelectOption(value: '', label: 'All Assigned'),
                      const SelectOption(value: 'unassigned', label: 'Unassigned'),
                      ...provider.technicians.map(
                        (tech) => SelectOption(
                          value: tech.id.toString(),
                          label: tech.name,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

