import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Car, Plus, Trash2, Calendar, Hash, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    const { data, error } = await supabase.from('kendaraan').select('*').order('created_at', { ascending: false });
    if (error) console.error(error);
    else setVehicles(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('kendaraan').insert([formData]);
      if (error) {
        console.error('Supabase Error:', error);
        alert(`Gagal menambah kendaraan: ${error.message} (${error.code || 'No Code'})`);
      } else {
        setShowForm(false);
        setFormData({ plat_nomor: '', jenis_kendaraan: '', tahun: new Date().getFullYear(), kilometer: 0, warna: '' });
        fetchVehicles();
      }
    } catch (err) {
      console.error('Unexpected Error:', err);
      alert(`Terjadi kesalahan jaringan: ${err instanceof Error ? err.message : 'Unknown error'}. Pastikan koneksi internet stabil dan URL Supabase benar.`);
    } finally {
      setLoading(false);
    }
  }

  async function deleteVehicle(id: string) {
    if (confirm('Apakah Anda yakin ingin menghapus kendaraan ini? Semua data terkait (BBM & Service) juga akan dihapus.')) {
      const { error } = await supabase.from('kendaraan').delete().eq('id', id);
      if (error) alert('Gagal menghapus: ' + error.message);
      else fetchVehicles();
    }
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
          onClick={() => setShowForm(!showForm)}
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
            <h2 className="text-xl font-bold mb-4">Tambah Kendaraan Baru</h2>
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
                  value={formData.tahun}
                  onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1">Kilometer Saat Ini</label>
                <input
                  required
                  type="number"
                  className="input-field"
                  value={formData.kilometer}
                  onChange={(e) => setFormData({ ...formData, kilometer: parseInt(e.target.value) })}
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
              <div className="flex items-end">
                <button type="submit" className="btn-primary w-full">Simpan Kendaraan</button>
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
              <div className="absolute top-0 right-0 p-2">
                <button 
                  onClick={() => deleteVehicle(vehicle.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
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
                  <span>{vehicle.kilometer.toLocaleString()} KM</span>
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
    </div>
  );
}
