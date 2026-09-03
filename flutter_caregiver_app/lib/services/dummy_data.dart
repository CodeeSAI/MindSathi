import '../models/patient_model.dart';
import '../models/health_metrics.dart';
import '../models/reminder_model.dart';
import '../models/cognitive_game_model.dart';
import '../models/alert_model.dart';

/// Dummy JSON repository providing realistic dementia care data
/// Matches the SIH 2026 Problem Statement specifications.
class DummyDataService {
  static final PatientModel patient = PatientModel.fromJson({
    'id': 'patient_sih_2026_01',
    'fullName': 'Margaret Henderson',
    'age': 78,
    'gender': 'Female',
    'dementiaStage': 'Moderate Stage (Stage 4 / FAST 5)',
    'status': 'Safe', // 'Safe', 'Needs Attention', 'Emergency'
    'photoUrl': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
    'bloodGroup': 'O+ Positive',
    'allergies': ['Penicillin', 'Peanuts', 'Sulfa Drugs'],
    'medicalHistory': [
      'Early-Onset Alzheimer’s Disease (Diagnosed Dec 2023)',
      'Essential Hypertension (Well-managed)',
      'Mild Osteoarthritis in knees',
      'Cataract replacement in right eye (2021)',
    ],
    'primaryDoctor': {
      'name': 'Dr. Rajesh Sharma, MD',
      'specialization': 'Chief Neuro-Geriatrician',
      'hospital': 'Apollo Geriatric Memory Clinic & Research Center',
      'phone': '+91 98765 43210',
      'nextAppointment': 'Thursday, 04:30 PM (Bi-weekly Cognitive Evaluation)',
    },
    'emergencyContacts': [
      {
        'name': 'Sarah Jenkins',
        'relationship': 'Daughter & Primary Family Caregiver',
        'phone': '+91 98111 22334',
        'isPrimary': true,
      },
      {
        'name': 'David Henderson',
        'relationship': 'Son (Emergency Standby)',
        'phone': '+91 98222 33445',
        'isPrimary': false,
      },
      {
        'name': 'Nurse Anjali Verma',
        'relationship': 'Day Home Nurse (Visiting)',
        'phone': '+91 98333 44556',
        'isPrimary': false,
      },
    ],
    'caregiverNotes':
        '• Margaret displays increased comfort when hearing familiar soft 1960s acoustic melodies before 11:00 AM.\n• Experienced mild sundowning agitation yesterday at 5:45 PM; dimming transition lights and presenting family photo album calmed her quickly.\n• Prefers warm herbal tea over plain water; helps maintain 2L hydration target.',
    'safeZoneName': 'Greenwood Care Home & Garden Perimeter (Radius: 350m)',
    'currentLatitude': 28.6139,
    'currentLongitude': 77.2090,
    'lastKnownLocation': 'Living Room Garden Patio, Sector 4',
    'lastActiveTime': DateTime.now().subtract(const Duration(minutes: 6)).toIso8601String(),
    'lastLocationUpdate': DateTime.now().subtract(const Duration(minutes: 2)).toIso8601String(),
  });

  static final HealthMetrics healthMetrics = HealthMetrics.fromJson({
    'heartRateBpm': 74,
    'sleepHours': 7.6,
    'waterIntakeMl': 1650,
    'waterTargetMl': 2000,
    'todaySteps': 3420,
    'stepsTarget': 4500,
    'completedMeds': 3,
    'totalMeds': 4,
    'todayMemoryScore': 86,
    'currentMood': 'Calm', // Happy, Calm, Confused, Agitated
    'dailyTimeline': [
      {
        'time': '07:30 AM',
        'title': 'Morning Awakening & Vitals Check',
        'category': 'Sleep',
        'description': 'Woke up refreshed after 7.6 hrs uninterrupted sleep. Resting HR: 71 bpm.',
        'isCompleted': true,
      },
      {
        'time': '08:15 AM',
        'title': 'Nutritious Breakfast & Donepezil 5mg',
        'category': 'Meals',
        'description': 'Oatmeal with blueberries, walnuts, and morning dementia medication.',
        'isCompleted': true,
      },
      {
        'time': '09:30 AM',
        'title': 'Guided Garden Stroll',
        'category': 'Walk',
        'description': 'Completed 1,800 steps in courtyard with Nurse Anjali. Mood observed: Calm & cheerful.',
        'isCompleted': true,
      },
      {
        'time': '10:45 AM',
        'title': 'AI Cognitive Memory Game Session',
        'category': 'CognitiveGame',
        'description': 'Played "Family Face & Name Recall" - Scored 86/100 (+4% improvement).',
        'isCompleted': true,
      },
      {
        'time': '01:00 PM',
        'title': 'Lunch & Hydration Check',
        'category': 'Hydration',
        'description': 'Drank 400ml chamomile herbal tea with grilled vegetables. Total water: 1650ml.',
        'isCompleted': true,
      },
      {
        'time': '04:30 PM',
        'title': 'Evening Cognitive Recall & Puzzles',
        'category': 'CognitiveGame',
        'description': 'Scheduled: 15-minute Audio Voice Prompt puzzle session.',
        'isCompleted': false,
      },
      {
        'time': '08:00 PM',
        'title': 'Night Medication (Memantine 10mg)',
        'category': 'Medication',
        'description': 'Scheduled with warm milk before sleep.',
        'isCompleted': false,
      },
    ],
  });

