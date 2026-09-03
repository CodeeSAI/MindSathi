import React from 'react';
import { CognitiveProgress } from '../types';
import { Brain, TrendingUp, Award, Clock, Sparkles, ChevronLeft } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

interface MemoryProgressViewProps {
  progress: CognitiveProgress;
  onBack?: () => void;
}

export const MemoryProgressView: React.FC<MemoryProgressViewProps> = ({
  progress,
  onBack,
}) => {
  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-2 pt-1">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Cognitive & Memory Progress
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            AI-based game performance & memory retention index
          </p>
        </div>
      </div>

      {/* 1. Overall Cognitive Index Card */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 text-white shadow-lg shadow-emerald-900/15">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            Weekly Cognitive Index
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold text-emerald-100">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{progress.improvementPercentage}% This Week</span>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-black">{progress.overallScore}</span>
          <span className="text-sm font-semibold text-emerald-200">/ 100</span>
          <span className="ml-auto text-xs font-bold px-2 py-1 rounded bg-emerald-900/40 text-emerald-300">
            Status: STABLE
          </span>
        </div>

        <p className="text-xs text-emerald-100/90 leading-relaxed bg-black/15 p-2.5 rounded-xl">
          {progress.statusDescription}
        </p>
      </div>

      {/* 2. 7-Day Cognitive Score Chart */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">7-Day Score Trend</h3>
            <p className="text-xs text-slate-500">Daily cognitive evaluation results</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            Target: 80+
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progress.weeklyTrend} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(val) => [`${val ?? 0} pts`, 'Score']}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {progress.weeklyTrend.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.day === 'Sun' ? '#059669' : '#0284c7'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Memory Game History */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Memory Game Sessions History</span>
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            {progress.gameHistory.length} Sessions
          </span>
        </div>

        <div className="space-y-2.5">
          {progress.gameHistory.map((game) => (
            <div
              key={game.id}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-slate-900">{game.gameName}</h4>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {game.score}/{game.maxScore} pts
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-semibold">
                  {game.cognitiveDomain}
                </span>
                <span>• {game.difficulty}</span>
                <span>• {game.duration}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{game.playedTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
