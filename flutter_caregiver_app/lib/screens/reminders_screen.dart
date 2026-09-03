import 'package:flutter/material.dart';
import '../models/reminder_model.dart';
import '../services/firestore_service.dart';
import '../theme/app_theme.dart';

/// Screen 3: Reminder Management Screen
/// Features:
/// - Medicine list, Appointment reminders, Water reminders
/// - Add / Edit / Delete reminders
/// - Time picker integration
/// - Repeat options (Daily, Twice a day, Weekly, Custom)
class ReminderManagementScreen extends StatefulWidget {
  const ReminderManagementScreen({Key? key}) : super(key: key);

  @override
  State<ReminderManagementScreen> createState() => _ReminderManagementScreenState();
}

class _ReminderManagementScreenState extends State<ReminderManagementScreen> {
  final FirestoreCaregiverService _service = FirestoreCaregiverService();
  String _selectedFilter = 'All'; // 'All', 'Medicine', 'Water', 'Appointment'

  void _showAddEditReminderDialog([ReminderModel? existing]) {
    final titleController = TextEditingController(text: existing?.title ?? '');
    final dosageController = TextEditingController(text: existing?.dosageOrDetail ?? '');
    String selectedCategory = existing?.category ?? 'Medicine';
    String selectedTime = existing?.time ?? '09:00 AM';
    String selectedRepeat = existing?.repeat ?? 'Daily';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        existing != null ? 'Edit Reminder' : 'Add New Reminder',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textDark,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Category Selection Tabs
                  Row(
                    children: ['Medicine', 'Water', 'Appointment'].map((cat) {
                      final isSelected = selectedCategory == cat;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => setModalState(() => selectedCategory = cat),
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: isSelected ? AppTheme.primaryGreenLight : AppTheme.backgroundLight,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSelected ? AppTheme.primaryGreen : AppTheme.cardBorderColor,
                              ),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              cat,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                color: isSelected ? AppTheme.primaryGreenDark : AppTheme.textDark,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),

                  // Title TextField
                  TextField(
                    controller: titleController,
                    decoration: InputDecoration(
                      labelText: selectedCategory == 'Medicine'
                          ? 'Medicine Name (e.g. Donepezil 5mg)'
                          : selectedCategory == 'Water'
                              ? 'Hydration Title (e.g. Morning Water 300ml)'
                              : 'Appointment Title (e.g. Dr. Sharma Visit)',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Dosage / Detail
                  TextField(
                    controller: dosageController,
                    decoration: InputDecoration(
                      labelText: selectedCategory == 'Medicine'
                          ? 'Dosage Instructions (e.g. 1 Tablet after food)'
                          : 'Additional Notes / Clinic Location',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Time Picker & Repeat Row
                  Row(
                    children: [
                      // Time Picker
                      Expanded(
                        child: InkWell(
                          onTap: () async {
                            final pickedTime = await showTimePicker(
                              context: context,
                              initialTime: const TimeOfDay(hour: 9, minute: 0),
                            );
                            if (pickedTime != null) {
                              setModalState(() {
                                final period = pickedTime.period == DayPeriod.am ? 'AM' : 'PM';
                                final hour = pickedTime.hourOfPeriod.toString().padLeft(2, '0');
                                final min = pickedTime.minute.toString().padLeft(2, '0');
                                selectedTime = '$hour:$min $period';
                              });
                            }
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              border: Border.all(color: AppTheme.cardBorderColor),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.access_time_rounded, size: 18, color: AppTheme.medicalBlue),
                                const SizedBox(width: 8),
                                Text(selectedTime, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),

                      // Repeat Dropdown
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            border: Border.all(color: AppTheme.cardBorderColor),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: selectedRepeat,
                              isExpanded: true,
                              items: ['Daily', 'Twice a day', 'Weekly', 'Custom']
                                  .map((r) => DropdownMenuItem(
                                        value: r,
                                        child: Text(r, style: const TextStyle(fontSize: 13)),
                                      ))
                                  .toList(),
                              onChanged: (val) {
                                if (val != null) setModalState(() => selectedRepeat = val);
                              },
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Save Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        if (titleController.text.trim().isEmpty) return;

                        final newReminder = ReminderModel(
                          id: existing?.id ?? 'rem_${DateTime.now().millisecondsSinceEpoch}',
                          title: titleController.text.trim(),
                          category: selectedCategory,
                          time: selectedTime,
                          dosageOrDetail: dosageController.text.trim().isEmpty
                              ? (selectedCategory == 'Medicine' ? 'Take as directed' : 'Standard Routine')
                              : dosageController.text.trim(),
                          repeat: selectedRepeat,
                          isCompleted: existing?.isCompleted ?? false,
                        );

                        // [FIRESTORE CONNECTION]: Saves to Firestore
                        await _service.addReminder(newReminder);
                        if (mounted) {
                          Navigator.pop(context);
                          setState(() {});
                        }
                      },
                      child: Text(existing != null ? 'Update Reminder' : 'Create Reminder'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final reminders = _service.currentReminders;
    final filtered = reminders.where((r) {
      if (_selectedFilter == 'All') return true;
      return r.category == _selectedFilter;
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Reminders & Schedule'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddEditReminderDialog(),
        backgroundColor: AppTheme.primaryGreen,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('Add Reminder', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          // Filter Chips (All, Medicine, Water, Appointment)
          Container(
            color: AppTheme.surfaceWhite,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: ['All', 'Medicine', 'Water', 'Appointment'].map((filter) {
                  final isSelected = _selectedFilter == filter;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(filter),
                      selected: isSelected,
                      selectedColor: AppTheme.primaryGreenLight,
                      labelStyle: TextStyle(
                        color: isSelected ? AppTheme.primaryGreenDark : AppTheme.textDark,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        fontSize: 13,
                      ),
                      onSelected: (val) {
                        setState(() => _selectedFilter = filter);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const Divider(height: 1, color: AppTheme.cardBorderColor),

          // Reminder List
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.event_available_rounded, size: 54, color: AppTheme.textMuted.withOpacity(0.4)),
                        const SizedBox(height: 12),
                        Text(
                          'No $_selectedFilter reminders scheduled',
                          style: const TextStyle(color: AppTheme.textMuted, fontSize: 14),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final item = filtered[index];
                      return _buildReminderCard(item);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildReminderCard(ReminderModel item) {
    IconData getIcon() {
      switch (item.category) {
        case 'Water':
          return Icons.water_drop_rounded;
        case 'Appointment':
          return Icons.calendar_month_rounded;
        case 'Medicine':
        default:
          return Icons.medication_rounded;
      }
    }

    Color getColor() {
      switch (item.category) {
        case 'Water':
          return AppTheme.medicalBlue;
        case 'Appointment':
          return const Color(0xFF8B5CF6);
        case 'Medicine':
        default:
          return AppTheme.primaryGreenDark;
      }
    }

    final categoryColor = getColor();

    return Dismissible(
      key: Key(item.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppTheme.statusEmergency,
          borderRadius: BorderRadius.circular(14),
        ),
        child: const Icon(Icons.delete_outline_rounded, color: Colors.white),
      ),
      onDismissed: (direction) async {
        // [FIRESTORE CONNECTION]: Deletes reminder from Firestore
        await _service.deleteReminder(item.id);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Deleted "${item.title}"')),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.surfaceWhite,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: item.isCompleted ? AppTheme.primaryGreen.withOpacity(0.4) : AppTheme.cardBorderColor,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Checkbox to toggle completion
            Checkbox(
              value: item.isCompleted,
              activeColor: AppTheme.primaryGreen,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
              onChanged: (val) async {
                await _service.toggleReminder(item.id);
                setState(() {});
              },
            ),
            const SizedBox(width: 8),

            // Reminder Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: categoryColor.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(getIcon(), size: 12, color: categoryColor),
                            const SizedBox(width: 4),
                            Text(
                              item.category,
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: categoryColor),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      Text(
                        item.time,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textDark),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: item.isCompleted ? AppTheme.textMuted : AppTheme.textDark,
                      decoration: item.isCompleted ? TextDecoration.lineThrough : null,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    item.dosageOrDetail,
                    style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.repeat_rounded, size: 12, color: AppTheme.textMuted),
                      const SizedBox(width: 4),
                      Text(item.repeat, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                    ],
                  ),
                ],
              ),
            ),

            // Edit Popup Menu
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert_rounded, size: 20, color: AppTheme.textMuted),
              onSelected: (val) {
                if (val == 'edit') {
                  _showAddEditReminderDialog(item);
                } else if (val == 'delete') {
                  _service.deleteReminder(item.id);
                  setState(() {});
                }
              },
              itemBuilder: (ctx) => [
                const DropdownMenuItem(value: 'edit', child: Text('Edit')),
                const DropdownMenuItem(value: 'delete', child: Text('Delete', style: TextStyle(color: AppTheme.statusEmergency))),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
