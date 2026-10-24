import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  History,
  Download,
  Trash2,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Volume2,
  Filter
} from 'lucide-react';
import { getDetectionHistory, clearDetectionHistory } from '../../services/animalSoundService';
import { safePlayer } from '../../services/safeAudioPlayer';

export default function DetectionHistoryTable({ lastEventTrigger, newEvent }) {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getDetectionHistory({ limit: 100 });
      if (data && data.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.warn('[DetectionHistoryTable] Load history error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [lastEventTrigger]);

  useEffect(() => {
    if (newEvent) {
      setEvents((prev) => {
        const id = newEvent.eventId || newEvent.id;
        if (!id || prev.some((e) => (e.eventId || e.id) === id)) return prev;
        return [newEvent, ...prev];
      });
    }
  }, [newEvent]);

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all recorded audio detection logs?')) {
      await clearDetectionHistory();
      setEvents([]);
    }
  };

  const handleExportCsv = () => {
    if (events.length === 0) {
      alert('No events to export.');
      return;
    }

    const headers = [
      'Event ID',
      'Timestamp',
      'Predicted Category',
      'Species Name',
      'Confidence (%)',
      'Event Source',
      'Action Taken',
      'Alert Status',
      'Dominant Frequency (Hz)',
      'Status Message'
    ];

    const rows = events.map((e) => [
      `"${e.id || e.eventId || ''}"`,
      `"${e.timestamp || ''}"`,
      `"${e.category || ''}"`,
      `"${e.species_name || e.predicted_class || ''}"`,
      `"${e.confidence !== null && e.confidence !== undefined ? e.confidence : 'N/A'}"`,
      `"${e.source || 'Live Farm Microphone'}"`,
      `"${e.action_taken || e.action || ''}"`,
      `"${e.status || ''}"`,
      `"${e.audio_metrics?.dominant_frequency_hz || ''}"`,
      `"${(e.status_message || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `agrisense_animal_sound_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEvents = events.filter((e) => {
    if (filterCategory !== 'all') {
      if (filterCategory === 'beneficial' && e.category !== 'beneficial') return false;
      if (filterCategory === 'harmful' && e.category !== 'harmful') return false;
      if (filterCategory === 'uncertain' && !e.is_uncertain && e.category !== 'unknown') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (e.species_name || e.predicted_class || '').toLowerCase();
      const action = (e.action_taken || '').toLowerCase();
      if (!name.includes(q) && !action.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-emerald-900/10 shadow-sm space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/10">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            {t('animalRepellent.historyTitle', 'Bio-Acoustic Event Audit Log')}
          </h3>
          <p className="text-xs text-slate-500">
            Historical log of identified animal calls, confidence levels, and repellent activations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={events.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleClearHistory}
            disabled={events.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: `All Events (${events.length})` },
            { id: 'harmful', label: 'Harmful Pests' },
            { id: 'beneficial', label: 'Protected Beneficial' },
            { id: 'uncertain', label: 'Uncertain / Low Conf' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterCategory(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterCategory === f.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by species or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-56"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px]">
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Predicted Category</th>
              <th className="py-2.5 px-3">Confidence</th>
              <th className="py-2.5 px-3">Event Source</th>
              <th className="py-2.5 px-3">Action Taken</th>
              <th className="py-2.5 px-3">Alert Status</th>
              <th className="py-2.5 px-3 text-right">Audio Output</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  No animal events recorded yet. Turn on live listening or test an animal sound from the soundboard above.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => {
                const isBeneficial = evt.category === 'beneficial';
                const isHarmful = evt.category === 'harmful';
                const isUncertain = evt.is_uncertain || evt.category === 'unknown';
                const alertStatus = evt.status || (isBeneficial ? 'Protected Exemption' : isHarmful ? 'Active Alert' : isUncertain ? 'Uncertain Event' : 'Silent Log');

                return (
                  <tr key={evt.id || evt.eventId} className="hover:bg-slate-50/60 transition-colors">
                    {/* 1. Timestamp */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {evt.timestamp || 'Just now'}
                    </td>

                    {/* 2. Predicted Category & Species */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isBeneficial
                            ? 'bg-emerald-100 text-emerald-800'
                            : isHarmful
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isBeneficial && <ShieldCheck className="w-3 h-3" />}
                          {isHarmful && <ShieldAlert className="w-3 h-3" />}
                          {evt.category || 'Unknown'}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          {evt.species_name || evt.predicted_class}
                        </span>
                      </div>
                    </td>

                    {/* 3. Confidence */}
                    <td className="py-3 px-3">
                      {evt.confidence !== null && evt.confidence !== undefined ? (
                        <span className={`font-mono font-black ${
                          evt.confidence >= 80 ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {evt.confidence}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px] italic">
                          N/A (Simulated)
                        </span>
                      )}
                    </td>

                    {/* 4. Event Source */}
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {evt.source || 'Edge PyTorch Model'}
                      </span>
                    </td>

                    {/* 5. Action Taken */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 text-[11px]">
                        {evt.action_taken || evt.action || 'None'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">
                        {evt.status_message}
                      </div>
                    </td>

                    {/* 6. Alert Status */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black ${
                        alertStatus.includes('Active Alert')
                          ? 'bg-rose-100 text-rose-800'
                          : alertStatus.includes('Protected')
                          ? 'bg-emerald-100 text-emerald-800'
                          : alertStatus.includes('Cooldown')
                          ? 'bg-amber-100 text-amber-800'
                          : alertStatus.includes('Uncertain')
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {alertStatus}
                      </span>
                    </td>

                    {/* 7. Audio Output / Replay */}
                    <td className="py-3 px-3 text-right">
                      {evt.deterrent_details ? (
                        <button
                          onClick={() =>
                            safePlayer.playSound(
                              evt.deterrent_details.sound_file,
                              evt.deterrent_details.description,
                              evt.deterrent_details.duration_sec || 3.0
                            )
                          }
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] transition-colors cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Replay</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300">Silenced</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
