import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/api/models/case_models.dart';
import '../../../core/api/models/data_models.dart';
import '../../../core/services/case_service.dart';
import '../../../core/services/data_service.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/case_details/providers/case_details_provider.dart';
import '../../../shared/widgets/custom_select.dart';
import '../../../shared/widgets/button.dart';
import '../../../shared/widgets/image_viewer.dart';

class StageSections extends StatefulWidget {
  final CaseDetail caseData;
  
  const StageSections({
    super.key,
    required this.caseData,
  });
  
  @override
  State<StageSections> createState() => _StageSectionsState();
}

class _StageSectionsState extends State<StageSections> {
  final Map<int, bool> _expandedStages = {};
  List<Technician> _technicians = [];
  bool _isLoadingTechnicians = false;
  String? _selectedTechnicianId;
  bool _isAssigning = false;
  
  @override
  void initState() {
    super.initState();
    // Expand current stage by default
    _expandedStages[widget.caseData.currentStage] = true;
    // Initialize selected technician
    _selectedTechnicianId = widget.caseData.assignedToId?.toString();
    // Load technicians if CS
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.isCS) {
      _loadTechnicians();
    }
  }
  
  @override
  void didUpdateWidget(StageSections oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Sync selected technician when caseData changes
    if (widget.caseData.assignedToId != oldWidget.caseData.assignedToId) {
      _selectedTechnicianId = widget.caseData.assignedToId?.toString();
    }
  }
  
  Future<void> _loadTechnicians() async {
    setState(() {
      _isLoadingTechnicians = true;
    });
    try {
      final dataService = Provider.of<DataService>(context, listen: false);
      _technicians = await dataService.getTechnicians();
    } catch (e) {
      // Handle error silently
    } finally {
      setState(() {
        _isLoadingTechnicians = false;
      });
    }
  }
  
  String _getStageName(int stage) {
    switch (stage) {
      case 1:
        return 'Input & Categorization';
      case 2:
        return 'Investigation';
      case 3:
        return 'Solution & Planning';
      case 4:
        return 'Execution';
      case 5:
        return 'Closing';
      default:
        return 'Unknown';
    }
  }
  
  Color _getStageColor(int stage, int currentStage, CaseStatus status) {
    if (stage < currentStage) {
      return Colors.green.shade500;
    } else if (stage == currentStage && status != CaseStatus.closed) {
      return const Color(0xFF0d9488); // Teal color for current stage
    } else {
      return Colors.grey.shade300;
    }
  }
  
  Widget _buildStageContent(int stage) {
    final caseData = widget.caseData;
    
    switch (stage) {
      case 1:
        return _buildStage1Content(caseData);
      case 2:
        return _buildStage2Content(caseData);
      case 3:
        return _buildStage3Content(caseData);
      case 4:
        return _buildStage4Content(caseData);
      case 5:
        return _buildStage5Content(caseData);
      default:
        return const SizedBox.shrink();
    }
  }
  
  Widget _buildStage1Content(CaseDetail caseData) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final caseDetailsProvider = Provider.of<CaseDetailsProvider>(context, listen: false);
    final isCurrent = caseData.currentStage == 1;
    // CS can edit stage 1 even if current_stage > 1 (to update assign)
    final canEdit = authProvider.isCS && caseData.status != CaseStatus.closed && caseData.status != CaseStatus.cancelled;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Grid layout for Client, Site, Contact Person, Case Type
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildInfoRow('Client', caseData.client.name),
                  const SizedBox(height: 16),
                  _buildInfoRow('Contact Person', '${caseData.contact.name} - ${caseData.contact.phone}'),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildInfoRow('Site', '${caseData.site.name} (${caseData.site.city})'),
                  const SizedBox(height: 16),
                  _buildInfoRow('Case Type', caseData.caseType),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        
        // Description
        _buildInfoRow('Description', caseData.description.isEmpty ? '-' : caseData.description),
        const SizedBox(height: 16),
        
        // Photos / Attachments
        Builder(
          builder: (context) {
            // Try both '1' and 'case_creation' keys for stage 1 attachments
            final stage1Attachments = caseData.stageAttachments?['1'] ?? 
                                     caseData.stageAttachments?['case_creation'] ?? [];
            
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Photos / Attachments',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 8),
                if (stage1Attachments.isNotEmpty)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: stage1Attachments.map((attachment) {
                  final isImage = attachment.filename.toLowerCase().endsWith('.jpg') ||
                      attachment.filename.toLowerCase().endsWith('.jpeg') ||
                      attachment.filename.toLowerCase().endsWith('.png') ||
                      attachment.filename.toLowerCase().endsWith('.gif') ||
                      attachment.filename.toLowerCase().endsWith('.webp') ||
                      attachment.filename.toLowerCase().endsWith('.bmp');
                  
                  return GestureDetector(
                    onTap: isImage ? () {
                      // Open image viewer
                      final imageAttachments = stage1Attachments
                          .where((att) {
                            final ext = att.filename.toLowerCase().split('.').last;
                            return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].contains(ext);
                          })
                          .toList();
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => ImageViewer(
                            imagePaths: imageAttachments.map((att) => att.url).toList(),
                            initialIndex: imageAttachments.indexOf(attachment),
                            onClose: () => Navigator.of(context).pop(),
                          ),
                        ),
                      );
                    } : null,
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: isImage
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                attachment.url,
                                width: 100,
                                height: 100,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    width: 100,
                                    height: 100,
                                    color: Colors.grey.shade100,
                                    child: const Icon(Icons.broken_image, color: Colors.grey),
                                  );
                                },
                              ),
                            )
                          : Container(
                              width: 100,
                              height: 100,
                              color: Colors.grey.shade100,
                              child: const Icon(Icons.insert_drive_file, color: Colors.grey),
                            ),
                    ),
                  );
                }).toList(),
                )
                else
                  Text(
                    'No attachments',
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 14, fontStyle: FontStyle.italic),
                  ),
              ],
            );
          },
        ),
        const SizedBox(height: 16),
        
        // Assigned Technician (read-only for non-CS or when cannot edit)
        if ((authProvider.isCS || authProvider.isTechnician || authProvider.isLeader) && !canEdit) ...[
          _buildInfoRow('Assigned Technician', caseData.assignedTo?.name ?? '-'),
          const SizedBox(height: 16),
        ],
        
        // Assign section for CS when can edit
        if (canEdit) ...[
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.person_outline, size: 20, color: Color(0xFF0d9488)), // Theme color
                  const SizedBox(width: 8),
                  Expanded(
                    child: CustomSelect(
                      value: _selectedTechnicianId,
                      onChange: (value) {
                        setState(() {
                          _selectedTechnicianId = value;
                        });
                      },
                      placeholder: _isLoadingTechnicians ? 'Loading technicians...' : 'Assign Technician',
                      options: _technicians.map((tech) {
                        return SelectOption(
                          value: tech.id.toString(),
                          label: tech.name,
                        );
                      }).toList(),
                      disabled: _isLoadingTechnicians || _technicians.isEmpty,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity, // Full width button
                child: AppButton(
                  text: isCurrent ? 'Complete' : 'Update',
                onPressed: (_selectedTechnicianId != null && 
                            _selectedTechnicianId!.isNotEmpty &&
                            _selectedTechnicianId != caseData.assignedToId?.toString() &&
                            !_isAssigning)
                    ? () async {
                        setState(() {
                          _isAssigning = true;
                        });
                        try {
                          final updateData = <String, dynamic>{
                            'assigned_to_id': int.parse(_selectedTechnicianId!),
                            'status': 'in_progress',
                          };
                          // If current_stage >= 3, rollback to stage 2
                          if (caseData.currentStage >= 3) {
                            updateData['current_stage'] = 2;
                          }
                          
                          await caseDetailsProvider.updateCase(updateData);
                          
                          // Only advance if it was current stage
                          if (isCurrent) {
                            await caseDetailsProvider.advanceStage();
                            // Close stage 1 and expand stage 2 after advancing
                            setState(() {
                              _expandedStages[1] = false; // Close stage 1
                              _expandedStages[2] = true; // Open stage 2
                            });
                          } else {
                            // Expand current stage (or stage 2 if rolled back)
                            final targetStage = caseData.currentStage >= 3 ? 2 : caseData.currentStage;
                            setState(() {
                              _expandedStages[targetStage] = true;
                            });
                          }
                          
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(isCurrent ? 'Case completed and advanced to Stage 2' : 'Case updated'),
                                backgroundColor: Colors.green,
                              ),
                            );
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Failed to assign technician: ${e.toString()}'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        } finally {
                          if (mounted) {
                            setState(() {
                              _isAssigning = false;
                            });
                          }
                        }
                      }
                    : null,
                  variant: ButtonVariant.primary,
                  isLoading: _isAssigning,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
        
        // Waiting message for non-CS when current stage
        if (!canEdit && isCurrent && !authProvider.isCS) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.amber.shade50,
              borderRadius: BorderRadius.circular(8),
              // No border
            ),
            child: Text(
              '⏳ Waiting for CS to complete',
              style: TextStyle(color: Colors.amber.shade800, fontSize: 14), // Match web color
            ),
          ),
        ],
      ],
    );
  }
  
  Widget _buildStage2Content(CaseDetail caseData) {
    // Try both '2' and 'investigation' keys for stage 2 attachments
    final stage2Attachments = caseData.stageAttachments?['2'] ?? 
                             caseData.stageAttachments?['investigation'] ?? [];
    
    // Parse checklist from JSON string
    List<bool> checklist = [];
    if (caseData.investigationChecklist != null && caseData.investigationChecklist!.isNotEmpty) {
      try {
        final parsed = (caseData.investigationChecklist as String).startsWith('[')
            ? caseData.investigationChecklist
            : '[$caseData.investigationChecklist]';
        final list = (parsed as String).replaceAll('[', '').replaceAll(']', '').split(',');
        checklist = list.map((e) => e.trim().toLowerCase() == 'true').toList();
      } catch (e) {
        checklist = [];
      }
    }
    final checklistItems = ['Check furniture condition', 'Document damage areas', 'Take measurements'];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Investigation Report
        _buildInfoRow('Investigation Report', caseData.investigationReport ?? 'No report yet'),
        const SizedBox(height: 16),
        
        // Photos / Attachments
        Builder(
          builder: (context) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Photos / Attachments',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 8),
                if (stage2Attachments.isNotEmpty)
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: stage2Attachments.map((attachment) {
                      final isImage = attachment.filename.toLowerCase().endsWith('.jpg') ||
                          attachment.filename.toLowerCase().endsWith('.jpeg') ||
                          attachment.filename.toLowerCase().endsWith('.png') ||
                          attachment.filename.toLowerCase().endsWith('.gif') ||
                          attachment.filename.toLowerCase().endsWith('.webp') ||
                          attachment.filename.toLowerCase().endsWith('.bmp');
                      
                      return GestureDetector(
                        onTap: isImage ? () {
                          final imageAttachments = stage2Attachments
                              .where((att) {
                                final ext = att.filename.toLowerCase().split('.').last;
                                return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].contains(ext);
                              })
                              .toList();
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => ImageViewer(
                                imagePaths: imageAttachments.map((att) => att.url).toList(),
                                initialIndex: imageAttachments.indexOf(attachment),
                                onClose: () => Navigator.of(context).pop(),
                              ),
                            ),
                          );
                        } : null,
                        child: Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: isImage
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(
                                    attachment.url,
                                    width: 100,
                                    height: 100,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) {
                                      return Container(
                                        width: 100,
                                        height: 100,
                                        color: Colors.grey.shade100,
                                        child: const Icon(Icons.broken_image, color: Colors.grey),
                                      );
                                    },
                                  ),
                                )
                              : Container(
                                  width: 100,
                                  height: 100,
                                  color: Colors.grey.shade100,
                                  child: const Icon(Icons.insert_drive_file, color: Colors.grey),
                                ),
                        ),
                      );
                    }).toList(),
                  )
                else
                  Text(
                    'No attachments',
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 14, fontStyle: FontStyle.italic),
                  ),
              ],
            );
          },
        ),
        const SizedBox(height: 16),
        
        // Checklist
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Checklist',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 8),
            ...checklistItems.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              final isChecked = index < checklist.length && checklist[index];
              
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Checkbox(
                      value: isChecked,
                      onChanged: null, // Read-only for now
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
                    Expanded(
                      child: Text(
                        item,
                        style: TextStyle(
                          decoration: isChecked ? TextDecoration.lineThrough : null,
                          color: isChecked ? Colors.grey.shade600 : Colors.black87,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
        if (caseData.rootCause != null) ...[
          const SizedBox(height: 16),
          _buildInfoRow('Root Cause', caseData.rootCause!),
        ],
      ],
    );
  }
  
  Widget _buildStage3Content(CaseDetail caseData) {
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
        _buildInfoRow('Root Cause', caseData.rootCause ?? 'No root cause documented'),
        const SizedBox(height: 16),
        
        // Solution Description
        _buildInfoRow('Solution Description', caseData.solutionDescription ?? 'No solution documented'),
        const SizedBox(height: 16),
        
        // Photos / Attachments
        _buildAttachmentsGrid(solutionAttachments),
        const SizedBox(height: 16),
        
        // Checklist
        _buildChecklist(checklistItems, checklist),
        if (caseData.plannedExecutionDate != null) ...[
          const SizedBox(height: 16),
          _buildInfoRow('Planned Execution Date', caseData.plannedExecutionDate!),
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
                _buildInfoRow('Cost Description', caseData.costDescription!),
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
                    _buildAttachmentsGrid(costAttachments),
                  ],
                ),
              ],
            ],
          ),
        ],
      ],
    );
  }
  
  Widget _buildStage4Content(CaseDetail caseData) {
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
        _buildInfoRow('Execution Report', caseData.executionReport ?? 'No report yet'),
        const SizedBox(height: 16),
        
        // Photos / Attachments
        _buildAttachmentsGrid(stage4Attachments),
        const SizedBox(height: 16),
        
        // Checklist
        _buildChecklist(checklistItems, checklist),
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
              _buildInfoRow('Feedback', caseData.clientFeedback!),
            ],
          ],
        ),
      ],
    );
  }
  
  Widget _buildStage5Content(CaseDetail caseData) {
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
        _buildInfoRow('Note', caseData.csNotes ?? '-'),
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
              _buildInfoRow('Feedback', caseData.finalFeedback!),
            ],
          ],
        ),
        
        // Attachments
        if (stage5Attachments.isNotEmpty) ...[
          const SizedBox(height: 16),
          _buildAttachmentsGrid(stage5Attachments),
        ],
      ],
    );
  }
  
  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              color: Colors.grey.shade700,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildAttachmentsGrid(List<CaseAttachment> attachments) {
    return Builder(
      builder: (context) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Photos / Attachments',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 8),
            if (attachments.isNotEmpty)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: attachments.map((attachment) {
                  final isImage = attachment.filename.toLowerCase().endsWith('.jpg') ||
                      attachment.filename.toLowerCase().endsWith('.jpeg') ||
                      attachment.filename.toLowerCase().endsWith('.png') ||
                      attachment.filename.toLowerCase().endsWith('.gif') ||
                      attachment.filename.toLowerCase().endsWith('.webp') ||
                      attachment.filename.toLowerCase().endsWith('.bmp');
                  
                  return GestureDetector(
                    onTap: isImage ? () {
                      final imageAttachments = attachments
                          .where((att) {
                            final ext = att.filename.toLowerCase().split('.').last;
                            return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].contains(ext);
                          })
                          .toList();
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => ImageViewer(
                            imagePaths: imageAttachments.map((att) => att.url).toList(),
                            initialIndex: imageAttachments.indexOf(attachment),
                            onClose: () => Navigator.of(context).pop(),
                          ),
                        ),
                      );
                    } : null,
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: isImage
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                attachment.url,
                                width: 100,
                                height: 100,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    width: 100,
                                    height: 100,
                                    color: Colors.grey.shade100,
                                    child: const Icon(Icons.broken_image, color: Colors.grey),
                                  );
                                },
                              ),
                            )
                          : Container(
                              width: 100,
                              height: 100,
                              color: Colors.grey.shade100,
                              child: const Icon(Icons.insert_drive_file, color: Colors.grey),
                            ),
                    ),
                  );
                }).toList(),
              )
            else
              Text(
                'No attachments',
                style: TextStyle(color: Colors.grey.shade500, fontSize: 14, fontStyle: FontStyle.italic),
              ),
          ],
        );
      },
    );
  }
  
  Widget _buildChecklist(List<String> items, List<bool> checklist) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Checklist',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 8),
        ...items.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          final isChecked = index < checklist.length && checklist[index];
          
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Checkbox(
                  value: isChecked,
                  onChanged: null, // Read-only for now
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
                Expanded(
                  child: Text(
                    item,
                    style: TextStyle(
                      decoration: isChecked ? TextDecoration.lineThrough : null,
                      color: isChecked ? Colors.grey.shade600 : Colors.black87,
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(5, (index) {
        final stage = index + 1;
        final isCompleted = stage < widget.caseData.currentStage;
        final isCurrent = stage == widget.caseData.currentStage;
        final hasData = _hasStageData(stage);
        
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: isCurrent
                ? const BorderSide(color: Color(0xFF0d9488), width: 2) // Ring for current stage
                : BorderSide.none,
          ),
          child: ExpansionTile(
            leading: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _getStageColor(stage, widget.caseData.currentStage, widget.caseData.status),
              ),
              child: Center(
                child: isCompleted
                    ? const Icon(Icons.check, color: Colors.white, size: 16)
                    : Text(
                        '$stage',
                        style: TextStyle(
                          color: isCurrent ? Colors.white : Colors.grey.shade600,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
              ),
            ),
            title: Text(
              'Stage $stage: ${_getStageName(stage)}',
              style: TextStyle(
                fontWeight: FontWeight.w500,
                color: const Color(0xFF1e3a5f),
                fontSize: 14,
              ),
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Badge for Current/Completed/Not Started
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isCompleted
                        ? Colors.green.shade50
                        : isCurrent
                            ? const Color(0xFF0d9488).withOpacity(0.1) // Teal background
                            : Colors.transparent,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    isCompleted
                        ? 'Completed'
                        : isCurrent
                            ? 'Current'
                            : 'Not Started',
                    style: TextStyle(
                      fontSize: 12,
                      color: isCompleted
                          ? Colors.green.shade700
                          : isCurrent
                              ? const Color(0xFF0d9488) // Teal text
                              : Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Icon(
                  _expandedStages[stage] ?? false
                      ? Icons.keyboard_arrow_up
                      : Icons.keyboard_arrow_down,
                  color: Colors.grey.shade400,
                  size: 20,
                ),
              ],
            ),
            initiallyExpanded: _expandedStages[stage] ?? false,
            onExpansionChanged: (expanded) {
              setState(() {
                if (expanded) {
                  // Close all other stages when opening this one
                  for (int i = 1; i <= 5; i++) {
                    if (i != stage) {
                      _expandedStages[i] = false;
                    }
                  }
                }
                _expandedStages[stage] = expanded;
              });
            },
            children: [
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(
                    top: BorderSide(
                      color: Colors.grey.shade200,
                      width: 1,
                    ),
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: hasData
                      ? _buildStageContent(stage)
                      : const Text(
                          'No data available for this stage.',
                          style: TextStyle(
                            color: Colors.grey,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
  
  bool _hasStageData(int stage) {
    final caseData = widget.caseData;
    
    switch (stage) {
      case 1:
        final stage1Attachments = caseData.stageAttachments?['1'] ?? 
                                 caseData.stageAttachments?['case_creation'] ?? [];
        return caseData.description.isNotEmpty ||
            stage1Attachments.isNotEmpty;
      case 2:
        final stage2Attachments = caseData.stageAttachments?['2'] ?? 
                                 caseData.stageAttachments?['investigation'] ?? [];
        return caseData.investigationReport != null ||
            caseData.investigationChecklist != null ||
            caseData.rootCause != null ||
            stage2Attachments.isNotEmpty;
      case 3:
        final stage3Attachments = caseData.stageAttachments?['3'] ?? 
                                 caseData.stageAttachments?['solution'] ?? [];
        return caseData.rootCause != null ||
            caseData.solutionDescription != null ||
            caseData.solutionChecklist != null ||
            caseData.plannedExecutionDate != null ||
            caseData.costRequired == true ||
            stage3Attachments.isNotEmpty;
      case 4:
        final stage4Attachments = caseData.stageAttachments?['4'] ?? 
                                 caseData.stageAttachments?['execution'] ?? [];
        return caseData.executionReport != null ||
            caseData.executionChecklist != null ||
            caseData.clientSignature != null ||
            caseData.clientFeedback != null ||
            caseData.clientRating != null ||
            stage4Attachments.isNotEmpty;
      case 5:
        final stage5Attachments = caseData.stageAttachments?['5'] ?? 
                                 caseData.stageAttachments?['closing'] ?? [];
        return caseData.csNotes != null ||
            (caseData.costRequired == true && 
             caseData.costStatus?.toString().contains('approved') == true) ||
            caseData.finalFeedback != null ||
            caseData.finalRating != null ||
            caseData.finalCost != null ||
            stage5Attachments.isNotEmpty;
      default:
        return false;
    }
  }
}


