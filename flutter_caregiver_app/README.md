# Caregiver Dashboard - Flutter (Material 3)
## SIH 2026: AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients

This repository contains the complete production-ready **Flutter Caregiver Dashboard** built according to the SIH 2026 specification with Material 3 healthcare theming and ready-to-plug Firebase Firestore & Authentication hooks.

---

### 🌟 Implemented Features

1. **Caregiver Home Dashboard** (`lib/screens/home_dashboard_screen.dart`)
   - "Good Morning, Caregiver" welcome header with notification status.
   - Patient Profile Card: Live photo, name, age, blood group, dementia stage, and dynamic status badge (**Safe / Needs Attention / Emergency**).
   - 4 Core Health Summary Cards: **Heart Rate (BPM), Sleep Hours, Water Intake (ml / target), Today's Steps**.
   - Medicine completion progress indicator.
   - Today's memory game score with weekly percentage improvement pill.
   - Upcoming doctor's appointment card with hospital & clinic time.
   - Recent caregiver safety alerts feed.

2. **Patient Monitoring Screen** (`lib/screens/monitoring_screen.dart`)
   - Wearable sync indicator & last active timestamp.
   - Interactive Patient Mood Tracker (**Happy / Calm / Confused / Agitated**) with immediate observation logging.
   - Activity status grid: Walk, Meals, Hydration, Sleep quality.
   - Daily health timeline showing morning vitals, breakfast medication, cognitive gaming, hydration, and evening routines.

3. **Reminder Management Screen** (`lib/screens/reminders_screen.dart`)
   - Full CRUD: Add, edit, toggle, and swipe-to-delete reminders.
   - Interactive Time Picker and Repeat selector (**Daily, Twice a day, Weekly, Custom**).
   - Category filtering: **Medicine, Water, Appointment**.

4. **Memory Progress Screen** (`lib/screens/memory_progress_screen.dart`)
   - Weekly Cognitive Score Index with +8.5% stabilization tag.
   - 7-day cognitive performance chart with day-by-day score bars.
   - Memory game session history (**Family Face-Name Association, Daily Object Recall, Sequential Matching, 1960s Music & Voice Trivia**).
   - Cognitive domain tags, duration, and difficulty ratings.

5. **Emergency & Safety Screen** (`lib/screens/alerts_screen.dart`)
   - High-priority large **SOS alert card** with confirmation dialog.
   - Patient left safe zone & missed medicine alerts.
   - Dummy **Call Caregiver** and **Share Location** action triggers.
   - Emergency contacts directory with primary caregiver indicators.

6. **Location Monitoring Screen** (`lib/screens/location_screen.dart`)
   - Google Maps placeholder with safe zone geofence radius indicator (350m perimeter).
   - Live location coordinates and sector status.
   - Geofence breach alarm toggle.

7. **Patient Profile Screen** (`lib/screens/profile_screen.dart`)
   - Medical history timeline.
   - Allergies and contraindications warning list.
   - Blood group and FAST dementia staging.
   - Primary attending neuro-geriatrician details.
   - Editable Caregiver behavioral notes section with persistence hook.

8. **Navigation Structure**
   - Material 3 Bottom Navigation Bar: **Home | Monitoring | Reminders | Alerts | Profile**.

---

### 🚀 Running the Flutter App

```bash
# Get dependencies
flutter pub get

# Run on connected device or Chrome
flutter run
```

---

### 🔥 Firebase Firestore Integration Steps

The app is completely structured with a clean service layer in `lib/services/firestore_service.dart`.
To connect real Firestore collections:

1. Add your `google-services.json` to `android/app/` and `GoogleService-Info.plist` to `ios/Runner/`.
2. In `pubspec.yaml`, uncomment `firebase_core`, `cloud_firestore`, and `firebase_auth`.
3. In `lib/main.dart`, initialize Firebase:
   ```dart
   WidgetsFlutterBinding.ensureInitialized();
   await Firebase.initializeApp();
   ```
4. In `lib/services/firestore_service.dart`, connect the pre-annotated stream methods to your Cloud Firestore collections (`patients`, `dailyMetrics`, `reminders`, `safetyAlerts`).
