import 'package:flutter/material.dart';
import '../widgets/toast.dart';

class ToastData {
  final String id;
  final String message;
  final ToastType type;
  final Duration duration;

  ToastData({
    required this.id,
    required this.message,
    required this.type,
    this.duration = const Duration(seconds: 5),
  });
}

class ToastProvider extends ChangeNotifier {
  final List<ToastData> _toasts = [];
  Map<String, DateTime> _lastToastTimes = {};

  List<ToastData> get toasts => _toasts;

  void _addToast(ToastType type, String message, Duration? duration) {
    // Prevent duplicate toasts with same message within 500ms
    final now = DateTime.now();
    if (_lastToastTimes.containsKey(message)) {
      final lastTime = _lastToastTimes[message]!;
      if (now.difference(lastTime).inMilliseconds < 500) {
        return;
      }
    }
    _lastToastTimes[message] = now;

    final id = 'toast-${DateTime.now().millisecondsSinceEpoch}-${_toasts.length}';
    _toasts.add(ToastData(
      id: id,
      message: message,
      type: type,
      duration: duration ?? const Duration(seconds: 5),
    ));
    notifyListeners();
  }

  void removeToast(String id) {
    _toasts.removeWhere((toast) => toast.id == id);
    notifyListeners();
  }

  void showSuccess(String message, {Duration? duration}) {
    _addToast(ToastType.success, message, duration);
  }

  void showError(String message, {Duration? duration}) {
    _addToast(ToastType.error, message, duration);
  }

  void showWarning(String message, {Duration? duration}) {
    _addToast(ToastType.warning, message, duration);
  }

  void showInfo(String message, {Duration? duration}) {
    _addToast(ToastType.info, message, duration);
  }
}

