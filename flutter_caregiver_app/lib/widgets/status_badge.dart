import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Material 3 Status Badge for Patient State (Safe, Needs Attention, Emergency)
class PatientStatusBadge extends StatelessWidget {
  final String status;
  final bool isLarge;

  const PatientStatusBadge({
    Key? key,
    required this.status,
    this.isLarge = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color textColor;
    IconData icon;

    switch (status.toLowerCase()) {
      case 'emergency':
        bg = const Color(0xFFFEE2E2);
        textColor = AppTheme.statusEmergency;
        icon = Icons.warning_rounded;
        break;
      case 'needs attention':
      case 'needs_attention':
        bg = const Color(0xFFFEF3C7);
        textColor = AppTheme.statusAttention;
        icon = Icons.info_outline_rounded;
        break;
      case 'safe':
      default:
        bg = AppTheme.primaryGreenLight;
        textColor = AppTheme.primaryGreenDark;
        icon = Icons.check_circle_rounded;
        break;
    }

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isLarge ? 14 : 10,
        vertical: isLarge ? 8 : 4,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: textColor.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: isLarge ? 18 : 14, color: textColor),
          const SizedBox(width: 6),
          Text(
            status.toUpperCase(),
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.w700,
              fontSize: isLarge ? 13 : 11,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