  static final List<ReminderModel> initialReminders = [
    ReminderModel(
      id: 'rem_1',
      title: 'Donepezil (Aricept) 5mg',
      category: 'Medicine',
      time: '08:00 AM',
      dosageOrDetail: '1 tablet after breakfast (Cognitive function)',
      repeat: 'Daily (Morning)',
      isCompleted: true,
      isMissed: false,
    ),
    ReminderModel(
      id: 'rem_2',
      title: 'Hydration: Lemon Honey Warm Water',
      category: 'Water',
      time: '11:00 AM',
      dosageOrDetail: '300 ml glass to prevent urinary tract dehydration',
      repeat: 'Daily (Every 2 hours)',
      isCompleted: true,
      isMissed: false,
    ),
    ReminderModel(
      id: 'rem_3',
      title: 'Amlodipine 5mg (BP)',
      category: 'Medicine',
      time: '01:30 PM',
      dosageOrDetail: '1 tablet after lunch (Blood pressure control)',
      repeat: 'Daily',
      isCompleted: true,
      isMissed: false,
    ),
    ReminderModel(
      id: 'rem_4',
      title: 'Dr. Sharma Memory Assessment',
      category: 'Appointment',
      time: '04:30 PM',
      dosageOrDetail: 'Apollo Geriatric Clinic (Room 304 - Bring Game Log)',
      repeat: 'One-time (This Thursday)',
      isCompleted: false,
      isMissed: false,
    ),
    ReminderModel(
      id: 'rem_5',
      title: 'Memantine 10mg (Namenda)',
      category: 'Medicine',
      time: '08:30 PM',
      dosageOrDetail: '1 tablet with water 30 mins before sleep',
      repeat: 'Daily (Night)',
      isCompleted: false,
      isMissed: false,
    ),
    ReminderModel(
      id: 'rem_6',
      title: 'Night Hydration Sip',
      category: 'Water',
      time: '09:15 PM',
      dosageOrDetail: '150 ml warm chamomile tea',
      repeat: 'Daily',
      isCompleted: false,
      isMissed: false,
    ),
  ];

  static final CognitiveScoreModel cognitiveProgress = CognitiveScoreModel.fromJson({
    'overallScore': 86,
    'improvementPercentage': 8.5,
    'statusDescription': 'Consistent cognitive stabilization across weekly memory trials.',
    'weeklyTrend': [
      {'day': 'Mon', 'score': 76},
      {'day': 'Tue', 'score': 79},
      {'day': 'Wed', 'score': 82},
      {'day': 'Thu', 'score': 80},
      {'day': 'Fri', 'score': 84},
      {'day': 'Sat', 'score': 83},
      {'day': 'Sun', 'score': 86},
    ],
    'gameHistory': [
      {
        'id': 'gh_1',
        'gameName': 'Family Face-Name Association',
        'playedTime': 'Today, 10:45 AM',
        'score': 90,
        'maxScore': 100,
        'duration': '4m 12s',
        'difficulty': 'Moderate',
        'cognitiveDomain': 'Facial & Short-term Recall',
      },
      {
        'id': 'gh_2',
        'gameName': 'Daily Household Object Recall',
        'playedTime': 'Yesterday, 04:15 PM',
        'score': 85,
        'maxScore': 100,
        'duration': '3m 50s',
        'difficulty': 'Moderate',
        'cognitiveDomain': 'Semantic Memory',
      },
      {
        'id': 'gh_3',
        'gameName': 'Sequential Color & Shape Match',
        'playedTime': '2 days ago, 11:20 AM',
        'score': 82,
        'maxScore': 100,
        'duration': '5m 05s',
        'difficulty': 'Adaptive Easy',
        'cognitiveDomain': 'Executive Function & Focus',
      },
      {
        'id': 'gh_4',
        'gameName': '1960s Music & Voice Trivia',
        'playedTime': '3 days ago, 03:30 PM',
        'score': 94,
        'maxScore': 100,
        'duration': '6m 10s',
        'difficulty': 'Moderate',
        'cognitiveDomain': 'Long-term Episodic Memory',
      },
    ],
  });

  static final List<AlertModel> initialAlerts = [
    AlertModel(
      id: 'alt_1',
      title: '🚨 Emergency SOS Triggered (Simulated)',
      description: 'Caregiver triggered manual high-priority safety check for Margaret.',
      type: 'SOS',
      severity: 'critical',
      timestamp: '12 mins ago',
      isResolved: false,
      location: 'Garden Patio, Sector 4',
    ),
    AlertModel(
      id: 'alt_2',
      title: '⚠️ Missed Medication Reminder Notice',
      description: 'Donepezil 5mg was logged 25 minutes past regular morning schedule.',
      type: 'MissedMedicine',
      severity: 'warning',
      timestamp: '2 hours ago',
      isResolved: true,
      location: 'Home Dining Area',
    ),
    AlertModel(
      id: 'alt_3',
      title: '🛡️ Safe Zone Boundary Verification',
      description: 'Patient approached outer perimeter gate (320m from base). Returned safely.',
      type: 'SafeZoneBreach',
      severity: 'warning',
      timestamp: 'Yesterday, 05:20 PM',
      isResolved: true,
      location: 'North Courtyard Boundary',
    ),
    AlertModel(
      id: 'alt_4',
      title: '💧 Hydration Milestone Reached',
      description: 'Patient reached 80% of daily hydration requirement (1,650ml logged).',
      type: 'info',
      severity: 'info',
      timestamp: '3 hours ago',
      isResolved: true,
      location: 'Living Area',
    ),
  ];
}
