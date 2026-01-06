import 'package:flutter/material.dart';
import '../../../core/api/models/case_models.dart';
import '../../../shared/widgets/image_viewer.dart';
import 'stage_helpers.dart';

class Stage2Content extends StatelessWidget {
  final CaseDetail caseData;
  
  const Stage2Content({
    super.key,
    required this.caseData,
  });
  
  @override
  Widget build(BuildContext context) {
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
        StageHelpers.buildInfoRow('Investigation Report', caseData.investigationReport ?? 'No report yet'),
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
        StageHelpers.buildChecklist(checklistItems, checklist),
        if (caseData.rootCause != null) ...[
          const SizedBox(height: 16),
          StageHelpers.buildInfoRow('Root Cause', caseData.rootCause!),
        ],
      ],
    );
  }
}

