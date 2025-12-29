import 'package:flutter/material.dart';
import '../../../core/api/models/case_models.dart';

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
  
  Color _getStageColor(int stage, int currentStage) {
    if (stage < currentStage) {
      return Colors.green;
    } else if (stage == currentStage) {
      return Colors.blue;
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInfoRow('Description', caseData.description),
        if (caseData.stageAttachments?['case_creation'] != null &&
            caseData.stageAttachments!['case_creation']!.isNotEmpty) ...[
          const SizedBox(height: 12),
          const Text(
            'Attachments:',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          ...caseData.stageAttachments!['case_creation']!.map((attachment) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                '- ${attachment.filename}',
                style: TextStyle(color: Colors.grey.shade700),
              ),
            );
          }),
        ],
      ],
    );
  }
  
  Widget _buildStage2Content(CaseDetail caseData) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (caseData.investigationReport != null)
          _buildInfoRow('Investigation Report', caseData.investigationReport!),
        if (caseData.investigationChecklist != null) ...[
          const SizedBox(height: 12),
          const Text(
            'Investigation Checklist:',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            caseData.investigationChecklist!,
            style: TextStyle(color: Colors.grey.shade700),
          ),
        ],
        if (caseData.rootCause != null)
          _buildInfoRow('Root Cause', caseData.rootCause!),
        if (caseData.stageAttachments?['investigation'] != null &&
            caseData.stageAttachments!['investigation']!.isNotEmpty) ...[
          const SizedBox(height: 12),
          const Text(
            'Attachments:',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          ...caseData.stageAttachments!['investigation']!.map((attachment) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                '- ${attachment.filename}',
                style: TextStyle(color: Colors.grey.shade700),
              ),
            );
          }),
        ],
      ],
    );
  }
  
  Widget _buildStage3Content(CaseDetail caseData) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (caseData.solutionDescription != null)
          _buildInfoRow('Solution Description', caseData.solutionDescription!),
        if (caseData.solutionChecklist != null) ...[
          const SizedBox(height: 12),
          const Text(
            'Solution Checklist:',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            caseData.solutionChecklist!,
            style: TextStyle(color: Colors.grey.shade700),
          ),
        ],
        if (caseData.plannedExecutionDate != null)
          _buildInfoRow('Planned Execution Date', caseData.plannedExecutionDate!),
        if (caseData.costRequired == true) ...[
          const SizedBox(height: 12),
          const Text(
            'Cost Information:',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          if (caseData.estimatedCost != null)
            _buildInfoRow('Estimated Cost', caseData.estimatedCost!.toString()),
          if (caseData.costDescription != null)
            _buildInfoRow('Cost Description', caseData.costDescription!),
          if (caseData.costStatus != null)
            _buildInfoRow('Cost Status', caseData.costStatus.toString().split('.').last),
        ],
        if (caseData.stageAttachments?['solution'] != null &&
            caseData.stageAttachments!['solution']!.isNotEmpty) ...[
          const SizedBox(height: 12),
          const Text(
            'Attachments:',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          ...caseData.stageAttachments!['solution']!.map((attachment) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                '- ${attachment.filename}',
                style: TextStyle(color: Colors.grey.shade700),
              ),
            );
          }),
        ],
      ],
    );
  }
  
  Widget _buildStage4Content(CaseDetail caseData) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (caseData.executionReport != null)
          _buildInfoRow('Execution Report', caseData.executionReport!),
        if (caseData.executionChecklist != null) ...[
          const SizedBox(height: 12),
          const Text(
            'Execution Checklist:',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            caseData.executionChecklist!,
            style: TextStyle(color: Colors.grey.shade700),
          ),
        ],
        if (caseData.stageAttachments?['execution'] != null &&
            caseData.stageAttachments!['execution']!.isNotEmpty) ...[
          const SizedBox(height: 12),
          const Text(
            'Attachments:',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          ...caseData.stageAttachments!['execution']!.map((attachment) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                '- ${attachment.filename}',
                style: TextStyle(color: Colors.grey.shade700),
              ),
            );
          }),
        ],
      ],
    );
  }
  
  Widget _buildStage5Content(CaseDetail caseData) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (caseData.clientSignature != null) ...[
          const Text(
            'Client Signature:',
            style: TextStyle(fontWeight: FontWeight.bold),
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
          const SizedBox(height: 12),
        ],
        if (caseData.clientFeedback != null)
          _buildInfoRow('Client Feedback', caseData.clientFeedback!),
        if (caseData.clientRating != null)
          _buildInfoRow('Client Rating', caseData.clientRating.toString()),
        if (caseData.csNotes != null)
          _buildInfoRow('CS Notes', caseData.csNotes!),
        if (caseData.finalFeedback != null)
          _buildInfoRow('Final Feedback', caseData.finalFeedback!),
        if (caseData.finalRating != null)
          _buildInfoRow('Final Rating', caseData.finalRating.toString()),
        if (caseData.finalCost != null)
          _buildInfoRow('Final Cost', caseData.finalCost.toString()),
        if (caseData.finalCostStatus != null)
          _buildInfoRow('Final Cost Status', caseData.finalCostStatus.toString().split('.').last),
        if (caseData.stageAttachments?['closing'] != null &&
            caseData.stageAttachments!['closing']!.isNotEmpty) ...[
          const SizedBox(height: 12),
          const Text(
            'Attachments:',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          ...caseData.stageAttachments!['closing']!.map((attachment) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                '- ${attachment.filename}',
                style: TextStyle(color: Colors.grey.shade700),
              ),
            );
          }),
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
          child: ExpansionTile(
            leading: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _getStageColor(stage, widget.caseData.currentStage),
              ),
              child: Center(
                child: isCompleted
                    ? const Icon(Icons.check, color: Colors.white, size: 20)
                    : Text(
                        '$stage',
                        style: TextStyle(
                          color: isCurrent ? Colors.white : Colors.grey.shade600,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
            title: Text(
              'Stage $stage: ${_getStageName(stage)}',
              style: TextStyle(
                fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                color: isCurrent ? Colors.blue : Colors.black,
              ),
            ),
            subtitle: Text(
              isCompleted
                  ? 'Completed'
                  : isCurrent
                      ? 'Current Stage'
                      : 'Not Started',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
            initiallyExpanded: _expandedStages[stage] ?? false,
            onExpansionChanged: (expanded) {
              setState(() {
                _expandedStages[stage] = expanded;
              });
            },
            children: [
              Padding(
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
        return caseData.description.isNotEmpty ||
            (caseData.stageAttachments?['case_creation'] != null &&
                caseData.stageAttachments!['case_creation']!.isNotEmpty);
      case 2:
        return caseData.investigationReport != null ||
            caseData.investigationChecklist != null ||
            caseData.rootCause != null ||
            (caseData.stageAttachments?['investigation'] != null &&
                caseData.stageAttachments!['investigation']!.isNotEmpty);
      case 3:
        return caseData.solutionDescription != null ||
            caseData.solutionChecklist != null ||
            caseData.plannedExecutionDate != null ||
            caseData.costRequired == true ||
            (caseData.stageAttachments?['solution'] != null &&
                caseData.stageAttachments!['solution']!.isNotEmpty);
      case 4:
        return caseData.executionReport != null ||
            caseData.executionChecklist != null ||
            (caseData.stageAttachments?['execution'] != null &&
                caseData.stageAttachments!['execution']!.isNotEmpty);
      case 5:
        return caseData.clientSignature != null ||
            caseData.clientFeedback != null ||
            caseData.clientRating != null ||
            caseData.csNotes != null ||
            caseData.finalFeedback != null ||
            caseData.finalRating != null ||
            caseData.finalCost != null ||
            (caseData.stageAttachments?['closing'] != null &&
                caseData.stageAttachments!['closing']!.isNotEmpty);
      default:
        return false;
    }
  }
}

