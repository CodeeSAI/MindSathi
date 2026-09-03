/// Model representing the Elderly Dementia Patient
/// Ready for Firebase Firestore conversion with `fromFirestore` and `toFirestore`.
class PatientModel {
  final String id;
  final String fullName;
  final int age;
  final String gender;
  final String dementiaStage; // "Mild Cognitive Impairment", "Moderate Stage", "Advanced Stage"
  final String status; // "Safe", "Needs Attention", "Emergency"
  final String photoUrl;
  final String bloodGroup;
  final List<String> allergies;
  final List<String> medicalHistory;
  final DoctorContact primaryDoctor;
  final List<EmergencyContact> emergencyContacts;
  final String caregiverNotes;
  final String safeZoneName;
  final double currentLatitude;
  final double currentLongitude;
  final String lastKnownLocation;
  final DateTime lastActiveTime;
  final DateTime lastLocationUpdate;

  PatientModel({
    required this.id,
    required this.fullName,
    required this.age,
    required this.gender,
    required this.dementiaStage,
    required this.status,
    required this.photoUrl,
    required this.bloodGroup,
    required this.allergies,
    required this.medicalHistory,
    required this.primaryDoctor,
    required this.emergencyContacts,
    required this.caregiverNotes,
    required this.safeZoneName,
    required this.currentLatitude,
    required this.currentLongitude,
    required this.lastKnownLocation,
    required this.lastActiveTime,
    required this.lastLocationUpdate,
  });

  /// Factory constructor to parse Dummy JSON or Firestore Document
  factory PatientModel.fromJson(Map<String, dynamic> json) {
    return PatientModel(
      id: json['id'] ?? 'patient_001',
      fullName: json['fullName'] ?? 'Margaret Henderson',
      age: json['age'] ?? 78,
      gender: json['gender'] ?? 'Female',
      dementiaStage: json['dementiaStage'] ?? 'Moderate Stage (Stage 4)',
      status: json['status'] ?? 'Safe',
      photoUrl: json['photoUrl'] ?? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
      bloodGroup: json['bloodGroup'] ?? 'O+',
      allergies: List<String>.from(json['allergies'] ?? ['Penicillin', 'Peanuts']),
      medicalHistory: List<String>.from(json['medicalHistory'] ?? [
        'Diagnosed Early Alzheimer’s (2023)',
        'Hypertension (controlled)',
        'Mild Osteoarthritis',
        'Cataract surgery (2021)'
      ]),
      primaryDoctor: DoctorContact.fromJson(json['primaryDoctor'] ?? {}),
      emergencyContacts: (json['emergencyContacts'] as List? ?? [])
          .map((e) => EmergencyContact.fromJson(e))
          .toList(),
      caregiverNotes: json['caregiverNotes'] ??
          'Patient responds very well to classical music in the morning. Keep lighting bright before sunset to reduce sundowning confusion.',
      safeZoneName: json['safeZoneName'] ?? 'Greenwood Care Home & Garden (Radius: 250m)',
      currentLatitude: (json['currentLatitude'] as num?)?.toDouble() ?? 28.6139,
      currentLongitude: (json['currentLongitude'] as num?)?.toDouble() ?? 77.2090,
      lastKnownLocation: json['lastKnownLocation'] ?? 'Sunlit Garden Courtyard, Sector 4',
      lastActiveTime: json['lastActiveTime'] != null
          ? DateTime.parse(json['lastActiveTime'])
          : DateTime.now().subtract(const Duration(minutes: 8)),
      lastLocationUpdate: json['lastLocationUpdate'] != null
          ? DateTime.parse(json['lastLocationUpdate'])
          : DateTime.now().subtract(const Duration(minutes: 3)),
    );
  }

  /// Prepare map for Firebase Firestore storage
  Map<String, dynamic> toFirestore() {
    return {
      'fullName': fullName,
      'age': age,
      'gender': gender,
      'dementiaStage': dementiaStage,
      'status': status,
      'photoUrl': photoUrl,
      'bloodGroup': bloodGroup,
      'allergies': allergies,
      'medicalHistory': medicalHistory,
      'primaryDoctor': primaryDoctor.toJson(),
      'emergencyContacts': emergencyContacts.map((c) => c.toJson()).toList(),
      'caregiverNotes': caregiverNotes,
      'safeZoneName': safeZoneName,
      'currentLatitude': currentLatitude,
      'currentLongitude': currentLongitude,
      'lastKnownLocation': lastKnownLocation,
      'lastActiveTime': lastActiveTime.toIso8601String(),
      'lastLocationUpdate': lastLocationUpdate.toIso8601String(),
    };
  }
}

class DoctorContact {
  final String name;
  final String specialization;
  final String hospital;
  final String phone;
  final String nextAppointment;

  DoctorContact({
    required this.name,
    required this.specialization,
    required this.hospital,
    required this.phone,
    required this.nextAppointment,
  });

  factory DoctorContact.fromJson(Map<String, dynamic> json) {
    return DoctorContact(
      name: json['name'] ?? 'Dr. Rajesh Sharma',
      specialization: json['specialization'] ?? 'Consultant Neuro-Geriatrician',
      hospital: json['hospital'] ?? 'Apollo Geriatric & Memory Clinic',
      phone: json['phone'] ?? '+91 98765 43210',
      nextAppointment: json['nextAppointment'] ?? 'Thursday, 4:30 PM (Memory Assessment)',
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'specialization': specialization,
        'hospital': hospital,
        'phone': phone,
        'nextAppointment': nextAppointment,
      };
}

class EmergencyContact {
  final String name;
  final String relationship;
  final String phone;
  final bool isPrimary;

  EmergencyContact({
    required this.name,
    required this.relationship,
    required this.phone,
    required this.isPrimary,
  });

  factory EmergencyContact.fromJson(Map<String, dynamic> json) {
    return EmergencyContact(
      name: json['name'] ?? 'Sarah Jenkins',
      relationship: json['relationship'] ?? 'Daughter & Primary Caregiver',
      phone: json['phone'] ?? '+91 98111 22334',
      isPrimary: json['isPrimary'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'relationship': relationship,
        'phone': phone,
        'isPrimary': isPrimary,
      };
}
