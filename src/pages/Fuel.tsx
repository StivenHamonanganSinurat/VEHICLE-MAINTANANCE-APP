import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Fuel, Plus, Trash2, Calendar, Droplets, DollarSign, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface FuelLog {
  id: string;
  kendaraan_id: string;
  tanggal: string;
  nama_pom: string;
  jenis_bbm: string;
  jumlah_liter: number;
  harga_perliter: number;
  total_harga: number;
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
  const [formData, setFormData] = useState({
    kendaraan_id: '',
    tanggal: format(new Date(), 'yyyy-MM-dd'),
    nama_pom: '',
    jenis_bbm: '',
    jumlah_liter: 0,
    harga_perliter: 0,
    total_harga: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const handleFuelTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value;
    const fuel = FUEL_TYPES.find(f => f.name === selectedType);
    
    setFormData(prev => ({
      ...prev,
      jenis_bbm: selectedType,
      harga_perliter: fuel ? fuel.price : prev.harga_perliter
    }));
  };

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

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      total_harga: prev.jumlah_liter * prev.harga_perliter
    }));
  }, [formData.jumlah_liter, formData.harga_perliter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.kendaraan_id) return alert('Pilih kendaraan!');
    
    const { error } = await supabase.from('bahan_bakar').insert([formData]);
    if (error) {
      alert('Gagal menambah log: ' + error.message);
    } else {
      setShowForm(false);
      setFormData({
        kendaraan_id: '',
        tanggal: format(new Date(), 'yyyy-MM-dd'),
        nama_pom: '',
        jenis_bbm: '',
        jumlah_liter: 0,
        harga_perliter: 0,
        total_harga: 0,
      });
      fetchData();
    }
  }

  async function deleteLog(id: string) {
    if (confirm('Hapus log pengisian BBM ini?')) {
      const { error } = await supabase.from('bahan_bakar').delete().eq('id', id);
      if (error) alert('Gagal menghapus: ' + error.message);
      else fetchData();
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-text-black tracking-tighter uppercase italic">
            Log <span className="text-dark-green">Bahan Bakar</span>
          </h1>
          <p className="text-gray-600">Catatan pengisian bahan bakar kendaraan Anda.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? 'Batal' : <><Plus size={20} /> Tambah Log</>}
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
            <h2 className="text-xl font-bold mb-4">Tambah Log BBM</h2>
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
                <label className="text-xs font-bold uppercase mb-1">Jumlah Liter</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  className="input-field"
                  value={formData.jumlah_liter}
                  onChange={(e) => setFormData({ ...formData, jumlah_liter: parseFloat(e.target.value) })}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase mb-1">Harga per Liter</label>
                <input
                  required
                  type="number"
                  className="input-field"
                  value={formData.harga_perliter}
                  onChange={(e) => setFormData({ ...formData, harga_perliter: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex flex-col bg-light-gray p-2 rounded border-2 border-dashed border-dark-green">
                <label className="text-xs font-bold uppercase mb-1">Total Harga (Otomatis)</label>
                <p className="text-xl font-black text-dark-green">Rp {formData.total_harga.toLocaleString()}</p>
              </div>
              <div className="flex items-end lg:col-span-2">
                <button type="submit" className="btn-primary w-full">Simpan Log BBM</button>
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
              <th className="p-4 text-xs font-bold uppercase tracking-widest">Jumlah</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest">Total Biaya</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500 italic">Memuat data...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500 italic">Belum ada catatan pengisian BBM.</td></tr>
            ) : (
              logs.map((log) => (
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
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Droplets size={14} className="text-blue-500" />
                      <span>{log.jumlah_liter} L</span>
                    </div>
                    <p className="text-xs text-gray-400">@ Rp {log.harga_perliter.toLocaleString()}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 font-black text-dark-green">
                      <DollarSign size={14} />
                      <span>Rp {log.total_harga.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => deleteLog(log.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
