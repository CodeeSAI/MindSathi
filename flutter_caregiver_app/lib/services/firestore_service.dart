import 'dart:async';
import '../models/patient_model.dart';
import '../models/health_metrics.dart';
import '../models/reminder_model.dart';
import '../models/cognitive_game_model.dart';
import '../models/alert_model.dart';
import 'dummy_data.dart';

/// Firestore & Firebase Authentication Integration Service
///
/// This service acts as the clean Data Layer. In this SIH 2026 prototype,
/// it serves structured dummy JSON data and provides drop-in hooks for
/// real Cloud Firestore collections:
///
/// Firestore Schema Collections:
/// -------------------------------------------------------------
/// - `patients/{patientId}`
/// - `patients/{patientId}/dailyMetrics/{dateId}`
/// - `patients/{patientId}/reminders/{reminderId}`
/// - `patients/{patientId}/cognitiveHistory/{gameId}`
/// - `patients/{patientId}/safetyAlerts/{alertId}`
/// - `caregivers/{caregiverId}`
/// -------------------------------------------------------------
class FirestoreCaregiverService {
  static final FirestoreCaregiverService _instance = FirestoreCaregiverService._internal();
  factory FirestoreCaregiverService() => _instance;
  FirestoreCaregiverService._internal();

  // In-memory reactive state for prototype simulation
  PatientModel _patient = DummyDataService.patient;
  HealthMetrics _healthMetrics = DummyDataService.healthMetrics;
  List<ReminderModel> _reminders = List.from(DummyDataService.initialReminders);
  CognitiveScoreModel _cognitiveProgress = DummyDataService.cognitiveProgress;
  List<AlertModel> _alerts = List.from(DummyDataService.initialAlerts);

  // Stream controllers to simulate Firestore real-time snapshots
  final _patientStreamController = StreamController<PatientModel>.broadcast();
  final _metricsStreamController = StreamController<HealthMetrics>.broadcast();
  final _remindersStreamController = StreamController<List<ReminderModel>>.broadcast();
  final _alertsStreamController = StreamController<List<AlertModel>>.broadcast();

  // ===========================================================================
  // 1. PATIENT PROFILE & STATUS (FIRESTORE HOOK)
  // ===========================================================================

  /// Stream of patient real-time data
  /// 
  /// [FIRESTORE CONNECTION]:
  /// ```dart
  /// return FirebaseFirestore.instance
  ///     .collection('patients')
  ///     .doc(patientId)
  ///     .snapshots()
  ///     .map((doc) => PatientModel.fromJson(doc.data()!));
  /// ```
  Stream<PatientModel> getPatientStream(String patientId) {
    // Initial emit
    Timer.run(() => _patientStreamController.add(_patient));
    return _patientStreamController.stream;
  }

  PatientModel get currentPatient => _patient;

  /// Update Patient Status (Safe / Needs Attention / Emergency)
  /// 
  /// [FIRESTORE CONNECTION]:
  /// ```dart
  /// await FirebaseFirestore.instance
  ///     .collection('patients')
  ///     .doc(patientId)
  ///     .update({'status': newStatus, 'updatedAt': FieldValue.serverTimestamp()});
  /// ```
  Future<void> updatePatientStatus(String newStatus) async {
    _patient = PatientModel(
      id: _patient.id,
      fullName: _patient.fullName,
      age: _patient.age,
      gender: _patient.gender,
      dementiaStage: _patient.dementiaStage,
      status: newStatus,
      photoUrl: _patient.photoUrl,
      bloodGroup: _patient.bloodGroup,
      allergies: _patient.allergies,
      medicalHistory: _patient.medicalHistory,
      primaryDoctor: _patient.primaryDoctor,
      emergencyContacts: _patient.emergencyContacts,
      caregiverNotes: _patient.caregiverNotes,
      safeZoneName: _patient.safeZoneName,
      currentLatitude: _patient.currentLatitude,
      currentLongitude: _patient.currentLongitude,
      lastKnownLocation: _patient.lastKnownLocation,
      lastActiveTime: DateTime.now(),
      lastLocationUpdate: _patient.lastLocationUpdate,
    );
    _patientStreamController.add(_patient);
  }

  /// Update Caregiver Notes in Firestore
  Future<void> updateCaregiverNotes(String notes) async {
    _patient = PatientModel(
      id: _patient.id,
      fullName: _patient.fullName,
      age: _patient.age,
      gender: _patient.gender,
      dementiaStage: _patient.dementiaStage,
      status: _patient.status,
      photoUrl: _patient.photoUrl,
      bloodGroup: _patient.bloodGroup,
      allergies: _patient.allergies,
      medicalHistory: _patient.medicalHistory,
      primaryDoctor: _patient.primaryDoctor,
      emergencyContacts: _patient.emergencyContacts,
      caregiverNotes: notes,
      safeZoneName: _patient.safeZoneName,
      currentLatitude: _patient.currentLatitude,
      currentLongitude: _patient.currentLongitude,
      lastKnownLocation: _patient.lastKnownLocation,
      lastActiveTime: _patient.lastActiveTime,
      lastLocationUpdate: _patient.lastLocationUpdate,
    );
    _patientStreamController.add(_patient);
  }

