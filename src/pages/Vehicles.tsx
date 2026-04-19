import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Car, Plus, Trash2, Calendar, Hash, Palette, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DeleteModal from '../components/DeleteModal';

interface Vehicle {
  id: string;
  plat_nomor: string;
  jenis_kendaraan: string;
  tahun: number;
  kilometer: number;
  warna: string;
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
    
    // Self-healing: Update KM for each vehicle based on latest Fuel Log
    const updatedVehicles = await Promise.all((vData || []).map(async (v) => {
      const { data: latestLog } = await supabase
        .from('bahan_bakar')
        .select('kilometer')
        .eq('kendaraan_id', v.id)
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);

      const latestKM = latestLog && latestLog.length > 0 ? latestLog[0].kilometer : v.kilometer;

      // If mismatch, sync to DB
      if (latestKM !== v.kilometer) {
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
      setFormData({ plat_nomor: '', jenis_kendaraan: '', tahun: new Date().getFullYear(), kilometer: 0, warna: '' });
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
    setFormData({ plat_nomor: '', jenis_kendaraan: '', tahun: new Date().getFullYear(), kilometer: 0, warna: '' });
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-text-black tracking-tighter uppercase italic">
            Manajemen <span className="text-dark-green">Kendaraan</span>
          </h1>
          <p className="text-gray-600">Daftar kendaraan yang terdaftar dalam sistem.</p>
        </div>
        <button 
          onClick={() => {
            if (showForm) handleCancel();
            else setShowForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? 'Batal' : <><Plus size={20} /> Tambah Kendaraan</>}
        </button>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card bg-white"
          >
            <h2 className="text-xl font-bold mb-4">{editingVehicle ? 'Edit Kendaraan' : 'Tambah Kendaraan Baru'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1">Plat Nomor</label>
                <input
                  required
                  className="input-field"
                  placeholder="Contoh: B 1234 ABC"
                  value={formData.plat_nomor}
                  onChange={(e) => setFormData({ ...formData, plat_nomor: e.target.value })}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1">Jenis Kendaraan</label>
                <input
                  required
                  className="input-field"
                  placeholder="Contoh: Honda Vario"
                  value={formData.jenis_kendaraan}
                  onChange={(e) => setFormData({ ...formData, jenis_kendaraan: e.target.value })}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1">Tahun</label>
                <input
                  required
                  type="number"
                  className="input-field"
                  value={formData.tahun === 0 ? '' : formData.tahun}
                  onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) || 0 })}
                />
              </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase mb-1">Kilometer Saat Ini (Otomatis)</label>
                    <input
                      readOnly
                      type="text"
                      className="input-field bg-gray-100 cursor-not-allowed font-bold text-dark-green"
                      placeholder="Terisi otomatis dari log BBM"
                      value={formData.kilometer.toString()}
                    />
                  </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1">Warna</label>
                <input
                  required
                  className="input-field"
                  placeholder="Contoh: Hitam"
                  value={formData.warna}
                  onChange={(e) => setFormData({ ...formData, warna: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className="btn-primary flex-1">
                  {editingVehicle ? 'Update Kendaraan' : 'Simpan Kendaraan'}
                </button>
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-400 font-bold rounded hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-12 text-dark-green font-bold">Memuat kendaraan...</div>
      ) : vehicles.length === 0 ? (
        <div className="card text-center py-12">
          <Car className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">Belum ada kendaraan. Silakan tambah kendaraan pertama Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <motion.div
              layout
              key={vehicle.id}
              className="card group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 flex gap-1">
                <button 
                  onClick={() => handleEdit(vehicle)}
                  className="p-1 text-gray-400 hover:text-dark-green transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => setVehicleToDelete(vehicle.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-neon-green p-3 rounded-lg">
                  <Car className="text-text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">{vehicle.plat_nomor}</h3>
                  <p className="text-sm text-dark-green font-bold">{vehicle.jenis_kendaraan}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} className="text-dark-green" />
                  <span>Tahun {vehicle.tahun}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Hash size={16} className="text-dark-green" />
                  <span>{vehicle.kilometer} KM</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Palette size={16} className="text-dark-green" />
                  <span>Warna {vehicle.warna}</span>
                </div>
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
