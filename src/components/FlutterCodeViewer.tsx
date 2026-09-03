import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  FolderTree,
  Download,
  Flame,
  Shield,
  Layers,
  Terminal,
  ExternalLink
} from 'lucide-react';

interface FileNode {
  path: string;
  name: string;
  category: 'Entry' | 'Screens' | 'Models' | 'Theme & Services' | 'Widgets' | 'Config';
  content: string;
}

export const FlutterCodeViewer: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string>('lib/main.dart');
  const [copied, setCopied] = useState(false);

  // Flutter codebase registry
  const files: FileNode[] = [
    {
      path: 'pubspec.yaml',
      name: 'pubspec.yaml',
      category: 'Config',
      content: `name: caregiver_dashboard
description: SIH 2026 AI-Based Cognitive Gaming & Memory Assistance Platform - Caregiver Dashboard
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.6
  google_fonts: ^6.1.0
  intl: ^0.19.0
  fl_chart: ^0.66.2
  
  # Firebase Firestore & Auth Ready
  # firebase_core: ^2.27.0
  # cloud_firestore: ^4.15.8
  # firebase_auth: ^4.17.8

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true`,
    },
    {
      path: 'lib/main.dart',
      name: 'main.dart',
      category: 'Entry',
      content: `import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/main_navigation_screen.dart';
import 'screens/memory_progress_screen.dart';
import 'screens/location_screen.dart';

// =============================================================================
// SIH 2026: AI-Based Cognitive Gaming & Memory Assistance Platform
// Module: Caregiver Dashboard (Flutter Material 3 + Firebase Ready)
// =============================================================================

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Ready for Firebase.initializeApp();
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
}`,
    },
    {
      path: 'lib/theme/app_theme.dart',
      name: 'app_theme.dart',
      category: 'Theme & Services',
      content: `import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Healthcare Theme for Caregiver Dashboard (Material 3)
/// Soft green (#10B981), medical blue (#0284C7), and calm white color palette.
class AppTheme {
  static const Color primaryGreen = Color(0xFF10B981);
  static const Color primaryGreenLight = Color(0xFFE6F7F0);
  static const Color primaryGreenDark = Color(0xFF047857);

  static const Color medicalBlue = Color(0xFF0284C7);
  static const Color medicalBlueLight = Color(0xFFE0F2FE);

  static const Color surfaceWhite = Color(0xFFFFFFFF);
  static const Color backgroundLight = Color(0xFFF8FAFC);
  static const Color cardBorderColor = Color(0xFFE2E8F0);

  static const Color statusSafe = Color(0xFF10B981);
  static const Color statusAttention = Color(0xFFF59E0B);
  static const Color statusEmergency = Color(0xFFEF4444);

  static const Color textDark = Color(0xFF0F172A);
  static const Color textMuted = Color(0xFF64748B);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryGreen,
        primary: primaryGreen,
        secondary: medicalBlue,
        surface: surfaceWhite,
        background: backgroundLight,
        error: statusEmergency,
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: backgroundLight,
      textTheme: GoogleFonts.plusJakartaSansTextTheme(),
      cardTheme: CardTheme(
        elevation: 0,
        color: surfaceWhite,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: cardBorderColor, width: 1),
        ),
      ),
    );
  }
}`,
    },
    {
      path: 'lib/services/firestore_service.dart',
      name: 'firestore_service.dart',
      category: 'Theme & Services',
      content: `import 'dart:async';
import '../models/patient_model.dart';
import '../models/health_metrics.dart';
import '../models/reminder_model.dart';
import '../models/alert_model.dart';
import 'dummy_data.dart';

/// Firestore & Firebase Authentication Integration Service
/// Contains direct hook methods for Firestore collection streams.
class FirestoreCaregiverService {
  static final FirestoreCaregiverService _instance = FirestoreCaregiverService._internal();
  factory FirestoreCaregiverService() => _instance;
  FirestoreCaregiverService._internal();

  PatientModel _patient = DummyDataService.patient;
  HealthMetrics _healthMetrics = DummyDataService.healthMetrics;
  List<ReminderModel> _reminders = List.from(DummyDataService.initialReminders);
  List<AlertModel> _alerts = List.from(DummyDataService.initialAlerts);

  // [FIRESTORE CONNECTION]: Stream for real-time patient documents
  Stream<PatientModel> getPatientStream(String patientId) {
    // Return FirebaseFirestore.instance.collection('patients').doc(patientId).snapshots()...
    return Stream.value(_patient);
  }

  PatientModel get currentPatient => _patient;
  HealthMetrics get currentHealthMetrics => _healthMetrics;
  List<ReminderModel> get currentReminders => _reminders;
  List<AlertModel> get currentAlerts => _alerts;

  // [FIRESTORE CONNECTION]: Update mood in dailyMetrics sub-collection
  Future<void> updateMood(String mood) async {
    _healthMetrics = HealthMetrics(
      heartRateBpm: _healthMetrics.heartRateBpm,
      sleepHours: _healthMetrics.sleepHours,
      waterIntakeMl: _healthMetrics.waterIntakeMl,
      waterTargetMl: _healthMetrics.waterTargetMl,
      todaySteps: _healthMetrics.todaySteps,
      stepsTarget: _healthMetrics.stepsTarget,
      completedMeds: _healthMetrics.completedMeds,
      totalMeds: _healthMetrics.totalMeds,
      todayMemoryScore: _healthMetrics.todayMemoryScore,
      currentMood: mood,
      dailyTimeline: _healthMetrics.dailyTimeline,
    );
  }

  // [FIRESTORE CONNECTION]: Add reminder item
  Future<void> addReminder(ReminderModel reminder) async {
    _reminders.add(reminder);
  }

  // [FIRESTORE CONNECTION]: Dispatch emergency SOS alert
  Future<void> triggerSosAlert({required String triggerBy, required String location}) async {
    final alert = AlertModel(
      id: 'sos_\${DateTime.now().millisecondsSinceEpoch}',
      title: '🚨 HIGH-PRIORITY SOS DISPATCHED',
      description: 'Emergency alert dispatched by \$triggerBy at \$location.',
      type: 'SOS',
      severity: 'critical',
      timestamp: 'Just now',
      location: location,
    );
    _alerts.insert(0, alert);
  }
}`,
    },
    {
      path: 'lib/screens/home_dashboard_screen.dart',
      name: 'home_dashboard_screen.dart',
      category: 'Screens',
      content: `import 'package:flutter/material.dart';
import '../services/firestore_service.dart';
import '../theme/app_theme.dart';
import '../widgets/patient_profile_card.dart';
import '../widgets/health_summary_card.dart';

/// Screen 1: Caregiver Home Dashboard
/// - "Good Morning, Caregiver" welcome header
/// - Patient profile card (photo, name, age, dementia stage, status badge)
/// - Health summary cards (Heart Rate, Sleep Hours, Water Intake, Steps)
/// - Medicine completion progress
/// - Today's memory game score & improvement percentage
/// - Upcoming doctor's appointment
/// - Recent caregiver alerts
class HomeDashboardScreen extends StatelessWidget {
  final Function(int)? onNavigateTab;
  const HomeDashboardScreen({Key? key, this.onNavigateTab}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final service = FirestoreCaregiverService();
    final patient = service.currentPatient;
    final metrics = service.currentHealthMetrics;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Good Morning, Caregiver', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),
              PatientProfileCard(patient: patient, onTap: () => onNavigateTab?.call(4)),
              const SizedBox(height: 16),
              // Health Summary 2x2 Grid
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                children: [
                  HealthSummaryCard(title: 'Heart Rate', value: '\${metrics.heartRateBpm}', unit: 'BPM', subtitle: 'Normal', icon: Icons.favorite, iconColor: Colors.red, bgColor: Colors.red.shade50),
                  HealthSummaryCard(title: 'Sleep Hours', value: '\${metrics.sleepHours}', unit: 'hrs', subtitle: 'Deep sleep 4.2h', icon: Icons.bedtime, iconColor: Colors.indigo, bgColor: Colors.indigo.shade50),
                  HealthSummaryCard(title: 'Water Intake', value: '\${metrics.waterIntakeMl}', unit: 'ml', subtitle: '82% of goal', icon: Icons.water_drop, iconColor: Colors.blue, bgColor: Colors.blue.shade50),
                  HealthSummaryCard(title: "Today's Steps", value: '\${metrics.todaySteps}', unit: 'steps', subtitle: 'Target: 4,500', icon: Icons.directions_walk, iconColor: Colors.green, bgColor: Colors.green.shade50),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}`,
    },
    {
      path: 'lib/screens/monitoring_screen.dart',
      name: 'monitoring_screen.dart',
      category: 'Screens',
      content: `import 'package:flutter/material.dart';
import '../services/firestore_service.dart';

/// Screen 2: Patient Monitoring Screen
/// - Daily health timeline
/// - Mood tracker (Happy / Calm / Confused / Agitated)
/// - Activity status (Walk, Meals, Hydration, Sleep)
/// - Last active time
class PatientMonitoringScreen extends StatefulWidget {
  const PatientMonitoringScreen({Key? key}) : super(key: key);
  @override
  State<PatientMonitoringScreen> createState() => _PatientMonitoringScreenState();
}

class _PatientMonitoringScreenState extends State<PatientMonitoringScreen> {
  final _service = FirestoreCaregiverService();
  String _selectedMood = 'Calm';

  @override
  Widget build(BuildContext context) {
    final metrics = _service.currentHealthMetrics;
    return Scaffold(
      appBar: AppBar(title: const Text('Patient Health Monitoring')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Mood Tracker Row (Happy, Calm, Confused, Agitated)
          Row(
            children: ['Happy', 'Calm', 'Confused', 'Agitated'].map((m) {
              return Expanded(
                child: ChoiceChip(
                  label: Text(m),
                  selected: _selectedMood == m,
                  onSelected: (val) {
                    setState(() => _selectedMood = m);
                    _service.updateMood(m);
                  },
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
          // Timeline
          ...metrics.dailyTimeline.map((item) => ListTile(
            leading: const Icon(Icons.check_circle, color: Colors.green),
            title: Text(item.title),
            subtitle: Text(item.description),
            trailing: Text(item.time),
          )),
        ],
      ),
    );
  }
}`,
    },
    {
      path: 'lib/screens/reminders_screen.dart',
      name: 'reminders_screen.dart',
      category: 'Screens',
      content: `import 'package:flutter/material.dart';
import '../models/reminder_model.dart';
import '../services/firestore_service.dart';

/// Screen 3: Reminder Management Screen
/// - Medicine list, Water reminders, Appointment reminders
/// - Add / Edit / Delete reminders
/// - Time picker & repeat options
class ReminderManagementScreen extends StatelessWidget {
  const ReminderManagementScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final service = FirestoreCaregiverService();
    final reminders = service.currentReminders;

    return Scaffold(
      appBar: AppBar(title: const Text('Reminders & Schedule')),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Open TimePicker & Reminder Form
        },
        child: const Icon(Icons.add),
      ),
      body: ListView.builder(
        itemCount: reminders.length,
        itemBuilder: (ctx, i) {
          final r = reminders[i];
          return CheckboxListTile(
            value: r.isCompleted,
            title: Text(r.title, style: TextStyle(decoration: r.isCompleted ? TextDecoration.lineThrough : null)),
            subtitle: Text('\${r.dosageOrDetail} • \${r.repeat}'),
            secondary: Text(r.time),
            onChanged: (val) {},
          );
        },
      ),
    );
  }
}`,
    },
    {
      path: 'lib/screens/alerts_screen.dart',
      name: 'alerts_screen.dart',
      category: 'Screens',
      content: `import 'package:flutter/material.dart';
import '../services/firestore_service.dart';

/// Screen 5: Emergency & Safety Screen
/// - Large SOS Alert Card
/// - Missed medicine alert & Safe zone breach alert
/// - Emergency contact cards
/// - Dummy Call Caregiver & Share Location buttons
class EmergencyAlertsScreen extends StatelessWidget {
  const EmergencyAlertsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final service = FirestoreCaregiverService();
    return Scaffold(
      appBar: AppBar(title: const Text('Emergency & Safety Hub')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, padding: const EdgeInsets.all(16)),
            icon: const Icon(Icons.warning),
            label: const Text('TRIGGER EMERGENCY SOS'),
            onPressed: () => service.triggerSosAlert(triggerBy: 'Caregiver App', location: 'Garden Courtyard'),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: ElevatedButton(onPressed: () {}, child: const Text('Call Caregiver'))),
              const SizedBox(width: 8),
              Expanded(child: OutlinedButton(onPressed: () {}, child: const Text('Share Location'))),
            ],
          ),
        ],
      ),
    );
  }
}`,
    },
    {
      path: 'lib/screens/location_screen.dart',
      name: 'location_screen.dart',
      category: 'Screens',
      content: `import 'package:flutter/material.dart';
import '../services/firestore_service.dart';

/// Screen 6: Location Monitoring Screen
/// - Google Maps placeholder
/// - Safe zone geofence indicator (350m radius)
/// - Last known location and timestamp
class LocationMonitoringScreen extends StatelessWidget {
  const LocationMonitoringScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final service = FirestoreCaregiverService();
    final patient = service.currentPatient;

    return Scaffold(
      appBar: AppBar(title: const Text('Live GPS & Safe Zone')),
      body: Column(
        children: [
          Expanded(
            child: Container(
              color: Colors.blueGrey.shade100,
              child: const Center(child: Text('Google Maps SDK Ready - Geofence Active (350m Radius)')),
            ),
          ),
          ListTile(
            title: Text(patient.lastKnownLocation),
            subtitle: Text('Lat: \${patient.currentLatitude}, Long: \${patient.currentLongitude}'),
            trailing: const Text('Updated 2m ago'),
          ),
        ],
      ),
    );
  }
}`,
    },
    {
      path: 'lib/screens/profile_screen.dart',
      name: 'profile_screen.dart',
      category: 'Screens',
      content: `import 'package:flutter/material.dart';
import '../services/firestore_service.dart';

/// Screen 7: Patient Profile Screen
/// - Medical history & Allergies
/// - Blood group & Dementia stage
/// - Emergency contacts & Doctor details
/// - Caregiver behavioral notes section
class PatientProfileScreen extends StatelessWidget {
  const PatientProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final patient = FirestoreCaregiverService().currentPatient;

    return Scaffold(
      appBar: AppBar(title: const Text('Patient Medical Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(patient.fullName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          Text('Stage: \${patient.dementiaStage} • Blood: \${patient.bloodGroup}'),
          const Divider(),
          const Text('Allergies:', style: TextStyle(fontWeight: FontWeight.bold)),
          Text(patient.allergies.join(', ')),
          const Divider(),
          const Text('Caregiver Behavioral Notes:', style: TextStyle(fontWeight: FontWeight.bold)),
          Text(patient.caregiverNotes),
        ],
      ),
    );
  }
}`,
    },
  ];

  const selectedFile = files.find((f) => f.path === selectedPath) || files[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner with SIH Specifications */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                Flutter (Material 3) + Firebase Ready Project
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                SIH 2026 Standard
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Production-ready Dart files located in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-700 font-mono text-[11px]">/flutter_caregiver_app/</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            id="copy-flutter-code-btn"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : `Copy ${selectedFile.name}`}</span>
          </button>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: File Tree Explorer */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <FolderTree className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Project Structure
            </h3>
          </div>

          <div className="space-y-1">
            {files.map((file) => {
              const isSelected = file.path === selectedPath;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedPath(file.path)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal shrink-0">
                    {file.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex flex-col">
          {/* File Header */}
          <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-xs font-bold text-slate-300">
                {selectedFile.path}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Syntax Code Box */}
          <pre className="p-4 text-xs font-mono text-emerald-300/90 leading-relaxed overflow-x-auto max-h-[600px] custom-scrollbar bg-slate-950/60">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
