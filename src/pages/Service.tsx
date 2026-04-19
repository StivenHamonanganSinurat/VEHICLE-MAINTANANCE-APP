import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wrench, Plus, Trash2, Calendar, Hash, DollarSign, Car, Settings, Edit2, ShieldCheck, ChevronRight, Gauge, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import DeleteModal from '../components/DeleteModal';

interface ServiceLog {
  id: string;
  kendaraan_id: string;
  tanggal_service: string;
  kilometer_service: number;
  jenis_service: string;
  biaya: number;
  kendaraan?: { plat_nomor: string; jenis_kendaraan: string };
}

interface Vehicle {
  id: string;
  plat_nomor: string;
}

export default function ServiceLogs() {
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState<ServiceLog | null>(null);
  
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [kmInput, setKmInput] = useState('');
  const [biayaInput, setBiayaInput] = useState('');

  const [formData, setFormData] = useState({
    kendaraan_id: '',
    tanggal_service: format(new Date(), 'yyyy-MM-dd'),
    kilometer_service: 0,
    jenis_service: '',
    biaya: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: vehiclesData } = await supabase.from('kendaraan').select('id, plat_nomor');
    setVehicles(vehiclesData || []);

    const { data: logsData, error } = await supabase
      .from('service')
      .select('*, kendaraan(plat_nomor, jenis_kendaraan)')
      .order('tanggal_service', { ascending: false });
    
    if (error) console.error(error);
    else setLogs(logsData || []);
    setLoading(false);
  }

  function handleEdit(log: ServiceLog) {
    setEditingLog(log);
    setFormData({
      kendaraan_id: log.kendaraan_id,
      tanggal_service: log.tanggal_service,
      kilometer_service: log.kilometer_service,
      jenis_service: log.jenis_service,
      biaya: log.biaya,
    });
    setKmInput(log.kilometer_service.toString());
    setBiayaInput(log.biaya.toString());
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleKMInputChange = (val: string) => {
    setKmInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      setFormData(prev => ({ ...prev, kilometer_service: parsed }));
    }
  };

  const handleBiayaInputChange = (val: string) => {
    setBiayaInput(val);
    setFormData(prev => ({ ...prev, biaya: parseInt(val) || 0 }));
  };

  function handleCancelForm() {
    setShowForm(false);
    setEditingLog(null);
    setFormData({
      kendaraan_id: '',
      tanggal_service: format(new Date(), 'yyyy-MM-dd'),
      kilometer_service: 0,
      jenis_service: '',
      biaya: 0,
    });
    setKmInput('');
    setBiayaInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.kendaraan_id) return alert('Pilih kendaraan!');
    
    setLoading(true);
    try {
      if (editingLog) {
        const { error } = await supabase
          .from('service')
          .update({
            kendaraan_id: formData.kendaraan_id,
            tanggal_service: formData.tanggal_service,
            kilometer_service: formData.kilometer_service,
            jenis_service: formData.jenis_service,
            biaya: formData.biaya,
          })
          .eq('id', editingLog.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('service').insert([{
          kendaraan_id: formData.kendaraan_id,
          tanggal_service: formData.tanggal_service,
          kilometer_service: formData.kilometer_service,
          jenis_service: formData.jenis_service,
          biaya: formData.biaya,
        }]);
        if (error) throw error;
      }

      handleCancelForm();
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!logToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('service').delete().eq('id', logToDelete);
      if (error) throw error;
      await fetchData();
      setLogToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-text-black tracking-tighter uppercase italic">
            Log <span className="text-purple-600">Service</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{logs.length} Total Perawatan</p>
          </div>
        </div>
        
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (showForm) handleCancelForm();
            else setShowForm(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-black uppercase italic tracking-tight shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all"
        >
          {showForm ? 'Batal' : <><Plus size={20} /> Input Service</>}
        </motion.button>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-3xl p-6 shadow-xl border-2 border-purple-500/5 overflow-hidden"
          >
            <h2 className="text-xl font-black uppercase italic text-purple-600 mb-6">{editingLog ? 'Edit Data Service' : 'Registrasi Service Baru'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Pilih Unit</label>
                  <select
                    required
                    className="w-full bg-light-gray border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-xl px-4 py-3 outline-none font-bold transition-all"
                    value={formData.kendaraan_id}
                    onChange={(e) => setFormData({ ...formData, kendaraan_id: e.target.value })}
                  >
                    <option value="">-- Pilih --</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plat_nomor}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Tanggal Service</label>
                  <input
                    required
                    type="date"
                    className="w-full bg-light-gray border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-xl px-4 py-3 outline-none font-bold transition-all"
                    value={formData.tanggal_service}
                    onChange={(e) => setFormData({ ...formData, tanggal_service: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Kilometer Saat Ini</label>
                  <input
                    required
                    type="text"
                    inputMode="decimal"
                    className="w-full bg-light-gray border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-xl px-4 py-3 outline-none font-bold transition-all"
                    placeholder="12500"
                    value={kmInput}
                    onChange={(e) => handleKMInputChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Deskripsi Perbaikan / Jenis Service</label>
                    <input
                      required
                      className="w-full bg-light-gray border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-xl px-4 py-3 outline-none font-bold placeholder:font-normal transition-all"
                      placeholder="Ganti Oli, Service Rutin, Rem, dll"
                      value={formData.jenis_service}
                      onChange={(e) => setFormData({ ...formData, jenis_service: e.target.value })}
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Total Pengeluaran (Rp)</label>
                    <input
                      required
                      type="number"
                      className="w-full bg-purple-50 border-2 border-purple-200 focus:border-purple-500 focus:bg-white rounded-xl px-4 py-3 outline-none font-black text-purple-700 transition-all text-xl"
                      placeholder="150000"
                      value={biayaInput}
                      onChange={(e) => handleBiayaInputChange(e.target.value)}
                    />
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading}
                  className="flex-grow bg-purple-600 text-white font-black uppercase italic tracking-widest py-4 rounded-xl shadow-lg shadow-purple-500/20"
                >
                  {loading ? 'Processing...' : (editingLog ? 'Simpan Update' : 'Registrasi Log')}
                </motion.button>
                <button 
                  type="button"
                  onClick={handleCancelForm}
                  className="px-8 py-4 font-bold uppercase text-gray-400 hover:text-text-black transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {loading && !showForm ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
             <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Maintenance History...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white border-4 border-dashed border-gray-100 rounded-[32px] text-center py-24 px-6">
            <div className="bg-purple-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Wrench size={40} className="text-purple-200" />
            </div>
            <h3 className="text-xl font-black uppercase italic text-text-black mb-2">History Kosong</h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">Kendaraan Anda belum tercatat melakukan service. Rutin melakukan service menjaga performa unit.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {logs.map((log, idx) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                key={log.id}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all group flex flex-col md:flex-row md:items-center gap-6"
              >
                {/* Visual Icon Box */}
                <div className="bg-purple-600 h-16 w-16 rounded-[22px] flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-500/20 rotate-3 group-hover:rotate-0 transition-transform">
                   <ShieldCheck size={32} />
                </div>

                {/* Description Area */}
                <div className="flex-grow space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black uppercase italic text-text-black leading-tight tracking-tighter">{log.jenis_service}</h3>
                    <span className="bg-light-gray px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
                      <Car size={10} strokeWidth={3} /> {log.kendaraan?.plat_nomor}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><Calendar size={14} className="text-purple-500" /> {format(new Date(log.tanggal_service), 'dd MMMM yyyy')}</div>
                    <div className="flex items-center gap-1.5"><Gauge size={14} className="text-purple-500" /> {log.kilometer_service.toLocaleString()} KM</div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-8">
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-purple-600 block leading-none mb-1">Maintenance Cost</span>
                    <h4 className="text-2xl font-black italic tracking-tighter text-text-black">
                       <span className="text-xs font-normal not-italic text-gray-400 mr-1">Rp</span>
                       {log.biaya.toLocaleString()}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(log)}
                      className="p-3 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-2xl transition-all"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button 
                      onClick={() => setLogToDelete(log.id)}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="absolute right-0 top-0 p-1 md:hidden">
                    <ChevronRight size={16} className="text-gray-200" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <DeleteModal
        isOpen={!!logToDelete}
        onClose={() => setLogToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Hapus History Service"
        message="Yakin ingin menghapus catatan perawatan ini? Data biaya perbaikan akan hilang dari laporan analisis."
      />
    </div>
  );
}
