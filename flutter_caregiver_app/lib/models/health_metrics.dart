/// Daily Health and Activity metrics model
class HealthMetrics {
  final int heartRateBpm;
  final double sleepHours;
  final int waterIntakeMl;
  final int waterTargetMl;
  final int todaySteps;
  final int stepsTarget;
  final int completedMeds;
  final int totalMeds;
  final int todayMemoryScore;
  final String currentMood; // Happy, Calm, Confused, Agitated
  final List<TimelineActivity> dailyTimeline;

  HealthMetrics({
    required this.heartRateBpm,
    required this.sleepHours,
    required this.waterIntakeMl,
    required this.waterTargetMl,
    required this.todaySteps,
    required this.stepsTarget,
    required this.completedMeds,
    required this.totalMeds,
    required this.todayMemoryScore,
    required this.currentMood,
    required this.dailyTimeline,
  });

  factory HealthMetrics.fromJson(Map<String, dynamic> json) {
    return HealthMetrics(
      heartRateBpm: json['heartRateBpm'] ?? 72,
      sleepHours: (json['sleepHours'] as num?)?.toDouble() ?? 7.5,
      waterIntakeMl: json['waterIntakeMl'] ?? 1450,
      waterTargetMl: json['waterTargetMl'] ?? 2000,
      todaySteps: json['todaySteps'] ?? 3420,
      stepsTarget: json['stepsTarget'] ?? 4500,
      completedMeds: json['completedMeds'] ?? 3,
      totalMeds: json['totalMeds'] ?? 4,
      todayMemoryScore: json['todayMemoryScore'] ?? 84,
      currentMood: json['currentMood'] ?? 'Calm',
      dailyTimeline: (json['dailyTimeline'] as List? ?? [])
          .map((item) => TimelineActivity.fromJson(item))
          .toList(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'heartRateBpm': heartRateBpm,
      'sleepHours': sleepHours,
      'waterIntakeMl': waterIntakeMl,
      'waterTargetMl': waterTargetMl,
      'todaySteps': todaySteps,
      'stepsTarget': stepsTarget,
      'completedMeds': completedMeds,
      'totalMeds': totalMeds,
      'todayMemoryScore': todayMemoryScore,
      'currentMood': currentMood,
      'dailyTimeline': dailyTimeline.map((t) => t.toJson()).toList(),
      'updatedAt': DateTime.now().toIso8601String(),
    };
  }
}

class TimelineActivity {
  final String time;
  final String title;
  final String category; // 'Walk', 'Meals', 'Hydration', 'Sleep', 'CognitiveGame', 'Medication'
  final String description;
  final bool isCompleted;

  TimelineActivity({
    required this.time,
    required this.title,
    required this.category,
    required this.description,
    required this.isCompleted,
  });

  factory TimelineActivity.fromJson(Map<String, dynamic> json) {
    return TimelineActivity(
      time: json['time'] ?? '08:00 AM',
      title: json['title'] ?? 'Morning Routine',
      category: json['category'] ?? 'Meals',
      description: json['description'] ?? 'Completed breakfast and warm oatmeal.',
      isCompleted: json['isCompleted'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'time': time,
        'title': title,
        'category': category,
        'description': description,
        'isCompleted': isCompleted,
      };
}
