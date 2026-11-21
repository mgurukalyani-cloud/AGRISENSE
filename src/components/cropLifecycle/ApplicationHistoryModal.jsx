import React, { useState, useEffect } from 'react';
import { X, History, PlusCircle, CheckCircle2, Calendar, Package, FileText } from 'lucide-react';
import { getCropApplicationLogs, logCropApplication } from '../../services/cropLifecycleService';

export default function ApplicationHistoryModal({ isOpen, onClose, cropRecord, lang = 'en' }) {
  const isTe = lang === 'te';
  const [logs, setLogs] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Fertilizer', // 'Fertilizer', 'Pesticide', 'Bio-fertilizer'
    productName: 'Urea (46% N)',
    quantity: '1.5 bags (67.5 kg)',
    method: 'Top dressing in moist soil',
    notes: 'Applied during active tillering stage'
  });

  useEffect(() => {
    if (cropRecord?.id) {
      setLogs(getCropApplicationLogs(cropRecord.id));
    }
  }, [cropRecord, isOpen]);

  if (!isOpen || !cropRecord) return null;

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const newLog = logCropApplication({
      cropId: cropRecord.id,
      ...formData
    });
    if (newLog) {
      setLogs([newLog, ...logs]);
      setShowAddForm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl my-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isTe ? 'ఎరువులు & పురుగుమందుల వాడకం చరిత్ర' : 'Farm Application History & Field Log'}
              </h3>
              <p className="text-xs text-slate-400">
                {cropRecord.cropId.toUpperCase()} • {cropRecord.areaAcres} {isTe ? 'ఎకరాలు' : 'Acres'} • {cropRecord.location?.village || ''}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Action button */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              {logs.length} {isTe ? 'నమోదు చేయబడిన వాడకాలు' : 'Logged Field Operations'}
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{showAddForm ? (isTe ? 'రద్దు చేయి' : 'Cancel') : (isTe ? 'కొత్త వాడకాన్ని నమోదు చేయి' : 'Log New Application')}</span>
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <form onSubmit={handleAddSubmit} className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/30 space-y-3 animate-in fade-in duration-150">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {isTe ? 'వాడకం వివరాల నమోదు' : 'Record Fertilizer / Spray Application'}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{isTe ? 'తేదీ' : 'Application Date'}</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{isTe ? 'రకం' : 'Category'}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="Fertilizer">Fertilizer (ఎరువులు)</option>
                    <option value="Pesticide">Pesticide / Fungicide (పురుగు / తెగులు మందు)</option>
                    <option value="Bio-stimulant">Bio-stimulant / Micronutrient (సూక్ష్మ పోషకం)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{isTe ? 'మందు / ఎరువు పేరు' : 'Product Applied'}</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="e.g. Urea, DAP, Coragen..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{isTe ? 'వాడిన పరిమాణం' : 'Quantity / Dose'}</label>
                  <input
                    type="text"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g. 2 Bags, 60 ml/ac"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">{isTe ? 'వాడిన పద్ధతి & గమనికలు' : 'Application Notes'}</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Applied in moist soil after de-weeding"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  {isTe ? 'భద్రపరచు' : 'Save Application Log'}
                </button>
              </div>
            </form>
          )}

          {/* Logs List */}
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              {isTe ? 'ఇంకా ఎటువంటి వాడకం నమోదు కాలేదు. పై బటన్ నొక్కి నమోదు చేయండి.' : 'No field applications recorded yet. Click above to log your first fertilizer or spray application.'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {logs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{log.productName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-emerald-400">
                        {log.quantity}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-400">
                        {log.category}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-[11px] text-slate-400">
                        {log.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 shrink-0 font-mono">
                    {log.date}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
