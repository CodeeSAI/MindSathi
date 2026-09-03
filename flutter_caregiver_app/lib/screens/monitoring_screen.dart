import 'package:flutter/material.dart';
import '../models/health_metrics.dart';
import '../services/firestore_service.dart';
import '../theme/app_theme.dart';

/// Screen 2: Patient Monitoring Screen
/// Features:
/// - Daily health timeline
/// - Mood tracker (Happy / Calm / Confused / Agitated)
/// - Activity status (Walk, Meals, Hydration, Sleep)
/// - Last active time indicator
class PatientMonitoringScreen extends StatefulWidget {
  const PatientMonitoringScreen({Key? key}) : super(key: key);

  @override
  State<PatientMonitoringScreen> createState() => _PatientMonitoringScreenState();
}

class _PatientMonitoringScreenState extends State<PatientMonitoringScreen> {
  final FirestoreCaregiverService _service = FirestoreCaregiverService();
  String _selectedMood = 'Calm';

  @override
  void initState() {
    super.initState();
    _selectedMood = _service.currentHealthMetrics.currentMood;
  }

  void _onSelectMood(String mood) async {
    setState(() {
      _selectedMood = mood;
    });
    // [FIRESTORE CONNECTION]: Updates Firestore document
    await _service.updateMood(mood);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Observed Mood updated to: $mood'),
          backgroundColor: AppTheme.primaryGreenDark,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final patient = _service.currentPatient;
    final metrics = _service.currentHealthMetrics;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Patient Health Monitoring'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => setState(() {}),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Last Active Status Banner
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.primaryGreenLight,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.primaryGreen.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.sensors_rounded, color: AppTheme.primaryGreenDark, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Smart Wearable Synced: Last active 6 mins ago',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.primaryGreenDark,
                      ),
                    ),
                  ),
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppTheme.primaryGreen,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 1. Mood Tracker Section
            const Text(
              'Patient Mood Tracker',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.textDark,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Log cognitive and emotional state for clinical pattern analysis.',
              style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                _buildMoodCard('Happy', '😊', const Color(0xFF10B981), const Color(0xFFE6F7F0)),
                const SizedBox(width: 8),
                _buildMoodCard('Calm', '😌', const Color(0xFF0284C7), const Color(0xFFE0F2FE)),
                const SizedBox(width: 8),
                _buildMoodCard('Confused', '😕', const Color(0xFFF59E0B), const Color(0xFFFEF3C7)),
                const SizedBox(width: 8),
                _buildMoodCard('Agitated', '😟', const Color(0xFFEF4444), const Color(0xFFFEE2E2)),
              ],
            ),
            const SizedBox(height: 20),

            // 2. Activity Status Overview (Walk, Meals, Hydration, Sleep)
            const Text(
              'Activity Status Breakdown',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.textDark,
              ),
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: _buildActivityStatusTile(
                    title: 'Walk',
                    stat: '${metrics.todaySteps}',
                    target: 'Target: 4.5k',
                    icon: Icons.directions_walk_rounded,
                    color: AppTheme.primaryGreenDark,
                    bg: AppTheme.primaryGreenLight,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildActivityStatusTile(
                    title: 'Meals',
                    stat: '2/3 Logged',
                    target: 'Breakfast & Lunch',
                    icon: Icons.restaurant_rounded,
                    color: const Color(0xFFD97706),
                    bg: const Color(0xFFFEF3C7),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _buildActivityStatusTile(
                    title: 'Hydration',
                    stat: '${metrics.waterIntakeMl} ml',
                    target: '82% of 2,000 ml',
                    icon: Icons.water_drop_rounded,
                    color: AppTheme.medicalBlue,
                    bg: AppTheme.medicalBlueLight,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildActivityStatusTile(
                    title: 'Sleep',
                    stat: '${metrics.sleepHours} hrs',
                    target: 'Quality: Good (92%)',
                    icon: Icons.nightlight_round,
                    color: const Color(0xFF6366F1),
                    bg: const Color(0xFFEEF2FF),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // 3. Daily Health Timeline
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Daily Health Timeline',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textDark,
                  ),
                ),
                Text(
                  'Today, ${DateTime.now().day}/${DateTime.now().month}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textMuted,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Timeline Items List
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: metrics.dailyTimeline.length,
              itemBuilder: (context, index) {
                final item = metrics.dailyTimeline[index];
                final isLast = index == metrics.dailyTimeline.length - 1;
                return _buildTimelineItem(item, isLast);
              },
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildMoodCard(String moodName, String emoji, Color activeColor, Color activeBg) {
    final isSelected = _selectedMood.toLowerCase() == moodName.toLowerCase();
    return Expanded(
      child: InkWell(
        onTap: () => _onSelectMood(moodName),
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
          decoration: BoxDecoration(
            color: isSelected ? activeBg : AppTheme.surfaceWhite,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? activeColor : AppTheme.cardBorderColor,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 26)),
              const SizedBox(height: 6),
              Text(
                moodName,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? activeColor : AppTheme.textDark,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActivityStatusTile({
    required String title,
    required String stat,
    required String target,
    required IconData icon,
    required Color color,
    required Color bg,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceWhite,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.cardBorderColor),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
                Text(stat, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
                Text(target, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem(TimelineActivity item, bool isLast) {
    IconData getCategoryIcon(String cat) {
      switch (cat.toLowerCase()) {
        case 'walk':
          return Icons.directions_walk_rounded;
        case 'meals':
          return Icons.restaurant_rounded;
        case 'hydration':
          return Icons.water_drop_rounded;
        case 'sleep':
          return Icons.bedtime_rounded;
        case 'cognitivegame':
          return Icons.psychology_rounded;
        case 'medication':
        default:
          return Icons.medication_rounded;
      }
    }

    Color getCategoryColor(String cat) {
      switch (cat.toLowerCase()) {
        case 'walk':
          return AppTheme.primaryGreen;
        case 'meals':
          return const Color(0xFFF59E0B);
        case 'hydration':
          return AppTheme.medicalBlue;
        case 'sleep':
          return const Color(0xFF6366F1);
        case 'cognitivegame':
          return const Color(0xFF0F766E);
        default:
          return AppTheme.primaryGreenDark;
      }
    }

    final color = getCategoryColor(item.category);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Time label
          SizedBox(
            width: 65,
            child: Text(
              item.time,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
            ),
          ),
          // Timeline Indicator
          Column(
            children: [
              Container(
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  color: item.isCompleted ? color : Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: color, width: 2),
                ),
                child: item.isCompleted
                    ? const Icon(Icons.check, size: 10, color: Colors.white)
                    : null,
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: AppTheme.cardBorderColor,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),

          // Content Box
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.surfaceWhite,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.cardBorderColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        item.title,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textDark,
                        ),
                      ),
                      Icon(getCategoryIcon(item.category), size: 16, color: color),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.description,
                    style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
