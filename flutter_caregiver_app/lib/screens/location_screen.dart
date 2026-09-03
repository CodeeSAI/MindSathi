import 'package:flutter/material.dart';
import '../services/firestore_service.dart';
import '../theme/app_theme.dart';

/// Screen 6: Location Monitoring Screen
/// Features:
/// - Map placeholder ready for Google Maps (Ready for google_maps_flutter)
/// - Safe zone indicator (Geofence radius status)
/// - Last known location description
/// - Last updated timestamp
class LocationMonitoringScreen extends StatefulWidget {
  const LocationMonitoringScreen({Key? key}) : super(key: key);

  @override
  State<LocationMonitoringScreen> createState() => _LocationMonitoringScreenState();
}

class _LocationMonitoringScreenState extends State<LocationMonitoringScreen> {
  final FirestoreCaregiverService _service = FirestoreCaregiverService();
  bool _isSafeZoneActive = true;

  @override
  Widget build(BuildContext context) {
    final patient = _service.currentPatient;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Live GPS & Safe Zone'),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location_rounded),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('GPS Signal calibrated: Accuracy 4.2m')),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // 1. MAP PLACEHOLDER (Ready for Google Maps SDK)
          Expanded(
            flex: 3,
            child: Stack(
              children: [
                // Stylized Healthcare Map Canvas Placeholder
                Container(
                  width: double.infinity,
                  color: const Color(0xFFE2E8F0),
                  child: CustomPaint(
                    painter: _MapGridPainter(),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Safe Zone Geofence Circle
                          Container(
                            width: 180,
                            height: 180,
                            decoration: BoxDecoration(
                              color: AppTheme.primaryGreen.withOpacity(0.12),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppTheme.primaryGreen.withOpacity(0.6),
                                width: 2,
                                strokeAlign: BorderSide.strokeAlignCenter,
                              ),
                            ),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                // Radar ripple
                                Container(
                                  width: 90,
                                  height: 90,
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryGreen.withOpacity(0.2),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                // Patient Marker
                                Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: const BoxDecoration(
                                        color: AppTheme.surfaceWhite,
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(color: Colors.black26, blurRadius: 6),
                                        ],
                                      ),
                                      child: CircleAvatar(
                                        radius: 20,
                                        backgroundImage: NetworkImage(patient.photoUrl),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppTheme.primaryGreenDark,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Text(
                                        'Margaret (Inside)',
                                        style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // Map Overlay Badges
                Positioned(
                  top: 14,
                  left: 14,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceWhite.withOpacity(0.95),
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.satellite_alt_rounded, size: 14, color: AppTheme.medicalBlue),
                        SizedBox(width: 6),
                        Text(
                          'Google Maps Ready • GPS Active',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textDark),
                        ),
                      ],
                    ),
                  ),
                ),

                Positioned(
                  top: 14,
                  right: 14,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreenLight,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.primaryGreen),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.verified_user_rounded, size: 14, color: AppTheme.primaryGreenDark),
                        SizedBox(width: 4),
                        Text(
                          'SAFE ZONE IN BOUNDS',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primaryGreenDark),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 2. LOCATION & GEOFENCE STATUS DETAILS
          Expanded(
            flex: 2,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: const BoxDecoration(
                color: AppTheme.surfaceWhite,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, -2))],
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Location Details',
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppTheme.textDark),
                        ),
                        Text(
                          'Updated 2 mins ago',
                          style: const TextStyle(fontSize: 12, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Last Known Location Card
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.backgroundLight,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.cardBorderColor),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppTheme.medicalBlueLight,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.pin_drop_rounded, color: AppTheme.medicalBlue, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Current Location',
                                  style: TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                                ),
                                Text(
                                  patient.lastKnownLocation,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textDark),
                                ),
                                Text(
                                  'Lat: ${patient.currentLatitude.toStringAsFixed(4)}, Long: ${patient.currentLongitude.toStringAsFixed(4)}',
                                  style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Safe Zone Geofence Card
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryGreenLight.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.primaryGreen.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.security_rounded, color: AppTheme.primaryGreenDark, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Designated Geofence Safe Zone',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.primaryGreenDark),
                                ),
                                Text(
                                  patient.safeZoneName,
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textDark),
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: _isSafeZoneActive,
                            activeColor: AppTheme.primaryGreenDark,
                            onChanged: (val) {
                              setState(() => _isSafeZoneActive = val);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(val ? 'Geofence Breach Alarms Enabled' : 'Geofence Alarms Paused'),
                                  duration: const Duration(seconds: 2),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFCBD5E1)
      ..strokeWidth = 1;

    // Draw stylized map grid roads
    const step = 40.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    // Draw mock arterial highway curve
    final roadPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 8
      ..style = PaintingStyle.stroke;
    final path = Path()
      ..moveTo(0, size.height * 0.3)
      ..cubicTo(size.width * 0.4, size.height * 0.2, size.width * 0.6, size.height * 0.8, size.width, size.height * 0.7);
    canvas.drawPath(path, roadPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
