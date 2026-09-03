/// Model for Cognitive Scores & Memory Game Progress
class CognitiveScoreModel {
  final int overallScore; // e.g. 84/100
  final double improvementPercentage; // e.g. +7.4%
  final String statusDescription;
  final List<WeeklyScorePoint> weeklyTrend;
  final List<GameHistoryItem> gameHistory;

  CognitiveScoreModel({
    required this.overallScore,
    required this.improvementPercentage,
    required this.statusDescription,
    required this.weeklyTrend,
    required this.gameHistory,
  });

  factory CognitiveScoreModel.fromJson(Map<String, dynamic> json) {
    return CognitiveScoreModel(
      overallScore: json['overallScore'] ?? 84,
      improvementPercentage: (json['improvementPercentage'] as num?)?.toDouble() ?? 7.4,
      statusDescription: json['statusDescription'] ?? 'Steady Cognitive Stability (Memory recall +8% this week)',
      weeklyTrend: (json['weeklyTrend'] as List? ?? [])
          .map((e) => WeeklyScorePoint.fromJson(e))
          .toList(),
      gameHistory: (json['gameHistory'] as List? ?? [])
          .map((e) => GameHistoryItem.fromJson(e))
          .toList(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'overallScore': overallScore,
      'improvementPercentage': improvementPercentage,
      'statusDescription': statusDescription,
      'weeklyTrend': weeklyTrend.map((e) => e.toJson()).toList(),
      'gameHistory': gameHistory.map((e) => e.toJson()).toList(),
    };
  }
}

class WeeklyScorePoint {
  final String day; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  final int score;

  WeeklyScorePoint({required this.day, required this.score});

  factory WeeklyScorePoint.fromJson(Map<String, dynamic> json) {
    return WeeklyScorePoint(
      day: json['day'] ?? 'Mon',
      score: json['score'] ?? 75,
    );
  }

  Map<String, dynamic> toJson() => {'day': day, 'score': score};
}

class GameHistoryItem {
  final String id;
  final String gameName; // e.g., 'Face-Name Association', 'Daily Object Recall', 'Number Sequencing'
  final String playedTime;
  final int score;
  final int maxScore;
  final String duration;
  final String difficulty;
  final String cognitiveDomain; // 'Short-term Memory', 'Attention', 'Executive Function'

  GameHistoryItem({
    required this.id,
    required this.gameName,
    required this.playedTime,
    required this.score,
    required this.maxScore,
    required this.duration,
    required this.difficulty,
    required this.cognitiveDomain,
  });

  factory GameHistoryItem.fromJson(Map<String, dynamic> json) {
    return GameHistoryItem(
      id: json['id'] ?? '',
      gameName: json['gameName'] ?? '',
      playedTime: json['playedTime'] ?? 'Today, 10:15 AM',
      score: json['score'] ?? 85,
      maxScore: json['maxScore'] ?? 100,
      duration: json['duration'] ?? '4m 30s',
      difficulty: json['difficulty'] ?? 'Moderate',
      cognitiveDomain: json['cognitiveDomain'] ?? 'Visual Memory',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'gameName': gameName,
        'playedTime': playedTime,
        'score': score,
        'maxScore': maxScore,
        'duration': duration,
        'difficulty': difficulty,
        'cognitiveDomain': cognitiveDomain,
      };
}
