import 'package:flutter/material.dart';
import '../models/patient_model.dart';
import '../theme/app_theme.dart';
import 'status_badge.dart';

/// Caregiver Home Header Patient Card
/// Displays Patient photo, name, age, dementia stage, and live status badge.
class PatientProfileCard extends StatelessWidget {
  final PatientModel patient;
  final VoidCallback? onTap;

  const PatientProfileCard({
    Key? key,
    required this.patient,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.surfaceWhite,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.cardBorderColor),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Patient Avatar with dementia care ring
            Stack(
              children: [
                CircleAvatar(
                  radius: 34,
                  backgroundColor: AppTheme.primaryGreenLight,
                  backgroundImage: NetworkImage(patient.photoUrl),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppTheme.primaryGreen,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.favorite,
                      size: 12,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 16),

            // Patient Name, Age, Dementia Stage & Status
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          patient.fullName,
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textDark,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      PatientStatusBadge(status: patient.status),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Age: ${patient.age} yrs • Blood: ${patient.bloodGroup}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.textMuted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.medicalBlueLight,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      patient.dementiaStage,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.medicalBlueDark,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
