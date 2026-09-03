import 'package:flutter/material.dart';
import '../models/alert_model.dart';
import '../services/firestore_service.dart';
import '../theme/app_theme.dart';
import '../widgets/sos_alert_dialog.dart';

/// Screen 5: Emergency & Safety Screen
/// Features:
/// - Large SOS alert card
/// - Missed medicine alert
/// - Patient left safe zone alert
/// - Emergency contact cards
/// - Dummy Call Caregiver and Share Location buttons
class EmergencyAlertsScreen extends StatefulWidget {
  const EmergencyAlertsScreen({Key? key}) : super(key: key);

  @override
  State<EmergencyAlertsScreen> createState() => _EmergencyAlertsScreenState();
}

class _EmergencyAlertsScreenState extends State<EmergencyAlertsScreen> {
  final FirestoreCaregiverService _service = FirestoreCaregiverService();

  void _triggerSos() {
    showDialog(
      context: context,
      builder: (ctx) => SosAlertDialog(
        onConfirmSos: () async {
          await _service.triggerSosAlert(
            triggerBy: 'Caregiver App',
            location: _service.currentPatient.lastKnownLocation,
          );
          if (mounted) {
            setState(() {});
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('🚨 Emergency SOS Dispatched to all Caregivers!'),
                backgroundColor: AppTheme.statusEmergency,
                duration: Duration(seconds: 4),
              ),
            );
          }
        },
      ),
    );
  }

  void _shareLocation() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('📍 Live GPS Shared: ${_service.currentPatient.lastKnownLocation}'),
        backgroundColor: AppTheme.medicalBlueDark,
      ),
    );
  }

  void _callContact(String name, String phone) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('📞 Calling $name ($phone)...'),
        backgroundColor: AppTheme.primaryGreenDark,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final patient = _service.currentPatient;
    final alerts = _service.currentAlerts;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Emergency & Safety Hub'),
        actions: [
          IconButton(
            icon: const Icon(Icons.location_on_rounded, color: AppTheme.medicalBlue),
            tooltip: 'View Map',
            onPressed: () => Navigator.pushNamed(context, '/location'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. LARGE SOS ALERT CARD
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFDC2626), Color(0xFFB91C1C)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFDC2626).withOpacity(0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.shield_rounded, color: Colors.white, size: 22),
                          SizedBox(width: 8),
                          Text(
                            'EMERGENCY ASSISTANCE',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.0,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.25),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text('24/7 ACTIVE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Tap SOS to broadcast instant emergency alert, ping smart coordinates, and contact ambulance standby.',
                    style: TextStyle(color: Colors.white, fontSize: 13, height: 1.4),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _triggerSos,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFFDC2626),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626), size: 24),
                          SizedBox(width: 8),
                          Text(
                            'TRIGGER SOS ALERT',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                              color: Color(0xFFDC2626),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Quick Action Buttons (Call Caregiver & Share Location)
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _callContact('Sarah (Caregiver)', '+91 98111 22334'),
                    icon: const Icon(Icons.call_rounded, size: 18),
                    label: const Text('Call Caregiver'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryGreen,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _shareLocation,
                    icon: const Icon(Icons.share_location_rounded, size: 18, color: AppTheme.medicalBlue),
                    label: const Text('Share Location', style: TextStyle(color: AppTheme.medicalBlue, fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      side: const BorderSide(color: AppTheme.medicalBlue),
                      backgroundColor: AppTheme.medicalBlueLight.withOpacity(0.5),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // 2. Active Safety Alerts Feed
            const Text(
              'Safety & Health Alerts Feed',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.textDark,
              ),
            ),
            const SizedBox(height: 12),

            ...alerts.map((alert) => _buildAlertFeedCard(alert)),
            const SizedBox(height: 24),

            // 3. Emergency Contacts Directory
            const Text(
              'Emergency Contacts Directory',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.textDark,
              ),
            ),
            const SizedBox(height: 12),

            ...patient.emergencyContacts.map((contact) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceWhite,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: contact.isPrimary ? AppTheme.primaryGreen : AppTheme.cardBorderColor,
                    ),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: contact.isPrimary ? AppTheme.primaryGreenLight : AppTheme.medicalBlueLight,
                        child: Icon(
                          Icons.person_rounded,
                          color: contact.isPrimary ? AppTheme.primaryGreenDark : AppTheme.medicalBlueDark,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  contact.name,
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark),
                                ),
                                if (contact.isPrimary) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppTheme.primaryGreenLight,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Text('Primary', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.primaryGreenDark)),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(contact.relationship, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                            Text(contact.phone, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textDark)),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => _callContact(contact.name, contact.phone),
                        icon: const Icon(Icons.phone_in_talk_rounded, color: AppTheme.primaryGreen),
                      ),
                    ],
                  ),
                )),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildAlertFeedCard(AlertModel alert) {
    Color bg;
    Color border;
    Color iconColor;
    IconData iconData;

    switch (alert.type) {
      case 'SOS':
        bg = const Color(0xFFFEF2F2);
        border = const Color(0xFFFECACA);
        iconColor = AppTheme.statusEmergency;
        iconData = Icons.warning_rounded;
        break;
      case 'MissedMedicine':
        bg = const Color(0xFFFFFBEB);
        border = const Color(0xFFFDE68A);
        iconColor = AppTheme.statusAttention;
        iconData = Icons.medication_liquid_rounded;
        break;
      case 'SafeZoneBreach':
        bg = const Color(0xFFEFF6FF);
        border = const Color(0xFFBFDBFE);
        iconColor = AppTheme.medicalBlue;
        iconData = Icons.fmd_bad_rounded;
        break;
      default:
        bg = AppTheme.surfaceWhite;
        border = AppTheme.cardBorderColor;
        iconColor = AppTheme.primaryGreen;
        iconData = Icons.check_circle_outline_rounded;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(iconData, color: iconColor, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  alert.title,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark),
                ),
              ),
              Text(
                alert.timestamp,
                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            alert.description,
            style: const TextStyle(fontSize: 12, color: AppTheme.textDark, height: 1.3),
          ),
          if (alert.location != null) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 13, color: AppTheme.textMuted),
                const SizedBox(width: 4),
                Text(
                  'Location: ${alert.location}',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
                ),
              ],
            ),
          ],
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              if (!alert.isResolved)
                TextButton(
                  onPressed: () async {
                    await _service.resolveAlert(alert.id);
                    setState(() {});
                  },
                  child: const Text('Mark as Resolved', style: TextStyle(fontSize: 12, color: AppTheme.primaryGreenDark, fontWeight: FontWeight.w700)),
                )
              else
                const Row(
                  children: [
                    Icon(Icons.check, size: 14, color: AppTheme.primaryGreen),
                    SizedBox(width: 4),
                    Text('Resolved', style: TextStyle(fontSize: 12, color: AppTheme.primaryGreen, fontWeight: FontWeight.w600)),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }
}
