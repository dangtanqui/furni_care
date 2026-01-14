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
import '../../../shared/utils/toast_helper.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../config/app_config.dart';
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
    // Initialize like frontend: use currentAssignedId (check both assignedToId and assignedTo.id)
    final assignedId = widget.caseData.assignedToId ?? widget.caseData.assignedTo?.id;
    final currentAssignedId = assignedId?.toString() ?? '';
    _selectedTechnicianId = currentAssignedId.isEmpty ? null : currentAssignedId;
    print('🔵 [STAGE1 DROPDOWN] initState');
    print('   assignedToId: ${widget.caseData.assignedToId}');
    print('   assignedTo?.id: ${widget.caseData.assignedTo?.id}');
    print('   Final assignedId: $assignedId');
    print('   currentAssignedId: $currentAssignedId');
    print('   selectedTechnicianId: $_selectedTechnicianId');
    if (widget.canEdit) {
      _loadTechnicians();
    }
  }
  
  @override
  void didUpdateWidget(Stage1Content oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Sync with currentAssignedId like frontend does with useEffect
    // Check both assignedToId and assignedTo.id
    final oldAssignedId = oldWidget.caseData.assignedToId ?? oldWidget.caseData.assignedTo?.id;
    final newAssignedId = widget.caseData.assignedToId ?? widget.caseData.assignedTo?.id;
    final currentAssignedId = newAssignedId?.toString() ?? '';
    final newValue = currentAssignedId.isEmpty ? null : currentAssignedId;
    
    print('🟡 [STAGE1 DROPDOWN] didUpdateWidget');
    print('   Old assignedToId: ${oldWidget.caseData.assignedToId}, assignedTo?.id: ${oldWidget.caseData.assignedTo?.id}');
    print('   New assignedToId: ${widget.caseData.assignedToId}, assignedTo?.id: ${widget.caseData.assignedTo?.id}');
    print('   Old assignedId: $oldAssignedId');
    print('   New assignedId: $newAssignedId');
    print('   currentAssignedId: $currentAssignedId');
    print('   Current _selectedTechnicianId: $_selectedTechnicianId');
    print('   New value: $newValue');
    print('   Technicians count: ${_technicians.length}');
    
    // Update if value changed (like frontend useEffect with currentAssignedId dependency)
    if (newValue != _selectedTechnicianId) {
      print('   ✅ Updating _selectedTechnicianId from $_selectedTechnicianId to $newValue');
      setState(() {
        _selectedTechnicianId = newValue;
      });
    } else {
      print('   ⏭️  No update needed - values are the same');
    }
  }
  
  Future<void> _loadTechnicians() async {
    setState(() {
      _isLoadingTechnicians = true;
    });
    try {
      final dataService = Provider.of<DataService>(context, listen: false);
      _technicians = await dataService.getTechnicians();
      print('🟢 [STAGE1 DROPDOWN] Loaded ${_technicians.length} technicians');
      // Update selected value after technicians are loaded
      final currentAssignedId = widget.caseData.assignedToId?.toString() ?? '';
      if (currentAssignedId.isNotEmpty && _selectedTechnicianId != currentAssignedId) {
        print('   Updating selectedTechnicianId after loading technicians: $currentAssignedId');
        setState(() {
          _selectedTechnicianId = currentAssignedId;
        });
      }
    } catch (e) {
      print('❌ [STAGE1 DROPDOWN] Error loading technicians: $e');
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
                                imagePaths: imageAttachments.map((att) => StageHelpers.getImageUrl(att.url)).toList(),
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
                              ? FutureBuilder<Map<String, String>>(
                                  future: SecureStorage.getToken().then((token) {
                                    if (token != null) {
                                      return {'Authorization': 'Bearer $token'};
                                    }
                                    return <String, String>{};
                                  }),
                                  builder: (context, snapshot) {
                                    return ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(
                                        StageHelpers.getImageUrl(attachment.url),
                                        width: 100,
                                        height: 100,
                                        fit: BoxFit.cover,
                                        headers: snapshot.data ?? {},
                                        loadingBuilder: (context, child, loadingProgress) {
                                          if (loadingProgress == null) return child;
                                          return Container(
                                            width: 100,
                                            height: 100,
                                            color: Colors.grey.shade100,
                                            child: Center(
                                              child: CircularProgressIndicator(
                                                value: loadingProgress.expectedTotalBytes != null
                                                    ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                                                    : null,
                                              ),
                                            ),
                                          );
                                        },
                                        errorBuilder: (context, error, stackTrace) {
                                          // Print error for debugging
                                          print('Image load error: $error');
                                          print('Image URL: ${StageHelpers.getImageUrl(attachment.url)}');
                                          return Container(
                                            width: 100,
                                            height: 100,
                                            color: Colors.grey.shade100,
                                            child: const Icon(Icons.broken_image, color: Colors.grey),
                                          );
                                        },
                                      ),
                                    );
                                  },
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
                    child: Builder(
                      builder: (context) {
                        // Calculate value like frontend: assignedTo || currentAssignedId || ''
                        // Check both assignedToId and assignedTo.id
                        final assignedId = widget.caseData.assignedToId ?? widget.caseData.assignedTo?.id;
                        final currentAssignedId = assignedId?.toString() ?? '';
                        final selectValue = _selectedTechnicianId ?? currentAssignedId;
                        
                        print('🔵 [STAGE1 DROPDOWN] Building CustomSelect');
                        print('   assignedToId: ${widget.caseData.assignedToId}');
                        print('   assignedTo?.id: ${widget.caseData.assignedTo?.id}');
                        print('   assignedId: $assignedId');
                        print('   _selectedTechnicianId: $_selectedTechnicianId');
                        print('   currentAssignedId: $currentAssignedId');
                        print('   selectValue: $selectValue');
                        print('   Options count: ${_technicians.length}');
                        if (_technicians.isNotEmpty) {
                          _technicians.forEach((tech) {
                            print('     - Tech ${tech.id}: ${tech.name}');
                          });
                        }
                        if (_technicians.isNotEmpty && selectValue.isNotEmpty) {
                          final foundOption = _technicians.any((tech) => tech.id.toString() == selectValue);
                          print('   Option found in list: $foundOption');
                          if (foundOption) {
                            final tech = _technicians.firstWhere((tech) => tech.id.toString() == selectValue);
                            print('   Selected technician: ${tech.name} (id: ${tech.id})');
                          } else {
                            print('   ⚠️  Selected value "$selectValue" not found in technicians list!');
                          }
                        }
                        
                        return CustomSelect(
                          value: selectValue.isEmpty ? null : selectValue,
                          onChange: (value) {
                            print('🟡 [STAGE1 DROPDOWN] onChange called with value: $value');
                            setState(() {
                              _selectedTechnicianId = value.isEmpty ? null : value;
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
                        );
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: Builder(
                  builder: (context) {
                    // Check if technician has changed
                    final assignedId = caseData.assignedToId ?? caseData.assignedTo?.id;
                    final currentAssignedId = assignedId?.toString();
                    final hasChanged = _selectedTechnicianId != null && 
                                     _selectedTechnicianId!.isNotEmpty &&
                                     _selectedTechnicianId != currentAssignedId;
                    
                    // For update (not current stage), only allow if technician has changed
                    final canUpdate = widget.isCurrent 
                        ? (_selectedTechnicianId != null && _selectedTechnicianId!.isNotEmpty)
                        : hasChanged;
                    
                    return AppButton(
                      text: widget.isCurrent ? 'Complete' : 'Update',
                      onPressed: (canUpdate && !_isAssigning)
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
                                  // Reload case data to get updated current_stage
                                  await caseDetailsProvider.refresh();
                                  // Callback to update expanded stages in parent
                                  if (widget.onStageAdvanced != null) {
                                    widget.onStageAdvanced!();
                                  }
                                } else {
                                  // Reload case data first
                                  await caseDetailsProvider.refresh();
                                  // Expand current stage (or stage 2 if rolled back)
                                  final targetStage = caseData.currentStage >= 3 ? 2 : caseData.currentStage;
                                  if (widget.onStageUpdated != null) {
                                    // Close current stage first, then open target stage
                                    widget.onStageUpdated!(targetStage);
                                  }
                                }
                                
                                if (mounted) {
                                  ToastHelper.showSuccess(
                                    context,
                                    widget.isCurrent ? 'Case completed and advanced to Stage 2' : 'Case updated',
                                  );
                                }
                              } catch (e) {
                                if (mounted) {
                                  ToastHelper.showError(context, 'Failed to assign technician: ${e.toString()}');
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
                    );
                  },
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

