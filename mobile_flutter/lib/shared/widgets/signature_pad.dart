import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

class SignaturePad extends StatefulWidget {
  final double height;
  final ValueChanged<String>? onChanged; // data URL (data:image/png;base64,...)
  final bool enabled;

  const SignaturePad({
    super.key,
    required this.height,
    this.onChanged,
    this.enabled = true,
  });

  @override
  State<SignaturePad> createState() => _SignaturePadState();
}

class _SignaturePadState extends State<SignaturePad> {
  final List<Offset?> _points = [];
  final List<List<Offset?>> _history = []; // For undo
  final List<List<Offset?>> _redoStack = []; // For redo
  bool _isDrawing = false;

  void clear() {
    setState(() {
      if (_points.isNotEmpty) {
        _history.add(List.from(_points));
        _redoStack.clear();
        _points.clear();
        _isDrawing = false;
        widget.onChanged?.call('');
      }
    });
  }

  void undo() {
    if (_history.isEmpty) return;
    setState(() {
      final lastState = _history.removeLast();
      _redoStack.add(List.from(_points));
      _points.clear();
      _points.addAll(lastState);
      _isDrawing = false;
      _emitPng();
    });
  }

  void redo() {
    if (_redoStack.isEmpty) return;
    setState(() {
      _history.add(List.from(_points));
      final nextState = _redoStack.removeLast();
      _points.clear();
      _points.addAll(nextState);
      _isDrawing = false;
      _emitPng();
    });
  }

  Future<void> _emitPng() async {
    if (_points.isEmpty) return;

    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    final size = Size(MediaQuery.of(context).size.width, widget.height);

    // White background
    final bgPaint = Paint()..color = Colors.white;
    canvas.drawRect(Offset.zero & size, bgPaint);

    // Draw strokes
    final paint = Paint()
      ..color = Colors.black
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    for (int i = 0; i < _points.length - 1; i++) {
      final p1 = _points[i];
      final p2 = _points[i + 1];
      if (p1 != null && p2 != null) {
        canvas.drawLine(p1, p2, paint);
      }
    }

    final picture = recorder.endRecording();
    final image = await picture.toImage(size.width.toInt(), size.height.toInt());
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    if (byteData == null) return;

    final bytes = byteData.buffer.asUint8List();
    final base64Str = base64Encode(bytes);
    widget.onChanged?.call('data:image/png;base64,$base64Str');
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Toolbar with Clear, Undo, Redo buttons
        if (widget.enabled)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(8),
                topRight: Radius.circular(8),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: _points.isEmpty ? null : clear,
                  icon: const Icon(Icons.clear, size: 18),
                  label: const Text('Clear', style: TextStyle(fontSize: 12)),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    minimumSize: const Size(0, 32),
                  ),
                ),
                const SizedBox(width: 4),
                TextButton.icon(
                  onPressed: _history.isEmpty ? null : undo,
                  icon: const Icon(Icons.undo, size: 18),
                  label: const Text('Undo', style: TextStyle(fontSize: 12)),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    minimumSize: const Size(0, 32),
                  ),
                ),
                const SizedBox(width: 4),
                TextButton.icon(
                  onPressed: _redoStack.isEmpty ? null : redo,
                  icon: const Icon(Icons.redo, size: 18),
                  label: const Text('Redo', style: TextStyle(fontSize: 12)),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    minimumSize: const Size(0, 32),
                  ),
                ),
              ],
            ),
          ),
        Container(
          height: widget.height,
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: Colors.grey.shade300),
            borderRadius: widget.enabled
                ? const BorderRadius.only(
                    bottomLeft: Radius.circular(8),
                    bottomRight: Radius.circular(8),
                  )
                : BorderRadius.circular(8),
          ),
          child: ClipRRect(
            borderRadius: widget.enabled
                ? const BorderRadius.only(
                    bottomLeft: Radius.circular(8),
                    bottomRight: Radius.circular(8),
                  )
                : BorderRadius.circular(8),
            child: Listener(
              onPointerDown: widget.enabled
                  ? (event) {
                      if (!_isDrawing) {
                        _history.add(List.from(_points));
                        _redoStack.clear();
                        _isDrawing = true;
                      }
                      setState(() {
                        _points.add(event.localPosition);
                      });
                    }
                  : null,
              onPointerMove: widget.enabled
                  ? (event) {
                      if (_isDrawing) {
                        setState(() {
                          _points.add(event.localPosition);
                        });
                      }
                    }
                  : null,
              onPointerUp: widget.enabled
                  ? (_) async {
                      setState(() {
                        _points.add(null);
                        _isDrawing = false;
                      });
                      await _emitPng();
                    }
                  : null,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                child: CustomPaint(
                  painter: _SignaturePainter(points: _points),
                  child: const SizedBox.expand(),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _SignaturePainter extends CustomPainter {
  final List<Offset?> points;
  _SignaturePainter({required this.points});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round;

    for (int i = 0; i < points.length - 1; i++) {
      final p1 = points[i];
      final p2 = points[i + 1];
      if (p1 != null && p2 != null) {
        canvas.drawLine(p1, p2, paint);
      }
    }
  }

  @override
  bool shouldRepaint(_SignaturePainter oldDelegate) => oldDelegate.points != points;
}


