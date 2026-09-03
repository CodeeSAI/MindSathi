/// Model for Caregiver and Patient Safety Alerts
class AlertModel {
  final String id;
  final String title;
  final String description;
  final String type; // 'SOS', 'MissedMedicine', 'SafeZoneBreach', 'HeartRateSpike', 'FallDetection'
  final String severity; // 'critical', 'warning', 'info'
  final String timestamp;
  final bool isResolved;
  final String? location;

  AlertModel({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.severity,
    required this.timestamp,
    this.isResolved = false,
    this.location,
  });

  factory AlertModel.fromJson(Map<String, dynamic> json) {
    return AlertModel(
      id: json['id'] ?? 'alt_${DateTime.now().millisecondsSinceEpoch}',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      type: json['type'] ?? 'info',
      severity: json['severity'] ?? 'warning',
      timestamp: json['timestamp'] ?? 'Just now',
      isResolved: json['isResolved'] ?? false,
      location: json['location'],
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'type': type,
      'severity': severity,
      'timestamp': timestamp,
      'isResolved': isResolved,
      'location': location,
      'createdAt': DateTime.now().toIso8601String(),
    };
  }
}
