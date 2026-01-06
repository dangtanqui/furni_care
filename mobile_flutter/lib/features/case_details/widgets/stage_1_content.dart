import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/api/models/case_models.dart';
import '../../../core/api/models/data_models.dart';
import '../../../core/services/data_service.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/case_details/providers/case_details_provider.dart';
import '../../../shared/widgets/custom_select.dart';
import '../../../shared/widgets/button.dart';
import '../../../shared/widgets/image_viewer.dart';
import 'stage_helpers.dart';

class Stage1Content extends StatefulWidget {
  final CaseDetail caseData;
  final bool isCurrent;
  final bool canEdit;
  final VoidCallback? onStageAdvanced;
  final Function(int)? onStageUpdated;
  
  const Stage1Content({
    super.key,
    required this.caseData,
    required this.isCurrent,
    required this.canEdit,
    this.onStageAdvanced,
    this.onStageUpdated,
  });
  
  @override
  State<Stage1Content> createState() => _Stage1ContentState();
}

class _Stage1ContentState extends State<Stage1Content> {
  List<Technician> _technicians = [];
  bool _isLoadingTechnicians = false;
  String? _selectedTechnicianId;
  bool _isAssigning = false;
  
  @override
  void initState() {
    super.initState();
    _selectedTechnicianId = widget.caseData.assignedToId?.toString();
    if (widget.canEdit) {
      _loadTechnicians();
    }
  }
  
  @override
  void didUpdateWidget(Stage1Content oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.caseData.assignedToId != oldWidget.caseData.assignedToId) {
      setState(() {
        _selectedTechnicianId = widget.caseData.assignedToId?.toString();
      });
    }
    if (widget.caseData.assignedToId != null) {
      setState(() {
        _selectedTechnicianId = widget.caseData.assignedToId?.toString();
      });
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
  
  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final caseDetailsProvider = Provider.of<CaseDetailsProvider>(context, listen: false);
    final caseData = widget.caseData;
    
    // Try both '1' and 'case_creation' keys for stage 1 attachments
    final stage1Attachments = caseData.stageAttachments?['1'] ?? 
                             caseData.stageAttachments?['case_creation'] ?? [];
    
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
                  StageHelpers.buildInfoRow('Client', caseData.client.name),
                  const SizedBox(height: 16),
                  StageHelpers.buildInfoRow('Contact Person', '${caseData.contact.name} - ${caseData.contact.phone}'),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  StageHelpers.buildInfoRow('Site', '${caseData.site.name} (${caseData.site.city})'),
                  const SizedBox(height: 16),
                  StageHelpers.buildInfoRow('Case Type', caseData.caseType),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        
        // Description
        StageHelpers.buildInfoRow('Description', caseData.description.isEmpty ? '-' : caseData.description),
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
        if ((authProvider.isCS || authProvider.isTechnician || authProvider.isLeader) && !widget.canEdit) ...[
          StageHelpers.buildInfoRow('Assigned Technician', caseData.assignedTo?.name ?? '-'),
          const SizedBox(height: 16),
        ],
        
        // Assign section for CS when can edit
        if (widget.canEdit) ...[
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.person_outline, size: 20, color: Color(0xFF0d9488)),
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
                width: double.infinity,
                child: AppButton(
                  text: widget.isCurrent ? 'Complete' : 'Update',
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
                            if (caseData.currentStage >= 3) {
                              updateData['current_stage'] = 2;
                            }
                            
                            await caseDetailsProvider.updateCase(updateData);
                            
                            if (widget.isCurrent) {
                              await caseDetailsProvider.advanceStage();
                              // Callback to update expanded stages in parent
                              if (widget.onStageAdvanced != null) {
                                widget.onStageAdvanced!();
                              }
                            } else {
                              // Expand current stage (or stage 2 if rolled back)
                              final targetStage = caseData.currentStage >= 3 ? 2 : caseData.currentStage;
                              if (widget.onStageUpdated != null) {
                                widget.onStageUpdated!(targetStage);
                              }
                            }
                            
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(widget.isCurrent ? 'Case completed and advanced to Stage 2' : 'Case updated'),
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
        if (!widget.canEdit && widget.isCurrent && !authProvider.isCS) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.amber.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '⏳ Waiting for CS to complete',
              style: TextStyle(color: Colors.amber.shade800, fontSize: 14),
            ),
          ),
        ],
      ],
    );
  }
}

