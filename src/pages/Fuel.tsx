import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Fuel, Plus, Trash2, Calendar, Droplets, DollarSign, Car, Edit2, Search, Filter, Hash, Gauge, MapPin, ChevronRight } from 'lucide-react';
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
  
  const [logToDelete, setLogToDelete] = useState<{ id: string; vehicleId: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  async function syncVehicleKM(vehicleId: string) {
    if (!vehicleId) return;
    
    const { data: latestLogs, error: logError } = await supabase
      .from('bahan_bakar')
      .select('kilometer')
      .eq('kendaraan_id', vehicleId)
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    if (logError) return;

    const latestKM = (latestLogs && latestLogs.length > 0) ? latestLogs[0].kilometer : 0;

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

      if (editingLog) {
        const { error } = await supabase.from('bahan_bakar').update(payload).eq('id', editingLog.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bahan_bakar').insert([payload]);
        if (error) throw error;
      }

      await syncVehicleKM(formData.kendaraan_id);
      handleCancelForm();
      await fetchData();
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
      const { error } = await supabase.from('bahan_bakar').delete().eq('id', logToDelete.id);
      if (error) throw error;
      await syncVehicleKM(logToDelete.vehicleId);
      await fetchData();
      setLogToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredLogs = fuelTypeFilter === 'all' 
    ? logs 
    : logs.filter(log => log.jenis_bbm === fuelTypeFilter);

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-text-black tracking-tighter uppercase italic">
            Log <span className="text-orange-500">BBM</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{logs.length} Catatan Entry</p>
          </div>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-2">
          <div className="flex-grow sm:flex-grow-0 relative">
             <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <select 
                className="w-full sm:w-auto pl-10 pr-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-xs font-bold uppercase focus:border-orange-500 outline-none transition-all"
                value={fuelTypeFilter}
                onChange={(e) => setFuelTypeFilter(e.target.value)}
              >
                <option value="all">Semua BBM</option>
                {FUEL_TYPES.filter(f => f.name !== 'Lainnya').map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
              </select>
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (showForm) handleCancelForm();
              else setShowForm(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-black uppercase italic tracking-tight shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"
          >
            {showForm ? 'Batal' : <><Plus size={20} /> Entry Baru</>}
          </motion.button>
        </div>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-3xl p-6 shadow-xl border-2 border-orange-500/5 overflow-hidden"
          >
            <h2 className="text-xl font-black uppercase italic text-orange-600 mb-6">{editingLog ? 'Edit Catatan' : 'Input Pembelian BBM'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Pilih Unit</label>
                  <select
                    required
                    className="w-full bg-light-gray border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-xl px-4 py-3 outline-none font-bold transition-all"
                    value={formData.kendaraan_id}
                    onChange={(e) => setFormData({ ...formData, kendaraan_id: e.target.value })}
                  >
                    <option value="">-- Pilih --</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plat_nomor}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Tanggal</label>
                  <input
                    required
                    type="date"
                    className="w-full bg-light-gray border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-xl px-4 py-3 outline-none font-bold transition-all"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Jenis Bahan Bakar</label>
                  <select
                    required
                    className="w-full bg-light-gray border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-xl px-4 py-3 outline-none font-bold transition-all"
                    value={formData.jenis_bbm}
                    onChange={handleFuelTypeChange}
                  >
                    <option value="">-- Pilih --</option>
                    {FUEL_TYPES.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Nama SPBU (Lokasi)</label>
                  <input
                    required
                    className="w-full bg-light-gray border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-xl px-4 py-3 outline-none font-bold transition-all"
                    placeholder="Contoh: Pertamina 31.xxx"
                    value={formData.nama_pom}
                    onChange={(e) => setFormData({ ...formData, nama_pom: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-orange-600/50 ml-1">Harga / Liter</label>
                  <input
                    required
                    type="number"
                    className="w-full bg-white border-2 border-transparent focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-black text-orange-600 transition-all"
                    value={priceInput}
                    onChange={(e) => handlePriceInputChange(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-orange-600/50 ml-1">Total Bayar (Rp)</label>
                  <input
                    required
                    type="number"
                    className="w-full bg-white border-2 border-orange-500 rounded-xl px-4 py-3 outline-none font-black text-orange-600 transition-all text-xl"
                    placeholder="36000"
                    value={totalInput}
                    onChange={(e) => handleTotalInputChange(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-orange-600/50 ml-1">Liter (Auto)</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-orange-100/50 border-2 border-transparent rounded-xl px-4 py-3 outline-none font-black text-orange-900 transition-all"
                    value={literInput}
                    onChange={(e) => handleLiterInputChange(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-orange-600/50 ml-1">Odometer (KM)</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-white border-2 border-transparent focus:border-orange-500 rounded-xl px-4 py-3 outline-none font-black text-orange-600 transition-all"
                    placeholder="12500"
                    value={kmInput}
                    onChange={(e) => handleKMInputChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading}
                  className="flex-grow bg-orange-500 text-white font-black uppercase italic tracking-widest py-4 rounded-xl shadow-lg shadow-orange-500/20"
                >
                  {loading ? 'Processing...' : (editingLog ? 'Update Catatan' : 'Simpan Log BBM')}
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
             <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Fetching Fuel Logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white border-4 border-dashed border-gray-100 rounded-[32px] text-center py-24 px-6">
            <div className="bg-orange-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Fuel size={40} className="text-orange-200" />
            </div>
            <h3 className="text-xl font-black uppercase italic text-text-black mb-2">BBM Kosong</h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">Anda belum mencatat pengisian bbm. Klik tombol "Entry Baru" untuk memulai pencatatan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLogs.map((log, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={log.id}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-xl transition-all group flex flex-col md:flex-row md:items-center gap-6"
              >
                {/* Date & Vehicle Info */}
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className="bg-light-gray h-12 w-12 rounded-2xl flex flex-col items-center justify-center text-text-black shrink-0">
                    <span className="text-[8px] font-black uppercase leading-none opacity-50">{format(new Date(log.tanggal), 'MMM')}</span>
                    <span className="text-xl font-black leading-none mt-1">{format(new Date(log.tanggal), 'dd')}</span>
                  </div>
                  <div>
                    <h3 className="font-black italic uppercase text-text-black leading-tight flex items-center gap-2">
                       {log.kendaraan?.plat_nomor}
                       <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">{log.jenis_bbm}</span>
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{log.kendaraan?.jenis_kendaraan}</p>
                  </div>
                </div>

                {/* Main Stats Area */}
                <div className="grid grid-cols-2 md:grid-cols-3 flex-grow gap-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-bold uppercase text-gray-400 mb-1 flex items-center gap-1"><Gauge size={10} /> Odometer</span>
                      <span className="font-black text-sm text-dark-green tracking-tight">{log.kilometer.toLocaleString()} KM</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-bold uppercase text-gray-400 mb-1 flex items-center gap-1"><Droplets size={10} /> Volume</span>
                      <span className="font-black text-sm tracking-tight">{log.jumlah_liter} <span className="text-[10px] font-normal uppercase">Liter</span></span>
                   </div>
                   <div className="flex flex-col col-span-2 md:col-span-1">
                      <span className="text-[8px] font-bold uppercase text-gray-400 mb-1 flex items-center gap-1"><MapPin size={10} /> Lokasi</span>
                      <span className="font-black text-xs text-text-black truncate uppercase tracking-tight">{log.nama_pom}</span>
                   </div>
                </div>

                {/* Price Summary & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6">
                   <div className="text-right">
                      <span className="text-[8px] font-black uppercase text-orange-500 block">Total Biaya</span>
                      <h4 className="text-2xl font-black italic tracking-tighter text-text-black">
                         <span className="text-xs font-normal not-italic text-gray-400 mr-1">Rp</span>
                         {log.total_harga.toLocaleString()}
                      </h4>
                   </div>
                   
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(log)}
                        className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button 
                        onClick={() => setLogToDelete({ id: log.id, vehicleId: log.kendaraan_id })}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                   </div>
                   
                   <ChevronRight className="text-gray-200 md:hidden" />
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
        title="Hapus Catatan BBM"
        message="Yakin ingin menghapus catatan bbm ini? KM kendaraan akan dikembalikan ke catatan sebelumnya."
      />
    </div>
  );
}
