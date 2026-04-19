import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Car, Plus, Trash2, Calendar, Hash, Palette, Edit2, ChevronRight, Gauge, Bike, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DeleteModal from '../components/DeleteModal';

interface Vehicle {
  id: string;
  plat_nomor: string;
  jenis_kendaraan: string;
  tahun: number;
  kilometer: number;
  warna: string;
  roda: number;
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
  // State for deletion
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    plat_nomor: '',
    jenis_kendaraan: '',
    tahun: new Date().getFullYear(),
    kilometer: 0,
    warna: '',
    roda: 4,
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  async function fetchVehicles() {
    setLoading(true);
    const { data: vData, error } = await supabase.from('kendaraan').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    
    // Self-healing: Update Odometer based on the latest Fuel OR Service log
    const updatedVehicles = await Promise.all((vData || []).map(async (v) => {
      // Get latest Fuel KM
      const { data: latestFuel } = await supabase
        .from('bahan_bakar')
        .select('kilometer')
        .eq('kendaraan_id', v.id)
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);

      // Get latest Service KM
      const { data: latestService } = await supabase
        .from('service')
        .select('kilometer_service')
        .eq('kendaraan_id', v.id)
        .order('tanggal_service', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);

      const fuelKM = (latestFuel && latestFuel.length > 0) ? latestFuel[0].kilometer : 0;
      const serviceKM = (latestService && latestService.length > 0) ? latestService[0].kilometer_service : 0;
      
      // Use the maximum value across all logs and current value
      const latestKM = Math.max(fuelKM, serviceKM, v.kilometer);

      // If mismatch (and latestKM > v.kilometer), sync to DB
      if (latestKM > v.kilometer) {
        await supabase.from('kendaraan').update({ kilometer: latestKM }).eq('id', v.id);
        return { ...v, kilometer: latestKM };
      }
      return v;
    }));

