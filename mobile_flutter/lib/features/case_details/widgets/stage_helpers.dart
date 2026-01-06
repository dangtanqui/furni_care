import 'package:flutter/material.dart';
import '../../../core/api/models/case_models.dart';
import '../../../shared/widgets/image_viewer.dart';

class StageHelpers {
  static Widget buildInfoRow(String label, String value) {
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
  
  static Widget buildAttachmentsGrid(BuildContext context, List<CaseAttachment> attachments) {
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
  }
  
  static Widget buildChecklist(List<String> items, List<bool> checklist) {
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
}

