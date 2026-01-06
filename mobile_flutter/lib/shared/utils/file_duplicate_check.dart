import 'dart:io';
import '../utils/toast_helper.dart';
import 'package:flutter/material.dart';

/// Utility function to filter duplicate image files
/// Uses file name, size, and lastModified to identify duplicates
/// Only applies to images (not non-image files)
/// 
/// [filePaths] - Array of file paths to check
/// [processedFiles] - Set of processed file keys (name-size-lastModified)
/// [context] - BuildContext for showing toast
/// [showError] - Function to show error toast (optional, uses ToastHelper if not provided)
/// 
/// Returns list of unique file paths (duplicates filtered out)
List<String> filterDuplicateFiles(
  List<String> filePaths,
  Set<String> processedFiles,
  BuildContext context, {
  Function(String)? showError,
}) {
  if (filePaths.isEmpty) return [];

  // Helper function to check if file is an image
  bool isImageFile(String filePath) {
    final ext = filePath.toLowerCase().split('.').last;
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].contains(ext);
  }

  // Helper function to create file key
  String? createFileKey(String filePath) {
    if (!isImageFile(filePath)) return null; // Only create key for images
    
    try {
      final file = File(filePath);
      if (!file.existsSync()) return null;
      
      final stat = file.statSync();
      final fileName = filePath.split('/').last;
      return '$fileName-${stat.size}-${stat.modified.millisecondsSinceEpoch}';
    } catch (e) {
      return null; // If we can't get file info, allow it through
    }
  }

  // Count duplicates
  int duplicateCount = 0;
  final uniqueFiles = <String>[];

  for (final filePath in filePaths) {
    if (isImageFile(filePath)) {
      final fileKey = createFileKey(filePath);
      if (fileKey != null && processedFiles.contains(fileKey)) {
        duplicateCount++;
        continue; // Skip duplicate
      }
      // Add to processed set if it's a unique image
      if (fileKey != null) {
        processedFiles.add(fileKey);
      }
    }
    // Always include non-image files and unique images
    uniqueFiles.add(filePath);
  }

  // Show error for duplicates
  if (duplicateCount > 0) {
    final errorFn = showError ?? (String message) => ToastHelper.showError(context, message);
    errorFn('Duplicate image detected. Please upload a different image.');
  }

  return uniqueFiles;
}

