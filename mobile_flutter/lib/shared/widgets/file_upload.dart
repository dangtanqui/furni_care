import 'package:flutter/material.dart';
import 'dart:io';
import 'dart:ui' as ui;
import 'image_viewer.dart';

class DashedBorderPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double borderRadius;

  DashedBorderPainter({
    required this.color,
    required this.strokeWidth,
    required this.borderRadius,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final path = Path()
      ..addRRect(RRect.fromRectAndRadius(
        Rect.fromLTWH(0, 0, size.width, size.height),
        Radius.circular(borderRadius),
      ));

    final dashWidth = 5.0;
    final dashSpace = 3.0;
    final pathMetrics = path.computeMetrics();

    for (final pathMetric in pathMetrics) {
      double distance = 0;
      while (distance < pathMetric.length) {
        final extractPath = pathMetric.extractPath(distance, distance + dashWidth);
        canvas.drawPath(extractPath, paint);
        distance += dashWidth + dashSpace;
      }
    }
  }

  @override
  bool shouldRepaint(DashedBorderPainter oldDelegate) {
    return oldDelegate.color != color ||
        oldDelegate.strokeWidth != strokeWidth ||
        oldDelegate.borderRadius != borderRadius;
  }
}

class FileUpload extends StatefulWidget {
  final String label;
  final List<String> filePaths;
  final Function(String) onFileSelected;
  final Function(int) onDelete;
  final bool disabled;

  const FileUpload({
    super.key,
    required this.label,
    required this.filePaths,
    required this.onFileSelected,
    required this.onDelete,
    this.disabled = false,
  });

  @override
  State<FileUpload> createState() => _FileUploadState();
}

class _FileUploadState extends State<FileUpload> {
  int? _viewerIndex;

  void _openImageViewer(int index) {
    setState(() {
      _viewerIndex = index;
    });
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ImageViewer(
          imagePaths: widget.filePaths.where((path) {
            final ext = path.toLowerCase().split('.').last;
            return ['jpg', 'jpeg', 'png', 'gif'].contains(ext);
          }).toList(),
          initialIndex: widget.filePaths
              .where((path) {
                final ext = path.toLowerCase().split('.').last;
                return ['jpg', 'jpeg', 'png', 'gif'].contains(ext);
              })
              .toList()
              .indexOf(widget.filePaths[index]),
          onClose: () {
            Navigator.of(context).pop();
            setState(() {
              _viewerIndex = null;
            });
          },
        ),
      ),
    );
  }

  Future<void> _handleFileSelection(BuildContext context) async {
    if (widget.disabled) return;

    final option = await showModalBottomSheet<String>(
      context: context,
      builder: (BuildContext context) {
        return SafeArea(
          child: Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Choose from Gallery'),
                onTap: () => Navigator.pop(context, 'gallery'),
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt),
                title: const Text('Take Photo'),
                onTap: () => Navigator.pop(context, 'camera'),
              ),
              ListTile(
                leading: const Icon(Icons.insert_drive_file),
                title: const Text('Choose File'),
                onTap: () => Navigator.pop(context, 'file'),
              ),
            ],
          ),
        );
      },
    );

    if (option != null) {
      widget.onFileSelected(option);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(0xFF1e3a5f),
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: widget.disabled ? null : () => _handleFileSelection(context),
          child: CustomPaint(
            painter: DashedBorderPainter(
              color: Colors.grey.shade300,
              strokeWidth: 2,
              borderRadius: 8,
            ),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
            child: Column(
              children: [
                Icon(
                  Icons.upload,
                  size: 48,
                  color: widget.disabled ? Colors.grey.shade400 : Colors.grey.shade600,
                ),
                const SizedBox(height: 8),
                Text(
                  'Click to upload photos/documents',
                  style: TextStyle(
                    fontSize: 14,
                    color: widget.disabled ? Colors.grey.shade400 : Colors.grey.shade600,
                  ),
                ),
              ],
            ),
            ),
          ),
        ),
        if (widget.filePaths.isNotEmpty) ...[
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: widget.filePaths.asMap().entries.map((entry) {
              final index = entry.key;
              final path = entry.value;
              final fileName = path.split('/').last;
              final isImage = path.toLowerCase().endsWith('.jpg') ||
                  path.toLowerCase().endsWith('.jpeg') ||
                  path.toLowerCase().endsWith('.png') ||
                  path.toLowerCase().endsWith('.gif');

              return Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Stack(
                  children: [
                    GestureDetector(
                      onTap: isImage && File(path).existsSync()
                          ? () => _openImageViewer(index)
                          : null,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: isImage && File(path).existsSync()
                            ? Image.file(
                                File(path),
                                width: 100,
                                height: 100,
                                fit: BoxFit.cover,
                              )
                            : Container(
                                width: 100,
                                height: 100,
                                color: Colors.grey.shade100,
                                child: const Icon(
                                  Icons.insert_drive_file,
                                  size: 32,
                                  color: Colors.grey,
                                ),
                              ),
                      ),
                    ),
                    Positioned(
                      top: 4,
                      right: 4,
                      child: GestureDetector(
                        onTap: () => widget.onDelete(index),
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.6),
                            shape: BoxShape.circle,
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
                ),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }
}

