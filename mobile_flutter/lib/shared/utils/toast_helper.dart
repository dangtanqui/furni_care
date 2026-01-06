import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/toast_provider.dart';

/// Helper class to easily show toast notifications
class ToastHelper {
  static ToastProvider _getProvider(BuildContext context) {
    return Provider.of<ToastProvider>(context, listen: false);
  }

  static void showSuccess(BuildContext context, String message, {Duration? duration}) {
    _getProvider(context).showSuccess(message, duration: duration);
  }

  static void showError(BuildContext context, String message, {Duration? duration}) {
    _getProvider(context).showError(message, duration: duration);
  }

  static void showWarning(BuildContext context, String message, {Duration? duration}) {
    _getProvider(context).showWarning(message, duration: duration);
  }

  static void showInfo(BuildContext context, String message, {Duration? duration}) {
    _getProvider(context).showInfo(message, duration: duration);
  }
}

