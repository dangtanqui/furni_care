/**
 * Utility function to filter duplicate image files
 * Uses file name, size, and lastModified to identify duplicates
 * @param files Array of files to check
 * @param processedFilesRef Reference to Set of processed file keys
 * @param showError Function to show error message
 * @returns Array of unique files (duplicates filtered out)
 */
export function filterDuplicateFiles(
  files: File[],
  processedFilesRef: React.MutableRefObject<Set<string>>,
  showError: (message: string) => void
): File[] {
  if (!files.length) return [];

  // Count duplicates
  const duplicateCount = files.filter(file => {
    if (file.type.startsWith('image/')) {
      const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
      return processedFilesRef.current.has(fileKey);
    }
    return false;
  }).length;

  // Filter out duplicates
  const uniqueFiles = files.filter(file => {
    if (file.type.startsWith('image/')) {
      const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
      if (processedFilesRef.current.has(fileKey)) {
        return false; // Skip duplicate
      }
      // Mark as processed
      processedFilesRef.current.add(fileKey);
      return true; // Include unique file
    }
    return true; // Include non-image files
  });

  // Show error for duplicates
  if (duplicateCount > 0) {
    showError('Duplicate image detected. Please upload a different image.');
  }

  return uniqueFiles;
}

