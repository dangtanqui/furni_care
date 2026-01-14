import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
import '../../../core/api/models/case_models.dart';
import '../../../core/services/case_service.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/image_viewer.dart';
import '../../../shared/widgets/file_upload.dart';
import '../../../shared/widgets/button.dart';
import '../../../shared/widgets/text_field.dart';
import '../../../shared/utils/toast_helper.dart';
import '../../../shared/utils/file_duplicate_check.dart';
import '../providers/case_details_provider.dart';
import 'stage_helpers.dart';
import 'dart:convert';

class Stage2Content extends StatefulWidget {
  final CaseDetail caseData;
  final bool isCurrent;
  final bool canEdit;
  final VoidCallback? onStageAdvanced;
  final Function(int)? onStageUpdated;
  
  const Stage2Content({
    super.key,
    required this.caseData,
    this.isCurrent = false,
    this.canEdit = false,
    this.onStageAdvanced,
    this.onStageUpdated,
  });
  
  @override
  State<Stage2Content> createState() => _Stage2ContentState();
}

class _Stage2ContentState extends State<Stage2Content> {
  late TextEditingController _reportController;
  late List<bool> _checklist;
  final List<String> _filePaths = [];
  final Set<String> _processedFiles = {};
  bool _isSubmitting = false;
  bool _isUploading = false;
  Set<String> _uploadingLocalPaths = {};
  
  final List<String> _checklistItems = [
    'Check furniture condition',
    'Document damage areas',
    'Take measurements',
  ];
  
  @override
  void initState() {
    super.initState();
    _reportController = TextEditingController(text: widget.caseData.investigationReport ?? '');
    
    // Parse checklist from JSON string
    _checklist = _parseChecklist(widget.caseData.investigationChecklist);
  }
  
  @override
  void didUpdateWidget(Stage2Content oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Update report when caseData changes
    if (widget.caseData.investigationReport != oldWidget.caseData.investigationReport) {
      _reportController.text = widget.caseData.investigationReport ?? '';
    }
    // Update checklist when caseData changes
    if (widget.caseData.investigationChecklist != oldWidget.caseData.investigationChecklist) {
      _checklist = _parseChecklist(widget.caseData.investigationChecklist);
    }
  }
  
  @override
  void dispose() {
    _reportController.dispose();
    super.dispose();
  }
  
  List<bool> _parseChecklist(String? checklistJson) {
    if (checklistJson == null || checklistJson.isEmpty) {
      return [false, false, false];
    }
    try {
      final parsed = checklistJson.startsWith('[') ? checklistJson : '[$checklistJson]';
      final list = parsed.replaceAll('[', '').replaceAll(']', '').split(',');
      return list.map((e) => e.trim().toLowerCase() == 'true').toList();
    } catch (e) {
      return [false, false, false];
    }
  }
  
  void _toggleChecklist(int index) {
    if (!widget.canEdit) return;
    setState(() {
      _checklist[index] = !_checklist[index];
    });
  }

