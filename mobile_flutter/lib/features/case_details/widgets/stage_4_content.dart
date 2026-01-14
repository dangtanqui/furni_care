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
import '../../../shared/widgets/signature_pad.dart';
import '../../../shared/utils/toast_helper.dart';
import '../../../shared/utils/file_duplicate_check.dart';
import '../providers/case_details_provider.dart';
import 'stage_helpers.dart';
import 'dart:convert';
import 'dart:typed_data';
import 'dart:convert' as conv;

class Stage4Content extends StatefulWidget {
  final CaseDetail caseData;
  final bool isCurrent;
  final bool canEdit;
  final VoidCallback? onStageAdvanced;
  final Function(int)? onStageUpdated;
  
  const Stage4Content({
    super.key,
    required this.caseData,
    this.isCurrent = false,
    this.canEdit = false,
    this.onStageAdvanced,
    this.onStageUpdated,
  });
  
  @override
  State<Stage4Content> createState() => _Stage4ContentState();
}

class _Stage4ContentState extends State<Stage4Content> {
  late TextEditingController _executionReportController;
  late TextEditingController _clientFeedbackController;
  late List<bool> _checklist;
  late int _clientRating;
  final List<String> _filePaths = [];
  final Set<String> _processedFiles = {};
  bool _isSubmitting = false;
  bool _isUploading = false;
  String? _signatureDataUrl; // data:image/png;base64,...
  Set<String> _uploadingLocalPaths = {};
  
  final List<String> _checklistItems = [
    'Work completed as planned',
    'Client satisfied with work',
  ];
  
  @override
  void initState() {
    super.initState();
    _executionReportController = TextEditingController(text: widget.caseData.executionReport ?? '');
    _clientFeedbackController = TextEditingController(text: widget.caseData.clientFeedback ?? '');
    _clientRating = widget.caseData.clientRating ?? 5;
    _signatureDataUrl = null;
    
    // Parse checklist from JSON string
    _checklist = _parseChecklist(widget.caseData.executionChecklist);
  }
  
  @override
  void didUpdateWidget(Stage4Content oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Update form when caseData changes
    if (widget.caseData.executionReport != oldWidget.caseData.executionReport) {
      _executionReportController.text = widget.caseData.executionReport ?? '';
    }
    if (widget.caseData.clientFeedback != oldWidget.caseData.clientFeedback) {
      _clientFeedbackController.text = widget.caseData.clientFeedback ?? '';
    }
    if (widget.caseData.clientRating != oldWidget.caseData.clientRating) {
      _clientRating = widget.caseData.clientRating ?? 5;
    }
    if (widget.caseData.executionChecklist != oldWidget.caseData.executionChecklist) {
      _checklist = _parseChecklist(widget.caseData.executionChecklist);
    }
  }
  
