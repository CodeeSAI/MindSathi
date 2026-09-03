export type PatientStatus = 'Safe' | 'Needs Attention' | 'Emergency';

export type MoodType = 'Happy' | 'Calm' | 'Confused' | 'Agitated';

export type ReminderCategory = 'Medicine' | 'Water' | 'Appointment';

export interface DoctorInfo {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  nextAppointment: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export interface PatientProfile {
  id: string;
  fullName: string;
  age: number;
  gender: string;
  dementiaStage: string;
  status: PatientStatus;
  photoUrl: string;
  bloodGroup: string;
  allergies: string[];
  medicalHistory: string[];
  primaryDoctor: DoctorInfo;
  emergencyContacts: EmergencyContact[];
  caregiverNotes: string;
  safeZoneName: string;
  currentLatitude: number;
  currentLongitude: number;
  lastKnownLocation: string;
  lastActiveTime: string;
  lastLocationUpdate: string;
}

export interface HealthMetrics {
  heartRateBpm: number;
  sleepHours: number;
  waterIntakeMl: number;
  waterTargetMl: number;
  todaySteps: number;
  stepsTarget: number;
  completedMeds: number;
  totalMeds: number;
  todayMemoryScore: number;
  currentMood: MoodType;
  dailyTimeline: TimelineActivity[];
}

export interface TimelineActivity {
  id: string;
  time: string;
  title: string;
  category: 'Walk' | 'Meals' | 'Hydration' | 'Sleep' | 'CognitiveGame' | 'Medication';
  description: string;
  isCompleted: boolean;
}

export interface ReminderItem {
  id: string;
  title: string;
  category: ReminderCategory;
  time: string;
  dosageOrDetail: string;
  repeat: string;
  isCompleted: boolean;
  isMissed?: boolean;
}

export interface CognitiveGameItem {
  id: string;
  gameName: string;
  playedTime: string;
  score: number;
  maxScore: number;
  duration: string;
  difficulty: string;
  cognitiveDomain: string;
}

export interface WeeklyScore {
  day: string;
  score: number;
}

export interface CognitiveProgress {
  overallScore: number;
  improvementPercentage: number;
  statusDescription: string;
  weeklyTrend: WeeklyScore[];
  gameHistory: CognitiveGameItem[];
}

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  type: 'SOS' | 'MissedMedicine' | 'SafeZoneBreach' | 'HeartRateSpike' | 'info';
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  isResolved: boolean;
  location?: string;
}

export type ActiveTab = 'home' | 'monitoring' | 'reminders' | 'alerts' | 'profile' | 'memory_progress' | 'location';
