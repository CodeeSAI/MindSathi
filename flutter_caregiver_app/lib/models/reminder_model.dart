/// Model for Medication, Hydration, and Doctor Appointment reminders
class ReminderModel {
  final String id;
  final String title;
  final String category; // 'Medicine', 'Water', 'Appointment', 'Exercise'
  final String time; // e.g. "08:30 AM"
  final String dosageOrDetail; // e.g. "Donepezil 5mg (1 Tablet after food)"
  final String repeat; // 'Daily', 'Twice a day', 'Weekly', 'Custom'
  final bool isCompleted;
  final bool isMissed;

  ReminderModel({
    required this.id,
    required this.title,
    required this.category,
    required this.time,
    required this.dosageOrDetail,
    required this.repeat,
    this.isCompleted = false,
    this.isMissed = false,
  });

  ReminderModel copyWith({
    String? id,
    String? title,
    String? category,
    String? time,
    String? dosageOrDetail,
    String? repeat,
    bool? isCompleted,
    bool? isMissed,
  }) {
    return ReminderModel(
      id: id ?? this.id,
      title: title ?? this.title,
      category: category ?? this.category,
      time: time ?? this.time,
      dosageOrDetail: dosageOrDetail ?? this.dosageOrDetail,
      repeat: repeat ?? this.repeat,
      isCompleted: isCompleted ?? this.isCompleted,
      isMissed: isMissed ?? this.isMissed,
    );
  }

  factory ReminderModel.fromJson(Map<String, dynamic> json) {
    return ReminderModel(
      id: json['id'] ?? 'rem_${DateTime.now().millisecondsSinceEpoch}',
      title: json['title'] ?? '',
      category: json['category'] ?? 'Medicine',
      time: json['time'] ?? '09:00 AM',
      dosageOrDetail: json['dosageOrDetail'] ?? '',
      repeat: json['repeat'] ?? 'Daily',
      isCompleted: json['isCompleted'] ?? false,
      isMissed: json['isMissed'] ?? false,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'id': id,
      'title': title,
      'category': category,
      'time': time,
      'dosageOrDetail': dosageOrDetail,
      'repeat': repeat,
      'isCompleted': isCompleted,
      'isMissed': isMissed,
      'updatedAt': DateTime.now().toIso8601String(),
    };
  }
}
