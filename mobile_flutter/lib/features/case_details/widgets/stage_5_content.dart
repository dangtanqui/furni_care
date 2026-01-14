import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/api/models/case_models.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/button.dart';
import '../../../shared/widgets/text_field.dart';
import '../../../shared/utils/toast_helper.dart';
import '../providers/case_details_provider.dart';
import 'stage_helpers.dart';

class Stage5Content extends StatefulWidget {
  final CaseDetail caseData;
  final bool isCurrent;
  final bool canEdit;
  final VoidCallback? onStageClosed;
  final VoidCallback? onRedoToStage3;

  const Stage5Content({
    super.key,
    required this.caseData,
    this.isCurrent = false,
    this.canEdit = false,
    this.onStageClosed,
    this.onRedoToStage3,
  });

  @override
  State<Stage5Content> createState() => _Stage5ContentState();
}

class _Stage5ContentState extends State<Stage5Content> {
  late TextEditingController _csNotesController;
  late TextEditingController _finalFeedbackController;
  late TextEditingController _finalCostController;
  int _finalRating = 5;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _csNotesController = TextEditingController(text: widget.caseData.csNotes ?? '');
    _finalFeedbackController = TextEditingController(text: widget.caseData.finalFeedback ?? '');
    _finalCostController = TextEditingController(
      text: widget.caseData.finalCost != null ? widget.caseData.finalCost!.toStringAsFixed(0) : '',
    );
    _finalRating = widget.caseData.finalRating ?? 5;
  }

  @override
  void didUpdateWidget(Stage5Content oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.caseData.csNotes != oldWidget.caseData.csNotes) {
      _csNotesController.text = widget.caseData.csNotes ?? '';
    }
    if (widget.caseData.finalFeedback != oldWidget.caseData.finalFeedback) {
      _finalFeedbackController.text = widget.caseData.finalFeedback ?? '';
    }
    if (widget.caseData.finalCost != oldWidget.caseData.finalCost) {
      _finalCostController.text =
          widget.caseData.finalCost != null ? widget.caseData.finalCost!.toStringAsFixed(0) : '';
    }
    if (widget.caseData.finalRating != oldWidget.caseData.finalRating) {
      _finalRating = widget.caseData.finalRating ?? 5;
    }
  }

  @override
  void dispose() {
    _csNotesController.dispose();
    _finalFeedbackController.dispose();
    _finalCostController.dispose();
    super.dispose();
  }

  Future<void> _handleSave({required bool closeCase}) async {
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);
    try {
      final provider = Provider.of<CaseDetailsProvider>(context, listen: false);

      final updateData = <String, dynamic>{
        'cs_notes': _csNotesController.text,
        'final_feedback': _finalFeedbackController.text,
        'final_rating': _finalRating,
      };

      // When cost was required, allow CS to enter final_cost
      if (widget.caseData.costRequired == true) {
        final raw = _finalCostController.text.trim();
        if (raw.isNotEmpty) {
          updateData['final_cost'] = double.tryParse(raw.replaceAll(',', ''));
        }
      }

      if (closeCase) {
        updateData['status'] = 'closed';
      }

      await provider.updateCase(updateData);
      await provider.refresh();

      if (!mounted) return;
      ToastHelper.showSuccess(context, closeCase ? 'Case closed' : 'Case updated');
      if (closeCase) {
        widget.onStageClosed?.call();
      }
    } catch (e) {
      if (!mounted) return;
      ToastHelper.showError(context, 'Failed to save: ${e.toString()}');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _handleRedoToStage3() async {
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);
    try {
      final provider = Provider.of<CaseDetailsProvider>(context, listen: false);
      await provider.updateCase({
        'current_stage': 3,
        'status': 'in_progress',
      });
      await provider.refresh();

      if (!mounted) return;
      ToastHelper.showSuccess(context, 'Case moved back to Stage 3');
      widget.onRedoToStage3?.call();
    } catch (e) {
      if (!mounted) return;
      ToastHelper.showError(context, 'Failed to redo: ${e.toString()}');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final caseData = widget.caseData;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
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
        if (widget.canEdit)
          AppTextField(
            label: 'Note',
            controller: _csNotesController,
            maxLines: 4,
            hint: 'Enter note...',
          )
        else
          StageHelpers.buildInfoRow('Note', caseData.csNotes ?? '-'),
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
              if (widget.canEdit && caseData.costRequired == true) ...[
                AppTextField(
                  label: 'Final Cost',
                  controller: _finalCostController,
                  keyboardType: TextInputType.number,
                  hint: 'Enter final cost',
                ),
                const SizedBox(height: 12),
              ],
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
            const SizedBox(height: 12),
            if (widget.canEdit) ...[
              // Rating buttons
              Row(
                children: [1, 2, 3, 4, 5].map((n) {
                  return GestureDetector(
                    onTap: () => setState(() => _finalRating = n),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: _finalRating >= n ? const Color(0xFF0d9488) : Colors.white,
                        border: Border.all(
                          color: _finalRating >= n ? const Color(0xFF0d9488) : Colors.grey.shade300,
                        ),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          n.toString(),
                          style: TextStyle(
                            color: _finalRating >= n ? Colors.white : Colors.black87,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              AppTextField(
                label: 'Feedback',
                controller: _finalFeedbackController,
                maxLines: 3,
                hint: 'Enter final feedback...',
              ),
            ] else if (caseData.finalFeedback != null) ...[
              StageHelpers.buildInfoRow('Feedback', caseData.finalFeedback!),
            ],
          ],
        ),
        
        // Attachments
        if (stage5Attachments.isNotEmpty) ...[
          const SizedBox(height: 16),
          StageHelpers.buildAttachmentsGrid(context, stage5Attachments),
        ],

        // Action buttons for CS
        if (widget.canEdit &&
            caseData.status != CaseStatus.closed &&
            caseData.status != CaseStatus.cancelled) ...[
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: AppButton(
              text: 'Complete',
              onPressed: _isSubmitting ? null : () => _handleSave(closeCase: true),
              variant: ButtonVariant.primary,
              isLoading: _isSubmitting,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: AppButton(
              text: 'Redo → Back to Stage 3',
              onPressed: _isSubmitting ? null : _handleRedoToStage3,
              variant: ButtonVariant.secondary,
              isLoading: _isSubmitting,
            ),
          ),
        ],

        // Waiting message for non-CS when current stage 5
        if (!widget.canEdit &&
            widget.isCurrent &&
            caseData.status != CaseStatus.closed &&
            caseData.status != CaseStatus.cancelled &&
            !authProvider.isCS) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.orange.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.orange.shade200),
            ),
            child: Text(
              '⏳ Waiting for CS to complete',
              style: TextStyle(color: Colors.orange.shade800, fontSize: 14),
            ),
          ),
        ],
      ],
    );
  }
}

