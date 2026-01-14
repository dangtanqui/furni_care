import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
import '../../../core/utils/error_handler.dart';

class Stage3Content extends StatefulWidget {
  final CaseDetail caseData;
  final bool isCurrent;
  final bool canEdit;
  final VoidCallback? onStageAdvanced;
  final Function(int)? onStageUpdated;
  
  const Stage3Content({
    super.key,
    required this.caseData,
    this.isCurrent = false,
    this.canEdit = false,
    this.onStageAdvanced,
    this.onStageUpdated,
  });
  
  @override
  State<Stage3Content> createState() => _Stage3ContentState();
}

class _Stage3ContentState extends State<Stage3Content> {
  late TextEditingController _rootCauseController;
  late TextEditingController _solutionDescController;
  late TextEditingController _plannedDateController;
  late TextEditingController _estimatedCostController;
  late TextEditingController _costDescriptionController;
  late List<bool> _checklist;
  final List<String> _filePaths = [];
  final List<String> _costFilePaths = [];
  final Set<String> _processedFiles = {};
  final Set<String> _processedCostFiles = {};
  bool _isSubmitting = false;
  bool _isUploading = false;
  bool _isUploadingCost = false;
  bool _costRequired = false;
  
  final List<String> _checklistItems = [
    'Root cause identified',
    'Solution prepared',
  ];
  
  @override
  void initState() {
    super.initState();
    _rootCauseController = TextEditingController(text: widget.caseData.rootCause ?? '');
    _solutionDescController = TextEditingController(text: widget.caseData.solutionDescription ?? '');
    _plannedDateController = TextEditingController(text: widget.caseData.plannedExecutionDate ?? '');
    _costRequired = widget.caseData.costRequired ?? false;
    _estimatedCostController = TextEditingController(
      text: widget.caseData.estimatedCost != null ? widget.caseData.estimatedCost!.toStringAsFixed(0) : '',
    );
    _costDescriptionController = TextEditingController(text: widget.caseData.costDescription ?? '');
    
    // Parse checklist from JSON string
    _checklist = _parseChecklist(widget.caseData.solutionChecklist);
  }
  
  @override
  void didUpdateWidget(Stage3Content oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Update form when caseData changes
    if (widget.caseData.rootCause != oldWidget.caseData.rootCause) {
      _rootCauseController.text = widget.caseData.rootCause ?? '';
    }
    if (widget.caseData.solutionDescription != oldWidget.caseData.solutionDescription) {
      _solutionDescController.text = widget.caseData.solutionDescription ?? '';
    }
    if (widget.caseData.plannedExecutionDate != oldWidget.caseData.plannedExecutionDate) {
      _plannedDateController.text = widget.caseData.plannedExecutionDate ?? '';
    }
    if (widget.caseData.costRequired != oldWidget.caseData.costRequired) {
      _costRequired = widget.caseData.costRequired ?? false;
    }
    if (widget.caseData.estimatedCost != oldWidget.caseData.estimatedCost) {
      _estimatedCostController.text =
          widget.caseData.estimatedCost != null ? widget.caseData.estimatedCost!.toStringAsFixed(0) : '';
    }
    if (widget.caseData.costDescription != oldWidget.caseData.costDescription) {
      _costDescriptionController.text = widget.caseData.costDescription ?? '';
    }
    if (widget.caseData.solutionChecklist != oldWidget.caseData.solutionChecklist) {
      _checklist = _parseChecklist(widget.caseData.solutionChecklist);
    }
  }
  
  @override
  void dispose() {
    _rootCauseController.dispose();
    _solutionDescController.dispose();
    _plannedDateController.dispose();
    _estimatedCostController.dispose();
    _costDescriptionController.dispose();
    super.dispose();
  }
  
  List<bool> _parseChecklist(String? checklistJson) {
    if (checklistJson == null || checklistJson.isEmpty) {
      return [false, false];
    }
    try {
      final parsed = checklistJson.startsWith('[') ? checklistJson : '[$checklistJson]';
      final list = parsed.replaceAll('[', '').replaceAll(']', '').split(',');
      return list.map((e) => e.trim().toLowerCase() == 'true').toList();
    } catch (e) {
      return [false, false];
    }
  }
  
  void _toggleChecklist(int index) {
    if (!widget.canEdit) return;
    setState(() {
      _checklist[index] = !_checklist[index];
    });
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
    
    // local preview immediately
    setState(() {
      _isUploading = true;
      for (final p in filePaths) {
        if (!_filePaths.contains(p)) _filePaths.add(p);
      }
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
          // Keep files that were already processed, only remove new duplicates
          _filePaths.removeWhere((p) => filePaths.contains(p) && !_processedFiles.contains(p));
        });
        return;
      }
      