    setVehicles(updatedVehicles);
    setLoading(false);
  }

  function handleEdit(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setFormData({
      plat_nomor: vehicle.plat_nomor,
      jenis_kendaraan: vehicle.jenis_kendaraan,
      tahun: vehicle.tahun,
      kilometer: vehicle.kilometer,
      warna: vehicle.warna,
      roda: vehicle.roda || 4,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingVehicle) {
        const { error } = await supabase
          .from('kendaraan')
          .update(formData)
          .eq('id', editingVehicle.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kendaraan').insert([formData]);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingVehicle(null);
      setFormData({ plat_nomor: '', jenis_kendaraan: '', tahun: new Date().getFullYear(), kilometer: 0, warna: '', roda: 4 });
      fetchVehicles();
    } catch (err) {
      console.error('Supabase Error:', err);
      alert(`Gagal menyimpan kendaraan: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!vehicleToDelete) return;
    
    setIsDeleting(true);
    try {
      // Manual cascade deletion to ensure CRUD works even if DB constraints aren't set to CASCADE
      await supabase.from('bahan_bakar').delete().eq('kendaraan_id', vehicleToDelete);
      await supabase.from('service').delete().eq('kendaraan_id', vehicleToDelete);
      
      const { error } = await supabase.from('kendaraan').delete().eq('id', vehicleToDelete);
      if (error) throw error;
      
      await fetchVehicles();
      setVehicleToDelete(null);
    } catch (err) {
      console.error('Delete Error:', err);
      alert('Gagal menghapus: ' + (err instanceof Error ? err.message : 'Error tidak diketahui'));
    } finally {
      setIsDeleting(false);
    }
  }

  function handleCancel() {
    setShowForm(false);
    setEditingVehicle(null);
    setFormData({ plat_nomor: '', jenis_kendaraan: '', tahun: new Date().getFullYear(), kilometer: 0, warna: '', roda: 4 });
  }

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-text-black tracking-tighter uppercase italic">
            Garasi <span className="text-dark-green">Saya</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Total {vehicles.length} Kendaraan Tersimpan</p>
        </div>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (showForm) handleCancel();
            else setShowForm(true);
          }}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black uppercase italic tracking-tight transition-all shadow-lg ${
            showForm 
              ? 'bg-white border-2 border-dark-green text-dark-green' 
              : 'bg-dark-green text-white hover:bg-neon-green hover:text-text-black'
          }`}
        >
          {showForm ? 'Batal' : <><Plus size={20} /> Kendaraan Baru</>}
        </motion.button>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl p-6 shadow-xl border-2 border-dark-green/5"
          >
            <h2 className="text-xl font-black uppercase italic text-dark-green mb-6">{editingVehicle ? 'Edit Detail Kendaraan' : 'Daftarkan Kendaraan Baru'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Plat Nomor</label>
                  <input
                    required
                    className="w-full bg-light-gray border-2 border-transparent focus:border-neon-green focus:bg-white rounded-xl px-4 py-3 outline-none font-bold uppercase placeholder:normal-case transition-all"
                    placeholder="B 1234 ABC"
                    value={formData.plat_nomor}
                    onChange={(e) => setFormData({ ...formData, plat_nomor: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Merk / Tipe</label>
                  <input
                    required
                    className="w-full bg-light-gray border-2 border-transparent focus:border-neon-green focus:bg-white rounded-xl px-4 py-3 outline-none font-bold transition-all"
                    placeholder="Toyota Gran Max"
                    value={formData.jenis_kendaraan}
                    onChange={(e) => setFormData({ ...formData, jenis_kendaraan: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Tahun</label>
                  <input
                    required
                    type="number"
                    className="w-full bg-light-gray border-2 border-transparent focus:border-neon-green focus:bg-white rounded-xl px-4 py-3 outline-none font-bold transition-all"
                    value={formData.tahun === 0 ? '' : formData.tahun}
                    onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Warna</label>
                  <input
                    required
                    className="w-full bg-light-gray border-2 border-transparent focus:border-neon-green focus:bg-white rounded-xl px-4 py-3 outline-none font-bold transition-all"
                    placeholder="Hitam"
                    value={formData.warna}
                    onChange={(e) => setFormData({ ...formData, warna: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Konfigurasi Roda</label>
                  <select
                    required
                    className="w-full bg-light-gray border-2 border-transparent focus:border-neon-green focus:bg-white rounded-xl px-4 py-3 outline-none font-bold transition-all appearance-none"
                    value={formData.roda}
                    onChange={(e) => setFormData({ ...formData, roda: parseInt(e.target.value) })}
                  >
                    <option value={2}>Roda 2 (Motor / Sepeda Motor)</option>
                    <option value={3}>Roda 3 (Bemo / Bajaj / Bentor)</option>
                    <option value={4}>Roda 4 (Mobil / MPV / SUV / Sedan)</option>
                    <option value={6}>Roda 6 (Truk Engkel / Bus Medium)</option>
                    <option value={8}>Roda 8 (Truk Tronton / Large Bus)</option>
                    <option value={10}>Roda 10 (Truk / Trailer / Tronton)</option>
                    <option value={12}>Roda 12 (Trailer / Heavy Duty)</option>
                    <option value={14}>Roda 14 (Trailer / Heavy Duty)</option>
                    <option value={16}>Roda 16+ (Heavy Equipment / Logistic)</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Odometer / Kilometer</label>
                  <div className="relative">
                    <Gauge size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-green" />
                    <input
                      required
                      type="text"
                      inputMode="decimal"
                      className="w-full bg-light-gray border-2 border-transparent focus:border-neon-green focus:bg-white rounded-xl pl-10 pr-4 py-3 outline-none font-bold transition-all"
                      placeholder="0"
                      value={formData.kilometer}
                      onChange={(e) => {
                        const val = e.target.value.replace(',', '.');
                        setFormData({ ...formData, kilometer: parseFloat(val) || 0 });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  className="flex-grow btn-primary py-4 rounded-xl shadow-neon-green/20 shadow-lg"
                >
                  {editingVehicle ? 'Simpan Perubahan' : 'Daftarkan Kendaraan'}
                </motion.button>
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="px-8 py-4 font-bold uppercase text-gray-400 hover:text-text-black transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && !showForm ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
           <div className="w-10 h-10 border-4 border-neon-green border-t-transparent rounded-full animate-spin" />
           <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Fleet...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white border-4 border-dashed border-gray-100 rounded-[32px] text-center py-24 px-6">
          <div className="bg-light-gray w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Car size={40} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-black uppercase italic text-text-black mb-2">Belum Ada Unit</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">Silakan tambahkan kendaraan pertama Anda untuk mulai melakukan monitoring aktivitas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles.map((vehicle, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              key={vehicle.id}
              className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 hover:shadow-2xl transition-all group relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="bg-dark-green h-12 w-12 rounded-2xl flex items-center justify-center text-neon-green shadow-xl">
                  {vehicle.roda === 2 ? <Bike size={24} strokeWidth={2.5} /> : 
                   vehicle.roda >= 6 ? <Truck size={24} strokeWidth={2.5} /> : 
                   <Car size={24} strokeWidth={2.5} />}
                </div>
                <div className="flex bg-light-gray p-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(vehicle)}
                    className="p-2 text-gray-500 hover:text-dark-green transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => setVehicleToDelete(vehicle.id)}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-8">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black tracking-tighter uppercase italic text-text-black leading-none">{vehicle.plat_nomor}</h3>
                  <span className="bg-neon-green/20 text-dark-green text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Roda {vehicle.roda || 4}</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-dark-green opacity-70">{vehicle.jenis_kendaraan}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 py-4 border-t border-b border-gray-50">
                 <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold uppercase text-gray-400 mb-1">Tahun</span>
                    <span className="font-black text-sm">{vehicle.tahun}</span>
                 </div>
                 <div className="flex flex-col items-center border-l border-r border-gray-100">
                    <span className="text-[9px] font-bold uppercase text-gray-400 mb-1">Kilometer</span>
                    <span className="font-black text-sm text-dark-green">{vehicle.kilometer.toLocaleString()}</span>
                 </div>
                 <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold uppercase text-gray-400 mb-1">Warna</span>
                    <span className="font-black text-sm">{vehicle.warna}</span>
                 </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                 <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: vehicle.warna.toLowerCase() === 'hitam' ? '#000' : vehicle.warna.toLowerCase() === 'putih' ? '#fff' : vehicle.warna.toLowerCase() === 'merah' ? '#f00' : '#ddd' }}></div>
                 </div>
                 <button 
                  onClick={() => handleEdit(vehicle)}
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase italic text-dark-green group/btn"
                 >
                    Detail Info <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                 </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      <DeleteModal
        isOpen={!!vehicleToDelete}
        onClose={() => setVehicleToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Hapus Kendaraan"
        message="Apakah Anda yakin ingin menghapus kendaraan ini? Perlu diingat bahwa semua data Log BBM dan Service yang terkait dengan kendaraan ini juga akan terhapus secara permanen."
      />
    </div>
  );
}
