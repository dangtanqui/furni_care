import 'package:flutter/material.dart';

enum ToastType {
  success,
  error,
  warning,
  info,
}

class Toast extends StatelessWidget {
  final String message;
  final ToastType type;
  final VoidCallback onClose;
  final Duration duration;

  const Toast({
    super.key,
    required this.message,
    required this.type,
    required this.onClose,
    this.duration = const Duration(seconds: 5),
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset((1 - value) * 400, 0),
          child: Opacity(
            opacity: value,
            child: child,
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: _getBackgroundColor(),
          border: Border.all(
            color: _getBorderColor(),
            width: 1,
          ),
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _getIcon(),
              size: 20,
              color: _getIconColor(),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF111827), // gray-900
                ),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onClose,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Icon(
                  Icons.close,
                  size: 16,
                  color: Colors.grey[600],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getBackgroundColor() {
    switch (type) {
      case ToastType.success:
        return const Color(0xFFF0FDF4); // green-50
      case ToastType.error:
        return const Color(0xFFFEF2F2); // red-50
      case ToastType.warning:
        return const Color(0xFFFEFCE8); // yellow-50
      case ToastType.info:
        return const Color(0xFFEFF6FF); // blue-50
    }
  }

  Color _getBorderColor() {
    switch (type) {
      case ToastType.success:
        return const Color(0xFFBBF7D0); // green-200
      case ToastType.error:
        return const Color(0xFFFECACA); // red-200
      case ToastType.warning:
        return const Color(0xFFFDE047); // yellow-200
      case ToastType.info:
        return const Color(0xFFBFDBFE); // blue-200
    }
  }

  IconData _getIcon() {
    switch (type) {
      case ToastType.success:
        return Icons.check_circle;
      case ToastType.error:
        return Icons.error;
      case ToastType.warning:
        return Icons.warning;
      case ToastType.info:
        return Icons.info;
    }
  }

  Color _getIconColor() {
    switch (type) {
      case ToastType.success:
        return const Color(0xFF16A34A); // green-600
      case ToastType.error:
        return const Color(0xFFDC2626); // red-600
      case ToastType.warning:
        return const Color(0xFFCA8A04); // yellow-600
      case ToastType.info:
        return const Color(0xFF2563EB); // blue-600
    }
  }
}

