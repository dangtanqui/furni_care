import 'dart:io';
import 'package:flutter/foundation.dart';

/// Custom HttpOverrides to bypass SSL certificate verification in debug mode
/// This is needed for Image.network to load images from servers with self-signed certificates
class MyHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    final client = super.createHttpClient(context);
    // Only bypass SSL verification in debug mode
    if (kDebugMode) {
      client.badCertificateCallback = (X509Certificate cert, String host, int port) => true;
    }
    return client;
  }
}

