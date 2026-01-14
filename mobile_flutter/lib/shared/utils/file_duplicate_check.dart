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
      print('🔍 [DUPLICATE CHECK] File: ${filePath.split('/').last}, Key: $fileKey');
      print('🔍 [DUPLICATE CHECK] Processed files count: ${processedFiles.length}');
      
      if (fileKey != null) {
        final file = File(filePath);
        if (file.existsSync()) {
          final stat = file.statSync();
          final fileSize = stat.size;
          
          // Since iOS creates different file names for same image, check by size only
          // Also check existing processed files by size
          bool isDuplicate = false;
          for (final processedKey in processedFiles) {
            // Extract size from processed key (format: name-size-timestamp or name-size)
            final parts = processedKey.split('-');
            if (parts.length >= 2) {
              try {
                final processedSize = int.tryParse(parts[parts.length - 2]); // Second to last part is usually size
                if (processedSize == fileSize) {
                  isDuplicate = true;
                  print('❌ [DUPLICATE CHECK] DUPLICATE DETECTED by size!');
                  print('   Current file size: $fileSize');
                  print('   Matched processed key: $processedKey');
                  break;
                }
              } catch (e) {
                // Continue checking other keys
              }
            }
          }
          
          if (isDuplicate) {
            duplicateCount++;
            continue; // Skip duplicate
          }
          
          print('✅ [DUPLICATE CHECK] Unique file (size: $fileSize), adding to processed set');
          // Add key with size for future checking
          processedFiles.add(fileKey);
          // Also add size-only key for easier matching
          processedFiles.add('size-$fileSize');
        }
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

