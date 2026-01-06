import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/toast_provider.dart';
import 'toast.dart';

class ToastContainer extends StatelessWidget {
  const ToastContainer({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ToastProvider>(
      builder: (context, toastProvider, child) {
        if (toastProvider.toasts.isEmpty) {
          return const SizedBox.shrink();
        }

        return Positioned(
          top: 16,
          right: 16,
          left: 16,
          child: SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: toastProvider.toasts.map((toastData) {
                return Toast(
                  key: ValueKey(toastData.id),
                  message: toastData.message,
                  type: toastData.type,
                  duration: toastData.duration,
                  onClose: () {
                    toastProvider.removeToast(toastData.id);
                  },
                );
              }).toList(),
            ),
          ),
        );
      },
    );
  }
}

