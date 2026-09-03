import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/main_navigation_screen.dart';
import 'screens/memory_progress_screen.dart';
import 'screens/location_screen.dart';

// =============================================================================
// SIH 2026: AI-Based Cognitive Gaming & Memory Assistance Platform
// Module: Caregiver Dashboard (Flutter + Material 3 + Firebase Ready)
// =============================================================================
//
// To enable Firebase Authentication & Cloud Firestore:
// 1. Add `google-services.json` (Android) or `GoogleService-Info.plist` (iOS).
// 2. Uncomment firebase packages in pubspec.yaml:
//    - firebase_core
//    - cloud_firestore
//    - firebase_auth
// 3. Initialize in main():
//    ```dart
//    WidgetsFlutterBinding.ensureInitialized();
//    await Firebase.initializeApp();
//    ```
// =============================================================================

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const CaregiverDashboardApp());
}

class CaregiverDashboardApp extends StatelessWidget {
  const CaregiverDashboardApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Caregiver Dashboard - Dementia Care',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      initialRoute: '/',
      routes: {
        '/': (context) => const MainNavigationScreen(),
        '/memory-progress': (context) => const MemoryProgressScreen(),
        '/location': (context) => const LocationMonitoringScreen(),
      },
    );
  }
}
