import React, { useState } from 'react';
import { ReminderCategory, ReminderItem } from '../types';
import { X, Clock, Pill, Droplet, Calendar } from 'lucide-react';

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: ReminderItem) => void;
  existingReminder?: ReminderItem | null;
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingReminder,
}) => {
  const [title, setTitle] = useState(existingReminder?.title || '');
  const [category, setCategory] = useState<ReminderCategory>(existingReminder?.category || 'Medicine');
  const [time, setTime] = useState(existingReminder?.time || '09:00 AM');
  const [dosage, setDosage] = useState(existingReminder?.dosageOrDetail || '');
  const [repeat, setRepeat] = useState(existingReminder?.repeat || 'Daily');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newReminder: ReminderItem = {
      id: existingReminder?.id || `rem_${Date.now()}`,
      title: title.trim(),
      category,
      time,
      dosageOrDetail: dosage.trim() || (category === 'Medicine' ? '1 dose after food' : 'Regular interval'),
      repeat,
      isCompleted: existingReminder?.isCompleted || false,
    };

    onSave(newReminder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">
            {existingReminder ? 'Edit Caregiver Reminder' : 'Add New Patient Reminder'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Medicine', 'Water', 'Appointment'] as ReminderCategory[]).map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'Medicine' && <Pill className="w-3.5 h-3.5" />}
                    {cat === 'Water' && <Droplet className="w-3.5 h-3.5" />}
                    {cat === 'Appointment' && <Calendar className="w-3.5 h-3.5" />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {category === 'Medicine'
                ? 'Medicine Name & Strength'
                : category === 'Water'
                ? 'Hydration Description'
                : 'Appointment / Visit Title'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                category === 'Medicine'
                  ? 'e.g. Donepezil 5mg'
                  : category === 'Water'
                  ? 'e.g. Mid-Morning Electrolyte Water'
                  : 'e.g. Dr. Sharma Memory Assessment'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Dosage / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {category === 'Medicine' ? 'Dosage & Instructions' : 'Detail Notes / Location'}
            </label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder={
                category === 'Medicine'
                  ? 'e.g. 1 Tablet after breakfast with water'
                  : 'e.g. Apollo Geriatric Room 304'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Time Picker & Repeat */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Scheduled Time</span>
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 08:30 AM"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Repeat Frequency
              </label>
              <select
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
              >
                <option value="Daily">Daily</option>
                <option value="Twice a day">Twice a day</option>
                <option value="Every 2 hours">Every 2 hours</option>
                <option value="Weekly">Weekly</option>
                <option value="One-time">One-time</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-reminder-submit-btn"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-200 transition-colors"
            >
              {existingReminder ? 'Update' : 'Create Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