  // ===========================================================================
  // 2. HEALTH & MOOD MONITORING (FIRESTORE HOOK)
  // ===========================================================================

  Stream<HealthMetrics> getHealthMetricsStream(String patientId) {
    Timer.run(() => _metricsStreamController.add(_healthMetrics));
    return _metricsStreamController.stream;
  }

  HealthMetrics get currentHealthMetrics => _healthMetrics;

  /// Update Patient Mood (Happy / Calm / Confused / Agitated)
  /// 
  /// [FIRESTORE CONNECTION]:
  /// ```dart
  /// await FirebaseFirestore.instance
  ///     .collection('patients')
  ///     .doc(patientId)
  ///     .collection('dailyMetrics')
  ///     .doc(todayDocId)
  ///     .update({'currentMood': mood});
  /// ```
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
      dailyTimeline: [
        TimelineActivity(
          time: 'Just now',
          title: 'Mood Logged: $mood',
          category: 'Meals',
          description: 'Caregiver updated patient observation status to $mood.',
          isCompleted: true,
        ),
        ..._healthMetrics.dailyTimeline,
      ],
    );
    _metricsStreamController.add(_healthMetrics);
  }

  // ===========================================================================
  // 3. REMINDER MANAGEMENT (FIRESTORE HOOK)
  // ===========================================================================

  Stream<List<ReminderModel>> getRemindersStream(String patientId) {
    Timer.run(() => _remindersStreamController.add(_reminders));
    return _remindersStreamController.stream;
  }

  List<ReminderModel> get currentReminders => List.unmodifiable(_reminders);

  /// Add a new reminder to Firestore
  /// 
  /// [FIRESTORE CONNECTION]:
  /// ```dart
  /// await FirebaseFirestore.instance
  ///     .collection('patients')
  ///     .doc(patientId)
  ///     .collection('reminders')
  ///     .doc(reminder.id)
  ///     .set(reminder.toFirestore());
  /// ```
  Future<void> addReminder(ReminderModel reminder) async {
    _reminders.add(reminder);
    _remindersStreamController.add(_reminders);
  }

  /// Toggle reminder completion status
  Future<void> toggleReminder(String id) async {
    _reminders = _reminders.map((r) {
      if (r.id == id) {
        return r.copyWith(isCompleted: !r.isCompleted);
      }
      return r;
    }).toList();
    _remindersStreamController.add(_reminders);
  }

  /// Delete a reminder
  Future<void> deleteReminder(String id) async {
    _reminders.removeWhere((r) => r.id == id);
    _remindersStreamController.add(_reminders);
  }

  // ===========================================================================
  // 4. MEMORY PROGRESS & COGNITIVE SCORES (FIRESTORE HOOK)
  // ===========================================================================

  CognitiveScoreModel get cognitiveProgress => _cognitiveProgress;

  // ===========================================================================
  // 5. EMERGENCY ALERTS & SOS (FIRESTORE HOOK)
  // ===========================================================================

  Stream<List<AlertModel>> getAlertsStream(String patientId) {
    Timer.run(() => _alertsStreamController.add(_alerts));
    return _alertsStreamController.stream;
  }

  List<AlertModel> get currentAlerts => List.unmodifiable(_alerts);

  /// Dispatch an SOS Alert
  /// 
  /// [FIRESTORE CONNECTION]:
  /// ```dart
  /// await FirebaseFirestore.instance
  ///     .collection('patients')
  ///     .doc(patientId)
  ///     .collection('safetyAlerts')
  ///     .add({
  ///       'type': 'SOS',
  ///       'severity': 'critical',
  ///       'timestamp': FieldValue.serverTimestamp(),
  ///       'location': location,
  ///     });
  /// ```
  Future<void> triggerSosAlert({required String triggerBy, required String location}) async {
    final newAlert = AlertModel(
      id: 'sos_${DateTime.now().millisecondsSinceEpoch}',
      title: '🚨 HIGH-PRIORITY SOS DISPATCHED',
      description: 'Emergency alert dispatched by $triggerBy. Location pinged at $location.',
      type: 'SOS',
      severity: 'critical',
      timestamp: 'Just now',
      isResolved: false,
      location: location,
    );
    _alerts.insert(0, newAlert);
    await updatePatientStatus('Emergency');
    _alertsStreamController.add(_alerts);
  }

  /// Resolve an active alert
  Future<void> resolveAlert(String alertId) async {
    _alerts = _alerts.map((a) {
      if (a.id == alertId) {
        return AlertModel(
          id: a.id,
          title: a.title,
          description: a.description,
          type: a.type,
          severity: a.severity,
          timestamp: a.timestamp,
          isResolved: true,
          location: a.location,
        );
      }
      return a;
    }).toList();
    _alertsStreamController.add(_alerts);
  }
}