  @override
  void dispose() {
    _executionReportController.dispose();
    _clientFeedbackController.dispose();
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
          _filePaths.removeWhere((p) => _uploadingLocalPaths.contains(p));
          _uploadingLocalPaths.clear();
        });
        return;
      }
      
      final caseDetailsProvider = Provider.of<CaseDetailsProvider>(context, listen: false);
      final caseService = Provider.of<CaseService>(context, listen: false);
      
      await caseService.uploadAttachments(
        widget.caseData.id,
        4,
        uniqueFiles,
      );
      
      // Refresh case data to get updated attachments
      await caseDetailsProvider.refresh();

      if (mounted) {
        setState(() {
          _filePaths.removeWhere((p) => uniqueFiles.contains(p));
          _uploadingLocalPaths.removeWhere((p) => uniqueFiles.contains(p));
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
  
  Future<void> _handleFinish() async {
    if (_isSubmitting) return;
    
    setState(() {
      _isSubmitting = true;
    });
    
    try {
      final caseDetailsProvider = Provider.of<CaseDetailsProvider>(context, listen: false);
      
      final updateData = <String, dynamic>{
        'execution_report': _executionReportController.text,
        'execution_checklist': jsonEncode(_checklist),
        'client_feedback': _clientFeedbackController.text,
        'client_rating': _clientRating,
      };

      if ((_signatureDataUrl ?? '').isNotEmpty) {
        updateData['client_signature'] = _signatureDataUrl;
      }
      
      await caseDetailsProvider.updateCase(updateData);
      
      if (widget.isCurrent) {
        await caseDetailsProvider.advanceStage();
        await caseDetailsProvider.refresh();
        
        if (widget.onStageAdvanced != null) {
          widget.onStageAdvanced!();
        }
        
        if (mounted) {
          ToastHelper.showSuccess(context, 'Case completed and advanced to Stage 5');
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
    
    // Try both '4' and 'execution' keys for stage 4 attachments
    final stage4Attachments = caseData.stageAttachments?['4'] ?? 
                             caseData.stageAttachments?['execution'] ?? [];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Execution Report
        if (widget.canEdit)
          AppTextField(
            label: 'Execution Report',
            controller: _executionReportController,
            maxLines: 5,
            hint: 'Document execution details...',
          )
        else
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Execution Report',
                style: TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
              ),
              const SizedBox(height: 8),
              Text(
                caseData.executionReport ?? 'No report yet',
                style: TextStyle(color: Colors.grey.shade700, fontSize: 14),
              ),
            ],
          ),
        const SizedBox(height: 16),
        
        // Photos / Attachments
        if (widget.canEdit) ...[
          FileUpload(
            label: 'Photos / Attachments',
            filePaths: _filePaths,
            onFileSelected: _handleFileSelected,
            onDelete: (index) {
              setState(() {
                _filePaths.removeAt(index);
              });
            },
            disabled: _isUploading,
          ),
          const SizedBox(height: 16),
        ] else if (stage4Attachments.isNotEmpty) ...[
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
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: stage4Attachments.map((attachment) {
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
                          final imageAttachments = stage4Attachments
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
                                  future: Future.value(<String, String>{}),
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
              'Execution Checklist',
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
        const SizedBox(height: 16),
        
        // Client Signature (read-only display for now)
        if (widget.canEdit || caseData.clientSignature != null) ...[
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
              if (widget.canEdit) ...[
                // Responsive height: 180 on small screens, up to 260 on large
                LayoutBuilder(
                  builder: (context, constraints) {
                    final h = (MediaQuery.of(context).size.height * 0.22).clamp(180.0, 260.0);
                    return SignaturePad(
                      height: h,
                      onChanged: (dataUrl) {
                        setState(() {
                          _signatureDataUrl = dataUrl.isEmpty ? null : dataUrl;
                        });
                      },
                      enabled: widget.canEdit,
                    );
                  },
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    TextButton(
                      onPressed: () {
                        setState(() {
                          _signatureDataUrl = null;
                        });
                      },
                      child: const Text('Clear'),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      (_signatureDataUrl ?? '').isNotEmpty ? 'Signed' : 'Not signed',
                      style: TextStyle(color: Colors.grey.shade700),
                    ),
                  ],
                ),
              ] else ...[
                // Display existing signature: support data URL or URL or plain text
                _buildSignatureDisplay(caseData.clientSignature!),
              ],
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
            // Rating
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Rating',
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 8),
                if (widget.canEdit)
                  Row(
                    children: [1, 2, 3, 4, 5].map((n) {
                      return GestureDetector(
                        onTap: () => setState(() => _clientRating = n),
                        child: Container(
                          margin: const EdgeInsets.only(right: 8),
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: _clientRating >= n ? const Color(0xFF0d9488) : Colors.white,
                            border: Border.all(
                              color: _clientRating >= n ? const Color(0xFF0d9488) : Colors.grey.shade300,
                            ),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              n.toString(),
                              style: TextStyle(
                                color: _clientRating >= n ? Colors.white : Colors.black87,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  )
                else
                  Text(
                    caseData.clientRating != null ? '${caseData.clientRating}/5' : '-',
                    style: TextStyle(
                      color: Colors.grey.shade700,
                      fontSize: 14,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            // Feedback text
            if (widget.canEdit)
              AppTextField(
                label: 'Client Feedback',
                controller: _clientFeedbackController,
                maxLines: 3,
                hint: 'Enter client feedback...',
              )
            else
              Text(
                caseData.clientFeedback ?? '-',
                style: TextStyle(
                  color: Colors.grey.shade700,
                  fontSize: 14,
                ),
              ),
          ],
        ),
        
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

  Widget _buildSignatureDisplay(String signature) {
    // data URL
    if (signature.startsWith('data:image')) {
      try {
        final base64Part = signature.split(',').last;
        final bytes = conv.base64Decode(base64Part);
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: Colors.grey.shade300),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Image.memory(
            Uint8List.fromList(bytes),
            height: 140,
            fit: BoxFit.contain,
            errorBuilder: (context, error, stackTrace) {
              return const Text('Signature image unavailable');
            },
          ),
        );
      } catch (_) {
        // fall through
      }
    }
    // URL
    if (signature.startsWith('http') || signature.startsWith('/')) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Image.network(
          StageHelpers.getImageUrl(signature),
          height: 140,
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) {
            return const Text('Signature image unavailable');
          },
        ),
      );
    }
    // Plain text fallback
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(signature, style: const TextStyle(fontSize: 14)),
    );
  }
}
