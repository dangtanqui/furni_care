import 'package:flutter/material.dart';

enum ButtonVariant {
  primary,
  secondary,
  tertiary,
}

class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final bool isLoading;
  final bool isDisabled;
  final IconData? leftIcon;
  final IconData? rightIcon;
  
  const AppButton({
    super.key,
    required this.text,
    this.onPressed,
    this.variant = ButtonVariant.primary,
    this.isLoading = false,
    this.isDisabled = false,
    this.leftIcon,
    this.rightIcon,
  });
  
  @override
  Widget build(BuildContext context) {
    final isEnabled = !isLoading && !isDisabled && onPressed != null;
    
    Color backgroundColor;
    Color textColor;
    
    switch (variant) {
      case ButtonVariant.primary:
        backgroundColor = isEnabled ? const Color(0xFF0d9488) : Colors.grey;
        textColor = Colors.white;
        break;
      case ButtonVariant.secondary:
        backgroundColor = isEnabled ? Colors.white : Colors.grey.shade200;
        textColor = isEnabled ? const Color(0xFF0d9488) : Colors.grey;
        break;
      case ButtonVariant.tertiary:
        backgroundColor = Colors.transparent;
        textColor = isEnabled ? const Color(0xFF1e3a5f) : Colors.grey;
        break;
    }
    
    return ElevatedButton(
      onPressed: isEnabled ? onPressed : null,
      style: ElevatedButton.styleFrom(
        backgroundColor: backgroundColor,
        foregroundColor: textColor,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999),
        ),
        elevation: variant == ButtonVariant.primary ? 2 : 0,
      ),
      child: isLoading
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            )
          : Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (leftIcon != null) ...[
                  Icon(leftIcon, size: 18),
                  const SizedBox(width: 8),
                ],
                Text(text),
                if (rightIcon != null) ...[
                  const SizedBox(width: 8),
                  Icon(rightIcon, size: 18),
                ],
              ],
            ),
    );
  }
}