  Widget _buildChecklistRow(int index, String label) {
    final checked = _checklist.length > index ? _checklist[index] : false;
    return InkWell(
      onTap: widget.canEdit ? () => _toggleChecklist(index) : null,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Checkbox(
              value: checked,
              onChanged: widget.canEdit ? (_) => _toggleChecklist(index) : null,
              fillColor: MaterialStateProperty.resolveWith<Color>(
                (Set<MaterialState> states) {
                  if (states.contains(MaterialState.selected)) {
                    return const Color(0xFF0d9488);
                  }
                  return Colors.transparent;
                },
              ),
              side: const BorderSide(
                color: Color(0xFF0d9488),
                width: 2,
              ),
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              visualDensity: VisualDensity.compact,
            ),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  decoration: checked ? TextDecoration.lineThrough : TextDecoration.none,
                  color: checked ? Colors.grey.shade600 : Colors.black87,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Future<void> _handleFileSelected(String option) async {
    if (!widget.canEdit || _isUploading) return;
    
    final ImagePicker picker = ImagePicker();
    List<String> filePaths = [];
    
    if (option == 'gallery' || option == 'camera') {
      final XFile? image = await picker.pickImage(
        source: option == 'camera' ? ImageSource.camera : ImageSource.gallery,
        imageQuality: 85,
      );
      if (image != null) {
        filePaths = [image.path];
      }
    } else if (option == 'file') {
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: true,
      );
      if (result != null) {
        filePaths = result.files
            .where((file) => file.path != null)
            .map((file) => file.path!)
            .toList();
      }
    }
    
    if (filePaths.isEmpty) return;

    // Show local preview immediately (like create-case does)
    setState(() {
      _isUploading = true;
      for (final p in filePaths) {
        if (!_filePaths.contains(p)) _filePaths.add(p);
      }
      _uploadingLocalPaths = {..._uploadingLocalPaths, ...filePaths};
    });
    
    try {
      final uniqueFiles = filterDuplicateFiles(
        filePaths,
        _processedFiles,
        context,
      );
      
      if (uniqueFiles.isEmpty) {
        setState(() {
          _isUploading = false;
          // Remove only the duplicate files we just added, keep the original ones
          _filePaths.removeWhere((p) => _uploadingLocalPaths.contains(p) && !_processedFiles.contains(p));
          _uploadingLocalPaths.clear();
        });
        return;
      }
      
      // Remove files that were duplicates (not in uniqueFiles)
      setState(() {
        _filePaths.removeWhere((p) => _uploadingLocalPaths.contains(p) && !uniqueFiles.contains(p));
        _uploadingLocalPaths.clear();
      });
      
      final caseDetailsProvider = Provider.of<CaseDetailsProvider>(context, listen: false);
      final caseService = Provider.of<CaseService>(context, listen: false);
      
      await caseService.uploadAttachments(
        widget.caseData.id,
        2,
        uniqueFiles,
      );
      
      // Don't refresh - just keep local previews (like create-case does)
      // Server attachments will be loaded when user manually refreshes or navigates away
      
      // Add to processed files
      for (final file in uniqueFiles) {
        _processedFiles.add(file);
      }
      
      if (mounted) {
        final count = uniqueFiles.length;
        final message = count == 1 
            ? 'File uploaded successfully' 
            : '$count files uploaded successfully';
        ToastHelper.showSuccess(context, message);
      }
    } catch (e) {
      if (mounted) {
        ToastHelper.showError(context, 'Failed to upload file: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }
  
  Future<void> _handleDeleteAttachment(int attachmentId) async {
    if (!widget.canEdit) return;
    
    try {
      final caseService = Provider.of<CaseService>(context, listen: false);
      await caseService.deleteAttachment(widget.caseData.id, attachmentId);
      
      final caseDetailsProvider = Provider.of<CaseDetailsProvider>(context, listen: false);
      await caseDetailsProvider.refresh();
      
      if (mounted) {
        ToastHelper.showSuccess(context, 'Attachment deleted successfully');
      }
    } catch (e) {
      if (mounted) {
        ToastHelper.showError(context, 'Failed to delete attachment: ${e.toString()}');
      }
    }
  }
  
  Future<void> _handleFinish() async {
    if (_isSubmitting) return;
    
    setState(() {
      _isSubmitting = true;
    });
    
    try {
      final caseDetailsProvider = Provider.of<CaseDetailsProvider>(context, listen: false);
      
      final updateData = <String, dynamic>{
        'investigation_report': _reportController.text,
        'investigation_checklist': jsonEncode(_checklist),
      };
      
      await caseDetailsProvider.updateCase(updateData);
      
      if (widget.isCurrent) {
        await caseDetailsProvider.advanceStage();
        await caseDetailsProvider.refresh();
        
        if (widget.onStageAdvanced != null) {
          widget.onStageAdvanced!();
        }
        
        if (mounted) {
          ToastHelper.showSuccess(context, 'Case completed and advanced to Stage 3');
        }
      } else {
        await caseDetailsProvider.refresh();
        
        // Get updated case data to determine current stage
        final updatedCaseData = caseDetailsProvider.caseData;
        if (updatedCaseData != null && widget.onStageUpdated != null) {
          final targetStage = updatedCaseData.currentStage;
          widget.onStageUpdated!(targetStage);
        }
        
        if (mounted) {
          ToastHelper.showSuccess(context, 'Case updated');
        }
      }
    } catch (e) {
      if (mounted) {
        ToastHelper.showError(context, 'Failed to save: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final caseData = widget.caseData;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    // Try both '2' and 'investigation' keys for stage 2 attachments
    final stage2Attachments = caseData.stageAttachments?['2'] ?? 
                             caseData.stageAttachments?['investigation'] ?? [];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Investigation Report
        if (widget.canEdit)
          AppTextField(
            label: 'Investigation Report',
            controller: _reportController,
            maxLines: 5,
            hint: 'Document findings from site investigation...',
          )
        else
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Investigation Report',
                style: TextStyle(
                  fontWeight: FontWeight.w500,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                caseData.investigationReport ?? 'No report yet',
                style: TextStyle(
                  color: Colors.grey.shade700,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        const SizedBox(height: 16),
        
        // Photos / Attachments
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (widget.canEdit)
              FileUpload(
                label: 'Photos / Attachments',
                filePaths: _filePaths,
                onFileSelected: _handleFileSelected,
                onDelete: (index) {
                  // This is handled by attachment deletion
                },
                disabled: _isUploading,
              ),
            if (!widget.canEdit) ...[
              const Text(
                'Photos / Attachments',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 8),
            ],
            const SizedBox(height: 8),
            // When editing, only show local preview (_filePaths)
            // When not editing, show server attachments
            if (widget.canEdit && _filePaths.isEmpty && stage2Attachments.isEmpty)
              Text(
                'No attachments',
                style: TextStyle(color: Colors.grey.shade500, fontSize: 14, fontStyle: FontStyle.italic),
              )
            else if (!widget.canEdit && stage2Attachments.isNotEmpty)
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
                  
                  return Stack(
                    children: [
                      GestureDetector(
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
                                  future: Future.value(<String, String>{}), // Add auth headers if needed
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
                      ),
                      if (widget.canEdit)
                        Positioned(
                          top: 0,
                          right: 0,
                          child: GestureDetector(
                            onTap: () => _handleDeleteAttachment(attachment.id),
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Colors.red,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.close,
                                size: 16,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                    ],
                  );
                }).toList(),
              )
            else if (!widget.canEdit)
              Text(
                'No attachments',
                style: TextStyle(color: Colors.grey.shade500, fontSize: 14, fontStyle: FontStyle.italic),
              ),
          ],
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
            ..._checklistItems.asMap().entries.map((e) => _buildChecklistRow(e.key, e.value)),
          ],
        ),
        if (caseData.rootCause != null) ...[
          const SizedBox(height: 16),
          StageHelpers.buildInfoRow('Root Cause', caseData.rootCause!),
        ],
        
        // Complete/Update Button
        if (widget.canEdit) ...[
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: AppButton(
              text: widget.isCurrent ? 'Complete' : 'Update',
              onPressed: _isSubmitting ? null : _handleFinish,
              variant: ButtonVariant.primary,
              isLoading: _isSubmitting,
            ),
          ),
        ],
        
        // Waiting message for non-editors
        if (!widget.canEdit && widget.isCurrent && (authProvider.isCS || authProvider.isLeader)) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.orange.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.orange.shade200),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    '⏳ Waiting for Technician to complete',
                    style: TextStyle(
                      color: Colors.orange.shade800,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
