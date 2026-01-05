import 'package:flutter/material.dart';
import 'dart:io';

class ImageViewer extends StatelessWidget {
  final List<String> imagePaths;
  final int initialIndex;
  final VoidCallback onClose;

  const ImageViewer({
    super.key,
    required this.imagePaths,
    required this.initialIndex,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return ImageViewerStateful(
      imagePaths: imagePaths,
      initialIndex: initialIndex,
      onClose: onClose,
    );
  }
}

class ImageViewerStateful extends StatefulWidget {
  final List<String> imagePaths;
  final int initialIndex;
  final VoidCallback onClose;

  const ImageViewerStateful({
    super.key,
    required this.imagePaths,
    required this.initialIndex,
    required this.onClose,
  });

  @override
  State<ImageViewerStateful> createState() => _ImageViewerStatefulState();
}

class _ImageViewerStatefulState extends State<ImageViewerStateful> {
  late PageController _pageController;
  late TransformationController _transformationController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
    _transformationController = TransformationController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _transformationController.dispose();
    super.dispose();
  }

  void _handlePrevious() {
    _resetZoom();
    if (_currentIndex > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _pageController.jumpToPage(widget.imagePaths.length - 1);
    }
  }

  void _handleNext() {
    _resetZoom();
    if (_currentIndex < widget.imagePaths.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _pageController.jumpToPage(0);
    }
  }

  void _resetZoom() {
    _transformationController.value = Matrix4.identity();
  }

  void _zoomIn(BuildContext context) {
    final currentScale = _transformationController.value.getMaxScaleOnAxis();
    if (currentScale < 4.0) {
      final newScale = (currentScale + 0.5).clamp(0.5, 4.0);
      final screenSize = MediaQuery.of(context).size;
      final focalPoint = Offset(screenSize.width / 2, screenSize.height / 2);
      _transformationController.value = Matrix4.identity()
        ..translate(focalPoint.dx, focalPoint.dy)
        ..scale(newScale)
        ..translate(-focalPoint.dx, -focalPoint.dy);
    }
  }

  void _zoomOut(BuildContext context) {
    final currentScale = _transformationController.value.getMaxScaleOnAxis();
    if (currentScale > 0.5) {
      final newScale = (currentScale - 0.5).clamp(0.5, 4.0);
      final screenSize = MediaQuery.of(context).size;
      final focalPoint = Offset(screenSize.width / 2, screenSize.height / 2);
      _transformationController.value = Matrix4.identity()
        ..translate(focalPoint.dx, focalPoint.dy)
        ..scale(newScale)
        ..translate(-focalPoint.dx, -focalPoint.dy);
    }
  }

  void _handleClose() {
    _resetZoom();
    widget.onClose();
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        _handleClose();
        return true;
      },
      child: Scaffold(
        backgroundColor: Colors.black.withOpacity(0.95),
        body: Stack(
          children: [
            // Image viewer - placed first so buttons are on top
            Center(
              child: PageView.builder(
                controller: _pageController,
                itemCount: widget.imagePaths.length,
                onPageChanged: (index) {
                  _resetZoom();
                  setState(() {
                    _currentIndex = index;
                  });
                },
                itemBuilder: (context, index) {
                  final path = widget.imagePaths[index];
                  final isUrl = path.startsWith('http://') || path.startsWith('https://');
                  return InteractiveViewer(
                    transformationController: _transformationController,
                    minScale: 0.5,
                    maxScale: 4.0,
                    child: Center(
                      child: isUrl
                          ? Image.network(
                              path,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) {
                                return const Icon(
                                  Icons.broken_image,
                                  color: Colors.white,
                                  size: 64,
                                );
                              },
                            )
                          : File(path).existsSync()
                              ? Image.file(
                                  File(path),
                                  fit: BoxFit.contain,
                                )
                              : const Icon(
                                  Icons.broken_image,
                                  color: Colors.white,
                                  size: 64,
                                ),
                    ),
                  );
                },
              ),
            ),

            // Close button - placed after image viewer to be on top
            Positioned(
              top: MediaQuery.of(context).padding.top + 16,
              right: 16,
              child: GestureDetector(
                onTap: _handleClose,
                behavior: HitTestBehavior.opaque,
                child: Container(
                  padding: const EdgeInsets.all(8.0),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.close, color: Colors.white, size: 28),
                ),
              ),
            ),

            // Zoom controls - placed after image viewer to be on top
            Positioned(
              top: MediaQuery.of(context).padding.top + 16,
              left: 16,
              child: Row(
                children: [
                  // Zoom out
                  GestureDetector(
                    onTap: () => _zoomOut(context),
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      padding: const EdgeInsets.all(8.0),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.remove, color: Colors.white, size: 24),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Reset zoom
                  GestureDetector(
                    onTap: _resetZoom,
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      padding: const EdgeInsets.all(8.0),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.fit_screen, color: Colors.white, size: 24),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Zoom in
                  GestureDetector(
                    onTap: () => _zoomIn(context),
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      padding: const EdgeInsets.all(8.0),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.add, color: Colors.white, size: 24),
                    ),
                  ),
                ],
              ),
            ),

            // Navigation buttons - placed after image viewer to be on top
            if (widget.imagePaths.length > 1) ...[
              // Previous button
              Positioned(
                left: 16,
                top: 0,
                bottom: 0,
                child: Center(
                  child: GestureDetector(
                    onTap: _handlePrevious,
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      padding: const EdgeInsets.all(8.0),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.chevron_left, color: Colors.white, size: 32),
                    ),
                  ),
                ),
              ),
              // Next button
              Positioned(
                right: 16,
                top: 0,
                bottom: 0,
                child: Center(
                  child: GestureDetector(
                    onTap: _handleNext,
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      padding: const EdgeInsets.all(8.0),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.chevron_right, color: Colors.white, size: 32),
                    ),
                  ),
                ),
              ),
            ],

            // Image counter
            if (widget.imagePaths.length > 1)
              Positioned(
                bottom: MediaQuery.of(context).padding.bottom + 16,
                left: 0,
                right: 0,
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${_currentIndex + 1} / ${widget.imagePaths.length}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
