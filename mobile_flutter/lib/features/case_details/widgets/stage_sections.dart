import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/api/models/case_models.dart';
import '../../../features/auth/providers/auth_provider.dart';
import 'stage_1_content.dart';
import 'stage_2_content.dart';
import 'stage_3_content.dart';
import 'stage_4_content.dart';
import 'stage_5_content.dart';

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
  
  @override
  void initState() {
    super.initState();
    // Expand current stage by default
    _expandedStages[widget.caseData.currentStage] = true;
  }
  
  @override
  void didUpdateWidget(StageSections oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Update expanded stages when case data changes (e.g., after stage completion)
    if (widget.caseData.currentStage != oldWidget.caseData.currentStage) {
      setState(() {
        // Close all stages
        for (int i = 1; i <= 5; i++) {
          _expandedStages[i] = false;
        }
        // Open new current stage
        _expandedStages[widget.caseData.currentStage] = true;
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
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    switch (stage) {
      case 1:
        final isCurrent = caseData.currentStage == 1;
        final canEdit = authProvider.isCS && 
                       caseData.status != CaseStatus.closed && 
                       caseData.status != CaseStatus.cancelled;
        return Stage1Content(
          caseData: caseData,
          isCurrent: isCurrent,
          canEdit: canEdit,
          onStageAdvanced: () {
            // Close stage 1 and expand stage 2 after advancing
            setState(() {
              _expandedStages[1] = false; // Close stage 1
              _expandedStages[2] = true; // Open stage 2
            });
          },
          onStageUpdated: (targetStage) {
            // Close all stages, then expand target stage after update
            setState(() {
              for (int i = 1; i <= 5; i++) {
                _expandedStages[i] = false;
              }
              _expandedStages[targetStage] = true;
            });
          },
        );
      case 2:
        final isCurrent = caseData.currentStage == 2;
        final currentUserId = authProvider.user?.id;
        // Check both assignedToId and assignedTo.id (like frontend checks assigned_to?.id)
        final assignedToId = caseData.assignedToId ?? caseData.assignedTo?.id;
        // Only allow edit if currentStage >= stage (stage has been reached) and stage <= currentStage (cannot edit future stages)
        final canEdit = caseData.currentStage >= 2 &&
                       caseData.currentStage <= 2 &&
                       caseData.status != CaseStatus.closed && 
                       caseData.status != CaseStatus.cancelled &&
                       assignedToId != null &&
                       currentUserId != null &&
                       authProvider.isTechnician &&
                       assignedToId == currentUserId;
        
        print('🔵 [STAGE2 PERMISSION] Checking edit permission');
        print('   currentStage: ${caseData.currentStage}, isCurrent: $isCurrent');
        print('   caseData.assignedToId: ${caseData.assignedToId}');
        print('   caseData.assignedTo?.id: ${caseData.assignedTo?.id}');
        print('   assignedToId (final): $assignedToId');
        print('   currentUserId: $currentUserId');
        print('   isTechnician: ${authProvider.isTechnician}');
        print('   status: ${caseData.status}');
        print('   canEdit: $canEdit');
        print('   Match check: assignedToId == currentUserId = ${assignedToId == currentUserId}');
        
        return Stage2Content(
          caseData: caseData,
          isCurrent: isCurrent,
          canEdit: canEdit,
          onStageAdvanced: () {
            // Close all stages and open Stage 3
            setState(() {
              for (int i = 1; i <= 5; i++) {
                _expandedStages[i] = false;
              }
              _expandedStages[3] = true;
            });
          },
          onStageUpdated: (targetStage) {
            // Close all stages and open target stage
            setState(() {
              for (int i = 1; i <= 5; i++) {
                _expandedStages[i] = false;
              }
              _expandedStages[targetStage] = true;
            });
          },
        );
      case 3:
        final isCurrent = caseData.currentStage == 3;
        final currentUserId = authProvider.user?.id;
        // Check both assignedToId and assignedTo.id (like frontend checks assigned_to?.id)
        final assignedToId = caseData.assignedToId ?? caseData.assignedTo?.id;
        // Only allow edit if currentStage >= stage (stage has been reached) and stage <= currentStage (cannot edit future stages)
        // Stage 3: Only check if technician is assigned, don't require exact match
        final canEdit = caseData.currentStage >= 3 &&
                       caseData.currentStage <= 3 &&
                       caseData.status != CaseStatus.closed && 
                       caseData.status != CaseStatus.cancelled &&
                       assignedToId != null &&
                       currentUserId != null &&
                       authProvider.isTechnician;
        
        print('🔵 [STAGE3 PERMISSION] Checking edit permission');
        print('   currentStage: ${caseData.currentStage}, isCurrent: $isCurrent');
        print('   caseData.assignedToId: ${caseData.assignedToId}');
        print('   caseData.assignedTo?.id: ${caseData.assignedTo?.id}');
        print('   assignedToId (final): $assignedToId');
        print('   currentUserId: $currentUserId');
        print('   isTechnician: ${authProvider.isTechnician}');
        print('   status: ${caseData.status}');
        print('   canEdit: $canEdit');
        
        return Stage3Content(
          caseData: caseData,
          isCurrent: isCurrent,
          canEdit: canEdit,
          onStageAdvanced: () {
            // Close all stages and open Stage 4
            setState(() {
              for (int i = 1; i <= 5; i++) {
                _expandedStages[i] = false;
              }
              _expandedStages[4] = true;
            });
          },
          onStageUpdated: (targetStage) {
            // Close all stages and open target stage
            setState(() {
              for (int i = 1; i <= 5; i++) {
                _expandedStages[i] = false;
              }
              _expandedStages[targetStage] = true;
            });
          },
        );
      case 4:
        final isCurrent = caseData.currentStage == 4;
        final currentUserId = authProvider.user?.id;
        // Check both assignedToId and assignedTo.id (like frontend checks assigned_to?.id)
        final assignedToId = caseData.assignedToId ?? caseData.assignedTo?.id;
        // Only allow edit if currentStage >= stage (stage has been reached) and stage <= currentStage (cannot edit future stages)
        final canEdit = caseData.currentStage >= 4 &&
                       caseData.currentStage <= 4 &&
                       caseData.status != CaseStatus.closed && 
                       caseData.status != CaseStatus.cancelled &&
                       assignedToId != null &&
                       currentUserId != null &&
                       authProvider.isTechnician &&
                       assignedToId == currentUserId;
        
        print('🔵 [STAGE4 PERMISSION] Checking edit permission');
        print('   currentStage: ${caseData.currentStage}, isCurrent: $isCurrent');
        print('   caseData.assignedToId: ${caseData.assignedToId}');
        print('   caseData.assignedTo?.id: ${caseData.assignedTo?.id}');
        print('   assignedToId (final): $assignedToId');
        print('   currentUserId: $currentUserId');
        print('   isTechnician: ${authProvider.isTechnician}');
        print('   status: ${caseData.status}');
        print('   canEdit: $canEdit');
        print('   Match check: assignedToId == currentUserId = ${assignedToId == currentUserId}');
        
        return Stage4Content(
          caseData: caseData,
          isCurrent: isCurrent,
          canEdit: canEdit,
          onStageAdvanced: () {
            // Close all stages and open Stage 5
            setState(() {
              for (int i = 1; i <= 5; i++) {
                _expandedStages[i] = false;
              }
              _expandedStages[5] = true;
            });
          },
          onStageUpdated: (targetStage) {
            // Close all stages and open target stage
            setState(() {
              for (int i = 1; i <= 5; i++) {
                _expandedStages[i] = false;
              }
              _expandedStages[targetStage] = true;
            });
          },
        );
      case 5:
        final isCurrent = caseData.currentStage == 5;
        // Only allow edit if currentStage >= 5 (stage has been reached) and stage <= currentStage (cannot edit future stages)
        final canEdit = caseData.currentStage >= 5 &&
                       caseData.currentStage <= 5 &&
                       authProvider.isCS &&
                       caseData.status != CaseStatus.closed &&
                       caseData.status != CaseStatus.cancelled;
        return Stage5Content(
          caseData: caseData,
          isCurrent: isCurrent,
          canEdit: canEdit,
          onStageClosed: () {
            // Close accordion when case is closed
            setState(() {
              for (int i = 1; i <= 5; i++) {
                _expandedStages[i] = false;
              }
            });
          },
          onRedoToStage3: () {
            setState(() {
              for (int i = 1; i <= 5; i++) {
                _expandedStages[i] = false;
              }
              _expandedStages[3] = true;
            });
          },
        );
      default:
        return const SizedBox.shrink();
    }
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
          child: Theme(
            data: Theme.of(context).copyWith(
              dividerColor: Colors.transparent, // Remove divider line
            ),
            child: ExpansionTile(
              key: ValueKey('stage-$stage-${_expandedStages[stage]}'),
              tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.all(Radius.circular(12)),
              ),
              collapsedShape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.all(Radius.circular(12)),
              ),
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
                  // Badge for Current/Completed
                  if (isCompleted || isCurrent)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isCompleted
                            ? Colors.green.shade50
                            : const Color(0xFF0d9488).withOpacity(0.1), // Teal background
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        isCompleted ? 'Completed' : 'Current',
                        style: TextStyle(
                          fontSize: 12,
                          color: isCompleted
                              ? Colors.green.shade700
                              : const Color(0xFF0d9488), // Teal text
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
                  // Always close all other stages when opening any stage
                  for (int i = 1; i <= 5; i++) {
                    if (i != stage) {
                      _expandedStages[i] = false;
                    }
                  }
                  // Set current stage expanded state
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
                    child: _buildStageContent(stage),
                  ),
                ),
              ],
            ),
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
