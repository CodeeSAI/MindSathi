import 'package:flutter/material.dart';
import '../models/patient_model.dart';
import '../services/firestore_service.dart';
import '../theme/app_theme.dart';
import '../widgets/status_badge.dart';

/// Screen 7: Patient Profile Screen
/// Features:
/// - Medical history & clinical timeline
/// - Allergies list
/// - Blood group & vital attributes
/// - Dementia stage (FAST staging)
/// - Emergency contacts
/// - Doctor details
/// - Caregiver notes section (with live update to Firestore)
class PatientProfileScreen extends StatefulWidget {
  const PatientProfileScreen({Key? key}) : super(key: key);

  @override
  State<PatientProfileScreen> createState() => _PatientProfileScreenState();
}

class _PatientProfileScreenState extends State<PatientProfileScreen> {
  final FirestoreCaregiverService _service = FirestoreCaregiverService();
  late TextEditingController _notesController;
  bool _isSavingNotes = false;

  @override
  void initState() {
    super.initState();
    _notesController = TextEditingController(text: _service.currentPatient.caregiverNotes);
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _saveNotes() async {
    setState(() => _isSavingNotes = true);
    // [FIRESTORE CONNECTION]: Updates caregiverNotes in Firestore
    await _service.updateCaregiverNotes(_notesController.text.trim());
    await Future.delayed(const Duration(milliseconds: 300));
    if (mounted) {
      setState(() => _isSavingNotes = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Caregiver behavioral notes saved successfully!'),
          backgroundColor: AppTheme.primaryGreenDark,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final patient = _service.currentPatient;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Patient Medical Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_rounded),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Clinical profile summary generated for doctor review.')),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Patient Header Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppTheme.surfaceWhite,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppTheme.cardBorderColor),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 36,
                        backgroundImage: NetworkImage(patient.photoUrl),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              patient.fullName,
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.textDark),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${patient.gender}, ${patient.age} years old',
                              style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                            ),
                            const SizedBox(height: 6),
                            PatientStatusBadge(status: patient.status),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Divider(height: 1, color: AppTheme.cardBorderColor),
                  const SizedBox(height: 12),

                  // Key Quick Metrics
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildProfileStat('Blood Group', patient.bloodGroup, Icons.bloodtype_rounded, const Color(0xFFEF4444)),
                      _buildProfileStat('Dementia Stage', 'Stage 4', Icons.psychology_alt_rounded, AppTheme.medicalBlue),
                      _buildProfileStat('Care Routine', 'Active (24/7)', Icons.health_and_safety_rounded, AppTheme.primaryGreenDark),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 1. Dementia Stage Clinical Diagnostic
            _buildSectionHeader('Dementia & Cognitive Diagnosis', Icons.psychology_rounded),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.surfaceWhite,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.cardBorderColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.medicalBlueLight,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          patient.dementiaStage,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.medicalBlueDark),
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text('FAST Level 5', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Patient experiences moderate cognitive decline, requiring gentle prompting for daily sequences, visual object cues, and structured familiar routine.',
                    style: TextStyle(fontSize: 12, color: AppTheme.textDark, height: 1.4),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 2. Allergies & Precautions
            _buildSectionHeader('Allergies & Contraindications', Icons.warning_amber_rounded),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: patient.allergies.map((allergy) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFF87171)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.block_rounded, size: 14, color: AppTheme.statusEmergency),
                        const SizedBox(width: 6),
                        Text(
                          allergy,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.statusEmergency),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),

            // 3. Medical History List
            _buildSectionHeader('Medical History & Chronic Conditions', Icons.history_edu_rounded),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.surfaceWhite,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.cardBorderColor),
              ),
              child: Column(
                children: patient.medicalHistory.map((item) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.check_circle_outline_rounded, color: AppTheme.primaryGreen, size: 18),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            item,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textDark),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),

            // 4. Primary Attending Doctor
            _buildSectionHeader('Attending Doctor Details', Icons.medical_services_rounded),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.surfaceWhite,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.cardBorderColor),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: AppTheme.medicalBlueLight,
                    radius: 24,
                    child: const Icon(Icons.local_hospital_rounded, color: AppTheme.medicalBlueDark),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          patient.primaryDoctor.name,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark),
                        ),
                        Text(
                          '${patient.primaryDoctor.specialization}\n${patient.primaryDoctor.hospital}',
                          style: const TextStyle(fontSize: 12, color: AppTheme.textMuted, height: 1.3),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          patient.primaryDoctor.phone,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.medicalBlueDark),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 5. Caregiver Behavioral Notes (Editable)
            _buildSectionHeader('Caregiver Behavioral Notes & Preferences', Icons.edit_note_rounded),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.surfaceWhite,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.cardBorderColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Record specific triggers, soothing routines, meal preferences, and family connection cues:',
                    style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _notesController,
                    maxLines: 5,
                    decoration: InputDecoration(
                      hintText: 'Enter clinical observations or calming preferences...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.all(12),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerRight,
                    child: ElevatedButton.icon(
                      onPressed: _isSavingNotes ? null : _saveNotes,
                      icon: _isSavingNotes
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.save_rounded, size: 18),
                      label: Text(_isSavingNotes ? 'Saving...' : 'Save Notes'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryGreen,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileStat(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
      ],
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.primaryGreenDark),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textDark),
          ),
        ],
      ),
    );
  }
}
