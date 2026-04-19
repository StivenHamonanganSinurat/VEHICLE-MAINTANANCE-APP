import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wrench, Plus, Trash2, Calendar, Hash, DollarSign, Car, Settings, Edit2 } from 'lucide-react';
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
  
  // State for deletion
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Raw input states
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
      console.error('Submit Error:', err);
      alert(`Gagal menyimpan log: ${err instanceof Error ? err.message : 'Terjadi kesalahan'}`);
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
      console.error('Delete Error:', err);
      alert('Gagal menghapus: ' + (err instanceof Error ? err.message : 'Error tidak diketahui'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-text-black tracking-tighter uppercase italic">
            Riwayat <span className="text-dark-green">Service</span>
          </h1>
          <p className="text-gray-600">Catatan perawatan dan perbaikan kendaraan Anda.</p>
        </div>
        <button 
          onClick={() => {
            if (showForm) handleCancelForm();
            else setShowForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? 'Batal' : <><Plus size={20} /> Tambah Log Service</>}
        </button>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card bg-white"
          >
            <h2 className="text-xl font-bold mb-4">{editingLog ? 'Edit Log Service' : 'Tambah Log Service'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1">Pilih Kendaraan</label>
                <select
                  required
                  className="input-field"
                  value={formData.kendaraan_id}
                  onChange={(e) => setFormData({ ...formData, kendaraan_id: e.target.value })}
                >
                  <option value="">-- Pilih Kendaraan --</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.plat_nomor}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1">Tanggal Service</label>
                <input
                  required
                  type="date"
                  className="input-field"
                  value={formData.tanggal_service}
                  onChange={(e) => setFormData({ ...formData, tanggal_service: e.target.value })}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1">Kilometer Saat Service</label>
                <input
                  required
                  type="text"
                  inputMode="decimal"
                  className="input-field font-bold text-dark-green"
                  placeholder="Contoh: 12500,5"
                  value={kmInput}
                  onChange={(e) => handleKMInputChange(e.target.value)}
                />
              </div>
              <div className="flex flex-col lg:col-span-2">
                <label className="text-xs font-bold uppercase mb-1">Jenis Service / Perbaikan</label>
                <input
                  required
                  className="input-field"
                  placeholder="Contoh: Ganti Oli, Servis Rutin, Ganti Ban"
                  value={formData.jenis_service}
                  onChange={(e) => setFormData({ ...formData, jenis_service: e.target.value })}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1">Biaya Service</label>
                <input
                  required
                  type="number"
                  className="input-field"
                  placeholder="Contoh: 150000"
                  value={biayaInput}
                  onChange={(e) => handleBiayaInputChange(e.target.value)}
                />
              </div>
              <div className="flex items-end lg:col-span-3 gap-2">
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Menyimpan...' : (editingLog ? 'Update Log Service' : 'Simpan Log Service')}
                </button>
                <button 
                  type="button"
                  onClick={handleCancelForm}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-400 font-bold rounded hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-center py-12 text-dark-green font-bold">Memuat data...</div>
        ) : logs.length === 0 ? (
          <div className="card text-center py-12">
            <Wrench className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">Belum ada riwayat service.</p>
          </div>
        ) : (
          logs.map((log) => (
            <motion.div
              layout
              key={log.id}
              className="card flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="bg-dark-green p-4 rounded-xl text-neon-green">
                  <Wrench size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase">{log.jenis_service}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1 font-bold text-dark-green">
                      <Car size={14} /> {log.kendaraan?.plat_nomor}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> {format(new Date(log.tanggal_service), 'dd MMMM yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash size={14} /> {log.kilometer_service} KM
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                <div className="text-right">
                  <p className="text-xs font-bold uppercase text-gray-400">Total Biaya</p>
                  <p className="text-2xl font-black text-dark-green">Rp {log.biaya.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 border-l pl-4">
                  <button 
                    onClick={() => handleEdit(log)}
                    className="p-2 text-gray-400 hover:text-dark-green transition-colors"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button 
                    onClick={() => setLogToDelete(log.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
      <DeleteModal
        isOpen={!!logToDelete}
        onClose={() => setLogToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Hapus Log Service"
        message="Apakah Anda yakin ingin menghapus catatan riwayat service ini secara permanen?"
      />
    </div>
  );
}
