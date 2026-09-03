import 'package:flutter/material.dart';
import '../models/patient_model.dart';
import '../models/health_metrics.dart';
import '../models/reminder_model.dart';
import '../models/alert_model.dart';
import '../services/firestore_service.dart';
import '../theme/app_theme.dart';
import '../widgets/patient_profile_card.dart';
import '../widgets/health_summary_card.dart';
import '../widgets/status_badge.dart';

/// Screen 1: Caregiver Home Dashboard
/// Includes:
/// - Welcome message: "Good Morning, Caregiver"
/// - Patient profile card (photo, name, age, dementia stage, status badge)
/// - Health summary cards (Heart Rate, Sleep Hours, Water Intake, Today's Steps)
/// - Medicine completion progress
/// - Today's memory game score
/// - Upcoming doctor's appointment
/// - Recent caregiver alerts
class HomeDashboardScreen extends StatefulWidget {
  final Function(int)? onNavigateTab;

  const HomeDashboardScreen({Key? key, this.onNavigateTab}) : super(key: key);

  @override
  State<HomeDashboardScreen> createState() => _HomeDashboardScreenState();
}

class _HomeDashboardScreenState extends State<HomeDashboardScreen> {
  final FirestoreCaregiverService _service = FirestoreCaregiverService();

  @override
  Widget build(BuildContext context) {
    // In production Flutter with Firebase:
    // StreamBuilder<PatientModel>(
    //   stream: _service.getPatientStream('patient_sih_2026_01'),
    //   builder: (context, snapshot) { ... }
    // );
    final patient = _service.currentPatient;
    final metrics = _service.currentHealthMetrics;
    final reminders = _service.currentReminders;
    final alerts = _service.currentAlerts;

    final completedMeds = reminders.where((r) => r.category == 'Medicine' && r.isCompleted).length;
    final totalMeds = reminders.where((r) => r.category == 'Medicine').length;
    final medProgress = totalMeds > 0 ? (completedMeds / totalMeds) : 0.0;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            setState(() {});
          },
          color: AppTheme.primaryGreen,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header: Greeting & Caregiver Notification Bell
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text(
                              'Good Morning, Caregiver',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.textDark,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Icon(Icons.wb_sunny_rounded, color: Color(0xFFF59E0B), size: 22),
                          ],
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Dementia Care Assistance & Monitoring',
                          style: TextStyle(
                            fontSize: 13,
                            color: AppTheme.textMuted,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      onPressed: () => widget.onNavigateTab?.call(3), // Navigate to Alerts
                      icon: Stack(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceWhite,
                              shape: BoxShape.circle,
                              border: Border.all(color: AppTheme.cardBorderColor),
                            ),
                            child: const Icon(Icons.notifications_none_rounded, color: AppTheme.textDark),
                          ),
                          if (alerts.any((a) => !a.isResolved))
                            Positioned(
                              top: 2,
                              right: 2,
                              child: Container(
                                width: 10,
                                height: 10,
                                decoration: const BoxDecoration(
                                  color: AppTheme.statusEmergency,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // 1. Patient Profile Card
                PatientProfileCard(
                  patient: patient,
                  onTap: () => widget.onNavigateTab?.call(4), // Navigate to Profile
                ),
                const SizedBox(height: 20),

                // Section: Vitals & Health Summary (2x2 Grid)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Patient Health Summary',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textDark,
                      ),
                    ),
                    InkWell(
                      onTap: () => widget.onNavigateTab?.call(1), // To Monitoring Screen
                      child: const Text(
                        'Full Timeline →',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primaryGreenDark,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // 4 Health Summary Cards Grid
                GridView.count(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  childAspectRatio: 1.25,
                  children: [
                    HealthSummaryCard(
                      title: 'Heart Rate',
                      value: '${metrics.heartRateBpm}',
                      unit: 'BPM',
                      subtitle: 'Resting & Normal (60-100)',
                      icon: Icons.favorite_rounded,
                      iconColor: const Color(0xFFEF4444),
                      bgColor: const Color(0xFFFEE2E2),
                    ),
                    HealthSummaryCard(
                      title: 'Sleep Hours',
                      value: '${metrics.sleepHours}',
                      unit: 'hrs',
                      subtitle: 'Deep sleep: 4.2 hrs',
                      icon: Icons.bedtime_rounded,
                      iconColor: const Color(0xFF6366F1),
                      bgColor: const Color(0xFFEEF2FF),
                    ),
                    HealthSummaryCard(
                      title: 'Water Intake',
                      value: '${metrics.waterIntakeMl}',
                      unit: 'ml',
                      subtitle: 'Target: ${metrics.waterTargetMl}ml (82%)',
                      icon: Icons.water_drop_rounded,
                      iconColor: AppTheme.medicalBlue,
                      bgColor: AppTheme.medicalBlueLight,
                      progressPercent: metrics.waterIntakeMl / metrics.waterTargetMl,
                    ),
                    HealthSummaryCard(
                      title: "Today's Steps",
                      value: '${metrics.todaySteps}',
                      unit: 'steps',
                      subtitle: 'Target: ${metrics.stepsTarget} steps',
                      icon: Icons.directions_walk_rounded,
                      iconColor: AppTheme.primaryGreenDark,
                      bgColor: AppTheme.primaryGreenLight,
                      progressPercent: metrics.todaySteps / metrics.stepsTarget,
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // 2. Medicine Completion Progress Banner
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceWhite,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.cardBorderColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryGreenLight,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.medication_rounded, color: AppTheme.primaryGreenDark, size: 20),
                              ),
                              const SizedBox(width: 10),
                              const Text(
                                'Medicine Completion',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textDark,
                                ),
                              ),
                            ],
                          ),
                          Text(
                            '$completedMeds of $totalMeds Taken',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.primaryGreenDark,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: medProgress,
                          backgroundColor: AppTheme.primaryGreenLight,
                          valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryGreen),
                          minHeight: 8,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Next: Memantine 10mg at 08:30 PM',
                            style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                          ),
                          InkWell(
                            onTap: () => widget.onNavigateTab?.call(2), // Reminders tab
                            child: const Text(
                              'Manage →',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.medicalBlue),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 3. Today's Memory Game Score & Cognitive Stability
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0F766E), Color(0xFF0D9488)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0F766E).withOpacity(0.25),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.18),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.psychology_rounded, color: Colors.white, size: 32),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "Today's Memory Game Score",
                              style: TextStyle(
                                fontSize: 13,
                                color: Color(0xFFCCFBF1),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Text(
                                  '${metrics.todayMemoryScore}/100',
                                  style: const TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.25),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text(
                                    '+8.5% This Week',
                                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'Memory Recall session completed at 10:45 AM',
                              style: TextStyle(fontSize: 11, color: Colors.white70),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () {
                          // Navigate to Memory progress screen
                          Navigator.pushNamed(context, '/memory-progress');
                        },
                        icon: const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 16),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 4. Upcoming Doctor's Appointment Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceWhite,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.cardBorderColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppTheme.medicalBlueLight,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.calendar_month_rounded, color: AppTheme.medicalBlue, size: 20),
                              ),
                              const SizedBox(width: 10),
                              const Text(
                                "Upcoming Doctor's Visit",
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textDark,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.medicalBlueLight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'In 3 Days',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.medicalBlueDark),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        patient.primaryDoctor.name,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark),
                      ),
                      Text(
                        '${patient.primaryDoctor.specialization} • ${patient.primaryDoctor.hospital}',
                        style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.access_time_rounded, size: 14, color: AppTheme.medicalBlue),
                          const SizedBox(width: 4),
                          Text(
                            patient.primaryDoctor.nextAppointment,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.medicalBlueDark),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 5. Recent Caregiver Alerts
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Recent Caregiver Alerts',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textDark,
                      ),
                    ),
                    InkWell(
                      onTap: () => widget.onNavigateTab?.call(3), // To Alerts Screen
                      child: const Text(
                        'View All →',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primaryGreenDark,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                ...alerts.take(2).map((alert) => Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: alert.severity == 'critical'
                            ? const Color(0xFFFEF2F2)
                            : alert.severity == 'warning'
                                ? const Color(0xFFFFFBEB)
                                : AppTheme.surfaceWhite,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: alert.severity == 'critical'
                              ? const Color(0xFFFECACA)
                              : alert.severity == 'warning'
                                  ? const Color(0xFFFDE68A)
                                  : AppTheme.cardBorderColor,
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            alert.severity == 'critical'
                                ? Icons.warning_rounded
                                : alert.severity == 'warning'
                                    ? Icons.notification_important_rounded
                                    : Icons.info_outline_rounded,
                            color: alert.severity == 'critical'
                                ? AppTheme.statusEmergency
                                : alert.severity == 'warning'
                                    ? AppTheme.statusAttention
                                    : AppTheme.medicalBlue,
                            size: 20,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  alert.title,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textDark),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  alert.description,
                                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            alert.timestamp,
                            style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                          ),
                        ],
                      ),
                    )),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
