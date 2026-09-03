import 'package:flutter/material.dart';
import '../models/cognitive_game_model.dart';
import '../services/firestore_service.dart';
import '../theme/app_theme.dart';

/// Screen 4: Memory Progress Screen
/// Features:
/// - Weekly cognitive score chart
/// - Memory game history
/// - Improvement percentage
/// - Daily game completion cards
class MemoryProgressScreen extends StatelessWidget {
  const MemoryProgressScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final service = FirestoreCaregiverService();
    final progress = service.cognitiveProgress;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Cognitive & Memory Progress'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Overall Cognitive Health Score Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF065F46), Color(0xFF047857), Color(0xFF059669)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF047857).withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Weekly Cognitive Index',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFFA7F3D0),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.trending_up_rounded, color: Colors.white, size: 16),
                            const SizedBox(width: 4),
                            Text(
                              '+${progress.improvementPercentage}%',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${progress.overallScore}',
                        style: const TextStyle(
                          fontSize: 42,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          height: 1.0,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Text(
                        '/100',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Colors.white70,
                        ),
                      ),
                      const Spacer(),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'Status: STABLE',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF6EE7B7)),
                          ),
                          Text(
                            'Mild fluctuation within safety limits',
                            style: TextStyle(fontSize: 11, color: Colors.white70),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      progress.statusDescription,
                      style: const TextStyle(fontSize: 12, color: Colors.white, height: 1.3),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 1. Weekly Cognitive Score Chart (Bar & Progress breakdown)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.surfaceWhite,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.cardBorderColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '7-Day Cognitive Performance Trend',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textDark),
                      ),
                      Text('Target: 80+', style: TextStyle(fontSize: 12, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Custom visual bar chart representation
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: progress.weeklyTrend.map((point) {
                      final heightRatio = (point.score - 50) / 50.0; // scale between 50 and 100
                      final barHeight = 110.0 * heightRatio.clamp(0.2, 1.0);
                      final isToday = point.day == 'Sun';

                      return Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Text(
                            '${point.score}',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: isToday ? FontWeight.w800 : FontWeight.w600,
                              color: isToday ? AppTheme.primaryGreenDark : AppTheme.textMuted,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            width: 26,
                            height: barHeight,
                            decoration: BoxDecoration(
                              color: isToday ? AppTheme.primaryGreen : AppTheme.medicalBlueLight,
                              gradient: isToday
                                  ? const LinearGradient(
                                      colors: [Color(0xFF10B981), Color(0xFF047857)],
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                    )
                                  : null,
                              borderRadius: BorderRadius.circular(6),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            point.day,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isToday ? FontWeight.w800 : FontWeight.w500,
                              color: isToday ? AppTheme.textDark : AppTheme.textMuted,
                            ),
                          ),
                        ],
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // 2. Memory Game History & Daily Completion Cards
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Memory Game History',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textDark),
                ),
                Text(
                  '${progress.gameHistory.length} Sessions Logged',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            const SizedBox(height: 12),

            ...progress.gameHistory.map((game) => _buildGameCard(game)),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildGameCard(GameHistoryItem game) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  game.gameName,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreenLight,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${game.score}/${game.maxScore} pts',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.primaryGreenDark),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.medicalBlueLight,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  game.cognitiveDomain,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.medicalBlueDark),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Duration: ${game.duration} • Level: ${game.difficulty}',
                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.access_time, size: 12, color: AppTheme.textMuted),
              const SizedBox(width: 4),
              Text(game.playedTime, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
            ],
          ),
        ],
      ),
    );
  }
}
