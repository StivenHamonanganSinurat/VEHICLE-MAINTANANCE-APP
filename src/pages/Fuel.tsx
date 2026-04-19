import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Fuel, Plus, Trash2, Calendar, Droplets, DollarSign, Car, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import DeleteModal from '../components/DeleteModal';

interface FuelLog {
  id: string;
  kendaraan_id: string;
  tanggal: string;
  nama_pom: string;
  jenis_bbm: string;
  jumlah_liter: number;
  harga_perliter: number;
  total_harga: number;
  kilometer: number;
  kendaraan?: { plat_nomor: string; jenis_kendaraan: string };
}

interface Vehicle {
  id: string;
  plat_nomor: string;
}

const FUEL_TYPES = [
  { name: 'Pertalite', price: 10000 },
  { name: 'Pertamax', price: 12950 },
  { name: 'Pertamax Turbo', price: 14400 },
  { name: 'Biosolar', price: 6800 },
  { name: 'Dexlite', price: 14550 },
  { name: 'Pertamina Dex', price: 15100 },
  { name: 'Shell Super', price: 14530 },
  { name: 'Shell V-Power', price: 15370 },
  { name: 'Shell V-Power Diesel', price: 15740 },
  { name: 'Lainnya', price: 0 },
];

export default function FuelLogs() {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState<FuelLog | null>(null);
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>('all');
  
  // Add state for deletion
  const [logToDelete, setLogToDelete] = useState<{ id: string; vehicleId: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Raw input states to handle commas and empty values naturally
  const [kmInput, setKmInput] = useState('');
  const [totalInput, setTotalInput] = useState('');
  const [literInput, setLiterInput] = useState('');
  const [priceInput, setPriceInput] = useState('');

  const [formData, setFormData] = useState({
    kendaraan_id: '',
    tanggal: format(new Date(), 'yyyy-MM-dd'),
    nama_pom: '',
    jenis_bbm: '',
    jumlah_liter: 0,
    harga_perliter: 0,
    total_harga: 0,
    kilometer: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const handleFuelTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value;
    const fuel = FUEL_TYPES.find(f => f.name === selectedType);
    const newPrice = fuel ? fuel.price : formData.harga_perliter;
    
    setPriceInput(newPrice.toString());
    
    setFormData(prev => {
      const updated = {
        ...prev,
        jenis_bbm: selectedType,
        harga_perliter: newPrice,
      };
      
      // If user had a total price set, update liters based on new fuel price
      if (newPrice > 0 && prev.total_harga > 0) {
        const newLiters = prev.total_harga / newPrice;
        updated.jumlah_liter = newLiters;
        setLiterInput(newLiters.toFixed(3));
      }
      
      return updated;
    });
  };

  const handlePriceInputChange = (val: string) => {
    setPriceInput(val);
    const price = parseInt(val) || 0;
    const total = formData.total_harga;
    
    setFormData(prev => ({
      ...prev,
      harga_perliter: price,
      jumlah_liter: price > 0 ? (total / price) : prev.jumlah_liter
    }));

    if (price > 0 && total > 0) {
      setLiterInput((total / price).toFixed(3));
    }
  };

  const handleTotalInputChange = (val: string) => {
    setTotalInput(val);
    const total = parseInt(val) || 0;
    const price = formData.harga_perliter;
    
    setFormData(prev => ({
      ...prev,
      total_harga: total,
      jumlah_liter: price > 0 ? (total / price) : prev.jumlah_liter
    }));

    if (price > 0) {
      setLiterInput((total / price).toFixed(3));
    }
  };

  const handleLiterInputChange = (val: string) => {
    setLiterInput(val);
    const liters = parseFloat(val) || 0;
    const total = Math.round(liters * formData.harga_perliter);
    
    setFormData(prev => ({
      ...prev,
      jumlah_liter: liters,
      total_harga: total
    }));
    setTotalInput(total === 0 ? '' : total.toString());
  };

  const handleKMInputChange = (val: string) => {
    // Standardize input: replace comma with dot for internal parsing if user still types it
    const cleanVal = val.replace(',', '.');
    setKmInput(cleanVal);
    const km = parseFloat(cleanVal) || 0;
    setFormData(prev => ({ ...prev, kilometer: km }));
  };

  function handleEdit(log: FuelLog) {
    setEditingLog(log);
    setFormData({
      kendaraan_id: log.kendaraan_id,
      tanggal: log.tanggal,
      nama_pom: log.nama_pom,
      jenis_bbm: log.jenis_bbm,
      jumlah_liter: log.jumlah_liter,
      harga_perliter: log.harga_perliter,
      total_harga: log.total_harga,
      kilometer: log.kilometer,
    });
    
    setKmInput(log.kilometer.toString());
    setTotalInput(log.total_harga.toString());
    setLiterInput(log.jumlah_liter.toString());
    setPriceInput(log.harga_perliter.toString());
    
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingLog(null);
    setFormData({
      kendaraan_id: '',
      tanggal: format(new Date(), 'yyyy-MM-dd'),
      nama_pom: '',
      jenis_bbm: '',
      jumlah_liter: 0,
      harga_perliter: 0,
      total_harga: 0,
      kilometer: 0,
    });
    setKmInput('');
    setTotalInput('');
    setLiterInput('');
    setPriceInput('');
  }

  async function fetchData() {
    setLoading(true);
    const { data: vehiclesData } = await supabase.from('kendaraan').select('id, plat_nomor');
    setVehicles(vehiclesData || []);

    const { data: logsData, error } = await supabase
      .from('bahan_bakar')
      .select('*, kendaraan(plat_nomor, jenis_kendaraan)')
      .order('tanggal', { ascending: false });
    
    if (error) console.error(error);
    else setLogs(logsData || []);
    setLoading(false);
  }

  // Removed general logic to handle complex priorities
  // Logic moved to direct handlers for better UX control

  async function syncVehicleKM(vehicleId: string) {
    if (!vehicleId) return;
    
    // Ambil log BBM dengan tanggal terbaru (desc) untuk kendaraan ini
    const { data: latestLogs, error: logError } = await supabase
      .from('bahan_bakar')
      .select('kilometer')
      .eq('kendaraan_id', vehicleId)
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    if (logError) {
      console.error('Gagal fetch log terbaru untuk sinkronisasi:', logError);
      return;
    }

    const latestKM = (latestLogs && latestLogs.length > 0) ? latestLogs[0].kilometer : 0;

    // Update paksa ke tabel kendaraan
    await supabase
      .from('kendaraan')
      .update({ kilometer: latestKM })
      .eq('id', vehicleId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.kendaraan_id) return alert('Pilih kendaraan!');
    
    setLoading(true);
    try {
      // Pastikan payload bersih (hanya kolom database)
      const payload = {
        kendaraan_id: formData.kendaraan_id,
        tanggal: formData.tanggal,
        nama_pom: formData.nama_pom,
        jenis_bbm: formData.jenis_bbm,
        jumlah_liter: parseFloat(formData.jumlah_liter.toString()) || 0,
        harga_perliter: parseInt(formData.harga_perliter.toString()) || 0,
        total_harga: parseInt(formData.total_harga.toString()) || 0,
        kilometer: parseFloat(formData.kilometer.toString()) || 0,
      };

      let result;
      if (editingLog) {
        result = await supabase
          .from('bahan_bakar')
          .update(payload)
          .eq('id', editingLog.id);
      } else {
        result = await supabase.from('bahan_bakar').insert([payload]);
      }

      if (result.error) throw result.error;

      // Sinkronisasi sinkron (tunggu sampai selesai)
      await syncVehicleKM(formData.kendaraan_id);
      
      handleCancelForm();
      await fetchData();
      alert('Data berhasil disimpan!');
    } catch (err) {
      console.error('Database Error:', err);
      alert(`Gagal menyimpan: ${err instanceof Error ? err.message : 'Error tidak diketahui'}`);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!logToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('bahan_bakar').delete().eq('id', logToDelete.id);
      if (error) throw error;
      
      await syncVehicleKM(logToDelete.vehicleId);
      await fetchData();
      setLogToDelete(null);
    } catch (err) {
      console.error('Delete Error:', err);
      alert('Gagal menghapus: ' + (err instanceof Error ? err.message : 'Error tidak diketahui'));
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredLogs = fuelTypeFilter === 'all' 
    ? logs 
    : logs.filter(log => log.jenis_bbm === fuelTypeFilter);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-text-black tracking-tighter uppercase italic">
            Log <span className="text-dark-green">Bahan Bakar</span>
          </h1>
          <p className="text-gray-600">Catatan pengisian bahan bakar kendaraan Anda.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border-2 border-dark-green rounded px-2 py-1">
            <label className="text-[10px] font-bold uppercase text-gray-400">Filter:</label>
            <select 
              className="text-xs font-bold bg-transparent focus:outline-none"
              value={fuelTypeFilter}
              onChange={(e) => setFuelTypeFilter(e.target.value)}
            >
              <option value="all">Semua Jenis BBM</option>
              {FUEL_TYPES.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </div>
          
          <button 
            onClick={() => {
              if (showForm) handleCancelForm();
              else setShowForm(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            {showForm ? 'Batal' : <><Plus size={20} /> Tambah Log</>}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card bg-white"
          >
            <h2 className="text-xl font-bold mb-4">{editingLog ? 'Edit Log BBM' : 'Tambah Log BBM'}</h2>
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
                <label className="text-xs font-bold uppercase mb-1">Tanggal</label>
                <input
                  required
                  type="date"
                  className="input-field"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1">Nama SPBU</label>
                <input
                  required
                  className="input-field"
                  placeholder="Contoh: Pertamina Pasti Pas"
                  value={formData.nama_pom}
                  onChange={(e) => setFormData({ ...formData, nama_pom: e.target.value })}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1">Jenis BBM</label>
                <select
                  required
                  className="input-field"
                  value={formData.jenis_bbm}
                  onChange={handleFuelTypeChange}
                >
                  <option value="">-- Pilih Jenis BBM --</option>
                  {FUEL_TYPES.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1">Harga per Liter</label>
                <input
                  required
                  type="number"
                  className="input-field"
                  value={priceInput}
                  onChange={(e) => handlePriceInputChange(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1">Total Bayar (Rp)</label>
                <input
                  required
                  type="number"
                  className="input-field font-bold text-dark-green"
                  placeholder="Contoh: 36000"
                  value={totalInput}
                  onChange={(e) => handleTotalInputChange(e.target.value)}
                />
              </div>
              <div className="flex flex-col border-2 border-dashed border-gray-200 p-2 rounded bg-gray-50">
                <label className="text-xs font-bold uppercase mb-1">Jumlah Liter (Otomatis)</label>
                <input
                  required
                  type="text"
                  inputMode="decimal"
                  className="bg-transparent font-black text-xl focus:outline-none"
                  value={literInput}
                  onChange={(e) => handleLiterInputChange(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1">KM Saat Ini</label>
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
              <div className="flex items-end lg:col-span-2 gap-2">
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Menyimpan...' : (editingLog ? 'Update Log BBM' : 'Simpan Log BBM')}
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

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-dark-green text-white">
              <th className="p-4 text-xs font-bold uppercase tracking-widest">Tanggal</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest">Kendaraan</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest">SPBU / BBM</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest">Kilometer</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest">Jumlah</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest">Total Biaya</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500 italic">Memuat data...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500 italic">Belum ada catatan pengisian BBM untuk filter ini.</td></tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-neon-green/5 transition-colors">
                  <td className="p-4 font-medium">{format(new Date(log.tanggal), 'dd MMM yyyy')}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Car size={14} className="text-dark-green" />
                      <span className="font-bold">{log.kendaraan?.plat_nomor}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold">{log.nama_pom}</p>
                    <p className="text-xs text-gray-500">{log.jenis_bbm}</p>
                  </td>
                  <td className="p-4 font-bold text-dark-green">
                    {log.kilometer} KM
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 font-bold">
                      <Droplets size={14} className="text-blue-500" />
                      <span>{log.jumlah_liter} L</span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium italic">@ Rp {(log.harga_perliter || 0).toLocaleString('id-ID')}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 font-black text-dark-green text-lg">
                      <span>Rp {(log.total_harga || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(log)}
                        className="text-gray-400 hover:text-dark-green transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => setLogToDelete({ id: log.id, vehicleId: log.kendaraan_id })}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <DeleteModal
        isOpen={!!logToDelete}
        onClose={() => setLogToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Hapus Log BBM"
        message="Apakah Anda yakin ingin menghapus catatan pengisian BBM ini? Angka KM kendaraan akan disinkronkan ulang."
      />
    </div>
  );
}
