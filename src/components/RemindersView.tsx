import React, { useState } from 'react';
import { ReminderCategory, ReminderItem } from '../types';
import {
  Plus,
  Pill,
  Droplet,
  Calendar,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  Clock,
  Repeat,
  Sparkles
} from 'lucide-react';

interface RemindersViewProps {
  reminders: ReminderItem[];
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onOpenAddModal: (reminder?: ReminderItem) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  onToggleReminder,
  onDeleteReminder,
  onOpenAddModal,
}) => {
  const [filter, setFilter] = useState<'All' | ReminderCategory>('All');

  const filtered = reminders.filter((r) => {
    if (filter === 'All') return true;
    return r.category === filter;
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Reminders & Schedule
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Medication, hydration & appointment alerts
          </p>
        </div>
        <button
          onClick={() => onOpenAddModal()}
          id="add-new-reminder-top-btn"
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['All', 'Medicine', 'Water', 'Appointment'] as const).map((cat) => {
          const isSelected = filter === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Reminders List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No {filter} Reminders</p>
            <p className="text-xs text-slate-500 mt-1">
              Tap "Add Reminder" above to create a new schedule item.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isMed = item.category === 'Medicine';
            const isWater = item.category === 'Water';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-3.5 border transition-all ${
                  item.isCompleted
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox toggle */}
                  <button
                    onClick={() => onToggleReminder(item.id)}
                    className="mt-0.5 text-emerald-600 hover:scale-110 transition-transform shrink-0"
                  >
                    {item.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 fill-emerald-100 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-emerald-500" />
                    )}
                  </button>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isMed
                            ? 'bg-emerald-50 text-emerald-700'
                            : isWater
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {isMed && <Pill className="w-3 h-3" />}
                        {isWater && <Droplet className="w-3 h-3" />}
                        {!isMed && !isWater && <Calendar className="w-3 h-3" />}
                        {item.category}
                      </span>
                      <span className="text-xs font-black text-slate-900 ml-auto">
                        {item.time}
                      </span>
                    </div>

                    <h4
                      className={`text-sm font-bold truncate ${
                        item.isCompleted
                          ? 'text-slate-400 line-through'
                          : 'text-slate-900'
                      }`}
                    >
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.dosageOrDetail}</p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Repeat className="w-3 h-3" />
                        <span>{item.repeat}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenAddModal(item)}
                          className="text-slate-400 hover:text-slate-700 p-1"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteReminder(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
