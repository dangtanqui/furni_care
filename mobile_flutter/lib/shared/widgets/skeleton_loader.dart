import 'package:flutter/material.dart';

class SkeletonLoader extends StatelessWidget {
  final double? width;
  final double? height;
  final bool isCircular;
  
  const SkeletonLoader({
    super.key,
    this.width,
    this.height,
    this.isCircular = false,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey.shade300,
        borderRadius: isCircular
            ? BorderRadius.circular(width != null ? width! / 2 : 16)
            : BorderRadius.circular(4),
      ),
    );
  }
}