      // Remove files that were duplicates (not in uniqueFiles), but keep original ones
      setState(() {
        _filePaths.removeWhere((p) => filePaths.contains(p) && !uniqueFiles.contains(p));
      });
      
      final caseDetailsProvider = Provider.of<CaseDetailsProvider>(context, listen: false);
      final caseService = Provider.of<CaseService>(context, listen: false);
      
      await caseService.uploadAttachments(
        widget.caseData.id,
        3,
        uniqueFiles,
      );
      
      // Refresh case data to get updated attachments
      await caseDetailsProvider.refresh();

      if (mounted) {
        setState(() {
          _filePaths.removeWhere((p) => uniqueFiles.contains(p));
        });
      }
      
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

  Future<void> _handleCostFileSelected(String option) async {
    if (!widget.canEdit || _isUploadingCost) return;

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
      final result = await FilePicker.platform.pickFiles(allowMultiple: true);
      if (result != null) {
        filePaths = result.files.where((f) => f.path != null).map((f) => f.path!).toList();
      }
    }

    if (filePaths.isEmpty) return;

    // Local preview immediately
    setState(() {
      _isUploadingCost = true;
      for (final p in filePaths) {
        if (!_costFilePaths.contains(p)) _costFilePaths.add(p);
      }
    });

    try {
      final uniqueFiles = filterDuplicateFiles(filePaths, _processedCostFiles, context);
      if (uniqueFiles.isEmpty) {
        if (mounted) {
          setState(() {
            _isUploadingCost = false;
            // Keep files that were already processed, only remove new duplicates
            _costFilePaths.removeWhere((p) => filePaths.contains(p) && !_processedCostFiles.contains(p));
          });
        }
        return;
      }
      
      // Remove files that were duplicates (not in uniqueFiles), but keep original ones
      setState(() {
        _costFilePaths.removeWhere((p) => filePaths.contains(p) && !uniqueFiles.contains(p));
      });

      final caseDetailsProvider = Provider.of<CaseDetailsProvider>(context, listen: false);
      final caseService = Provider.of<CaseService>(context, listen: false);

      await caseService.uploadAttachments(
        widget.caseData.id,
        3,
        uniqueFiles,
        attachmentType: 'cost',
      );
      
      // Don't refresh - just keep local previews (like create-case does)
      
      // Add to processed files
      for (final file in uniqueFiles) {
        _processedCostFiles.add(file);
      }

      if (mounted) {
        final count = uniqueFiles.length;
        ToastHelper.showSuccess(
          context,
          count == 1 ? 'File uploaded successfully' : '$count files uploaded successfully',
        );
      }
    } catch (e) {
      if (mounted) {
        ToastHelper.showError(context, 'Failed to upload file: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploadingCost = false;
        });
      }
    }
  }
  
  Future<void> _handleSaveCostOnly() async {
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);

    try {
      final caseDetailsProvider = Provider.of<CaseDetailsProvider>(context, listen: false);

      final updateData = <String, dynamic>{
        'root_cause': _rootCauseController.text,
        'solution_description': _solutionDescController.text,
        'solution_checklist': jsonEncode(_checklist),
        'cost_required': true,
        'status': 'pending',
      };

      final raw = _estimatedCostController.text.trim();
      if (raw.isNotEmpty) {
        updateData['estimated_cost'] = double.tryParse(raw.replaceAll(',', ''));
      }
      updateData['cost_description'] = _costDescriptionController.text;

      await caseDetailsProvider.updateCase(updateData);
      await caseDetailsProvider.refresh();

      final updatedCaseData = caseDetailsProvider.caseData;
      if (updatedCaseData != null && widget.onStageUpdated != null) {
        widget.onStageUpdated!(updatedCaseData.currentStage);
      }

      if (mounted) {
        final isRejected = widget.caseData.costStatus?.toString().contains('rejected') == true;
        ToastHelper.showSuccess(
          context,
          isRejected ? 'Updated. Please resubmit for approval.' : 'Saved. Waiting for Leader approval.',
        );
      }
    } catch (e) {
      if (mounted) {
        String errorMessage = 'Failed to save';
        if (e is AppError) {
          errorMessage = e.message;
        } else if (e is Exception) {
          final appError = AppError.fromException(e);
          errorMessage = appError.message;
        } else {
          errorMessage = e.toString();
        }
        ToastHelper.showError(context, errorMessage);
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
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
        'root_cause': _rootCauseController.text,
        'solution_description': _solutionDescController.text,
        'solution_checklist': jsonEncode(_checklist),
      };
      
      if (_plannedDateController.text.isNotEmpty) {
        updateData['planned_execution_date'] = _plannedDateController.text;
      }

      // Estimate cost section
      updateData['cost_required'] = _costRequired;
      if (_costRequired) {
        final raw = _estimatedCostController.text.trim();
        if (raw.isNotEmpty) {
          updateData['estimated_cost'] = double.tryParse(raw.replaceAll(',', ''));
        }
        updateData['cost_description'] = _costDescriptionController.text;
      }
      
      await caseDetailsProvider.updateCase(updateData);
      
      if (widget.isCurrent) {
        await caseDetailsProvider.advanceStage();
        await caseDetailsProvider.refresh();
        
        if (widget.onStageAdvanced != null) {
          widget.onStageAdvanced!();
        }
        
        if (mounted) {
          ToastHelper.showSuccess(context, 'Case completed and advanced to Stage 4');
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
        String errorMessage = 'Failed to save';
        if (e is AppError) {
          errorMessage = e.message;
        } else if (e is Exception) {
          final appError = AppError.fromException(e);
          errorMessage = appError.message;
        } else {
          final msg = e.toString();
          if (msg.contains('Instance of') && msg.contains('AppError')) {
            errorMessage = 'Failed to save. Please try again.';
          } else if (msg.contains('_TypeError') || (msg.contains('type') && msg.contains('is not a subtype'))) {
            errorMessage = 'Data format error. Please try again.';
          } else {
            errorMessage = msg;
          }
        }
        ToastHelper.showError(context, errorMessage);
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
    
    // Try both '3' and 'solution' keys for stage 3 attachments
    final stage3Attachments = caseData.stageAttachments?['3'] ?? 
                             caseData.stageAttachments?['solution'] ?? [];
    // Filter out cost attachments
    final solutionAttachments = stage3Attachments.where((att) => 
      att.attachmentType != 'cost'
    ).toList();
    final costAttachments = stage3Attachments.where((att) => 
      att.attachmentType == 'cost'
    ).toList();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Root Cause (input)
        if (widget.canEdit)
          AppTextField(
            label: 'Root Cause',
            controller: _rootCauseController,
            hint: 'Document root cause...',
            maxLines: 1,
          )
        else
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Root Cause',
                style: TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
              ),
              const SizedBox(height: 8),
              Text(
                caseData.rootCause ?? 'No root cause documented',
                style: TextStyle(color: Colors.grey.shade700, fontSize: 14),
              ),
            ],
          ),
        const SizedBox(height: 16),
        
        // Solution Description
        if (widget.canEdit)
          AppTextField(
            label: 'Solution Description',
            controller: _solutionDescController,
            maxLines: 5,
            hint: 'Document solution description...',
          )
        else
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Solution Description',
                style: TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
              ),
              const SizedBox(height: 8),
              Text(
                caseData.solutionDescription ?? 'No solution documented',
                style: TextStyle(color: Colors.grey.shade700, fontSize: 14),
              ),
            ],
          ),
        const SizedBox(height: 16),

        // Planned Execution Date (under solution description)
        if (widget.canEdit || caseData.plannedExecutionDate != null) ...[
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Planned Execution Date',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 8),
              if (widget.canEdit)
                TextField(
                  controller: _plannedDateController,
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: Colors.white,
                    hintText: 'YYYY-MM-DD',
                    hintStyle: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade500,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: Color(0xFF0d9488), width: 2),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now(),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (date != null) {
                      _plannedDateController.text = date.toIso8601String().split('T')[0];
                    }
                  },
                  readOnly: true,
                )
              else
                Text(
                  caseData.plannedExecutionDate ?? '-',
                  style: TextStyle(color: Colors.grey.shade700, fontSize: 14),
                ),
            ],
          ),
          const SizedBox(height: 16),
        ],
        
        // Photos / Attachments
        if (widget.canEdit) ...[
          FileUpload(
            label: 'Photos / Attachments',
            filePaths: _filePaths,
            onFileSelected: _handleFileSelected,
            onDelete: (index) {
              // This is handled by attachment deletion
            },
            disabled: _isUploading,
          ),
          const SizedBox(height: 16),
        ] else if (solutionAttachments.isNotEmpty) ...[
          Column(
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
              StageHelpers.buildAttachmentsGridWithDelete(
                context,
                solutionAttachments,
                widget.canEdit,
                _handleDeleteAttachment,
              ),
            ],
          ),
          const SizedBox(height: 16),
        ] else ...[
          Column(
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
              Text(
                'No attachments',
                style: TextStyle(color: Colors.grey.shade500, fontSize: 14, fontStyle: FontStyle.italic),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
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
            ..._checklistItems.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
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
                          item,
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
            }),
          ],
        ),

        // Estimate Cost (editable like web/create-case)
        const SizedBox(height: 16),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            InkWell(
              onTap: widget.canEdit ? () => setState(() => _costRequired = !_costRequired) : null,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Checkbox(
                    value: _costRequired,
                    onChanged: widget.canEdit ? (v) => setState(() => _costRequired = v ?? false) : null,
                    fillColor: MaterialStateProperty.resolveWith<Color>(
                      (Set<MaterialState> states) {
                        if (states.contains(MaterialState.selected)) {
                          return const Color(0xFF0d9488);
                        }
                        return Colors.transparent;
                      },
                    ),
                    side: const BorderSide(color: Color(0xFF0d9488), width: 2),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    visualDensity: VisualDensity.compact,
                  ),
                  const SizedBox(width: 4),
                  const Text('Cost Required', style: TextStyle(fontSize: 14)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            if ((_costRequired || caseData.costRequired == true)) ...[
              if (widget.canEdit) ...[
                Row(
                  children: [
                    Expanded(
                      child: AppTextField(
                        label: 'Estimated Cost',
                        hint: 'Enter cost',
                        controller: _estimatedCostController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Status',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF1e3a5f),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              caseData.costStatus != null
                                  ? caseData.costStatus.toString().split('.').last
                                  : 'Pending',
                              style: TextStyle(
                                fontSize: 14,
                                color: caseData.costStatus?.toString().contains('approved') == true
                                    ? Colors.green.shade700
                                    : caseData.costStatus?.toString().contains('rejected') == true
                                        ? Colors.red.shade700
                                        : Colors.amber.shade700,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Cost Description',
                  hint: 'Describe the cost',
                  controller: _costDescriptionController,
                  maxLines: 3,
                ),
                const SizedBox(height: 12),
                FileUpload(
                  label: 'Cost Attachments',
                  filePaths: _costFilePaths,
                  onFileSelected: _handleCostFileSelected,
                  onDelete: (index) {
                    setState(() {
                      _costFilePaths.removeAt(index);
                    });
                  },
                  disabled: _isUploadingCost,
                ),
              ] else ...[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Estimated Cost', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          const SizedBox(height: 4),
                          Text(
                            caseData.estimatedCost != null ? '\$${caseData.estimatedCost!.toStringAsFixed(0)}' : '-',
                            style: TextStyle(color: Colors.grey.shade700, fontSize: 14),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          const SizedBox(height: 4),
                          Text(
                            caseData.costStatus != null ? caseData.costStatus.toString().split('.').last : 'Pending',
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
                if ((caseData.costDescription ?? '').isNotEmpty) ...[
                  const SizedBox(height: 12),
                  StageHelpers.buildInfoRow('Cost Description', caseData.costDescription!),
                ],
              ],
              if (costAttachments.isNotEmpty) ...[
                const SizedBox(height: 12),
                StageHelpers.buildAttachmentsGridWithDelete(
                  context,
                  costAttachments,
                  widget.canEdit,
                  _handleDeleteAttachment,
                ),
              ],
            ],
          ],
        ),

        // Legacy read-only cost section (kept for backward compatibility)
        if (false && caseData.costRequired == true) ...[
          const SizedBox(height: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.attach_money, color: Color(0xFF0d9488), size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Cost Required',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                ],
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
                const SizedBox(height: 12),
                StageHelpers.buildInfoRow('Cost Description', caseData.costDescription!),
              ],
            ],
          ),
        ],
        
        // Action buttons (respect cost required logic)
        if (widget.canEdit) ...[
          const SizedBox(height: 16),
          Builder(
            builder: (context) {
              final costRequired = _costRequired;
              final costStatus = widget.caseData.costStatus?.toString().toLowerCase() ?? '';
              final isApproved = costStatus.contains('approved');
              final isRejected = costStatus.contains('rejected');
              final canAdvance = !costRequired || isApproved;
              final hasSavedCost = (widget.caseData.estimatedCost != null) ||
                  (widget.caseData.costDescription?.isNotEmpty == true) ||
                  ((widget.caseData.stageAttachments?['cost'] ?? []).isNotEmpty);
              final estimatedEmpty = _estimatedCostController.text.trim().isEmpty;

              String primaryText;
              VoidCallback? onPressed;
              Widget? helper;

              if (costRequired && !canAdvance) {
                primaryText = hasSavedCost ? 'Update' : 'Save';
                onPressed = _isSubmitting || estimatedEmpty ? null : _handleSaveCostOnly;
                helper = Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    isRejected
                        ? 'Was rejected. Please update and resubmit.'
                        : 'Save first, then wait for Leader approval',
                    style: TextStyle(
                      fontSize: 13,
                      color: isRejected ? Colors.red.shade700 : Colors.orange.shade800,
                    ),
                  ),
                );
              } else {
                primaryText = widget.isCurrent ? 'Complete' : 'Update';
                onPressed = _isSubmitting ? null : _handleFinish;
              }

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: double.infinity,
                    child: AppButton(
                      text: primaryText,
                      onPressed: onPressed,
                      variant: ButtonVariant.primary,
                      isLoading: _isSubmitting,
                    ),
                  ),
                  if (helper != null) helper,
                ],
              );
            },
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
