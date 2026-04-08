import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BarChart3, 
  Car, 
  Fuel, 
  Wrench, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  format, 
  subWeeks, 
  subMonths, 
  subYears, 
  isAfter, 
  parseISO,
  startOfWeek,
  startOfMonth,
  startOfYear
} from 'date-fns';

interface Vehicle {
  id: string;
  plat_nomor: string;
  jenis_kendaraan: string;
}

interface FuelLog {
  id: string;
  tanggal: string;
  total_harga: number;
  jumlah_liter: number;
  jenis_bbm: string;
}

interface ServiceLog {
  id: string;
  tanggal_service: string;
  biaya: number;
  jenis_service: string;
  kilometer_service: number;
}

type TimeFilter = 'all' | 'week' | 'month' | 'year';

export default function Analysis() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchVehicles() {
      const { data } = await supabase.from('kendaraan').select('id, plat_nomor, jenis_kendaraan');
      if (data) {
        setVehicles(data);
        if (data.length > 0) setSelectedVehicleId(data[0].id);
      }
    }
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicleId) {
      fetchAnalysisData();
    }
  }, [selectedVehicleId, timeFilter]);

  async function fetchAnalysisData() {
    setLoading(true);
    try {
      // Fetch Fuel Logs
      const { data: fuelData } = await supabase
        .from('bahan_bakar')
        .select('*')
        .eq('kendaraan_id', selectedVehicleId)
        .order('tanggal', { ascending: false });

      // Fetch Service Logs
      const { data: serviceData } = await supabase
        .from('service')
        .select('*')
        .eq('kendaraan_id', selectedVehicleId)
        .order('tanggal_service', { ascending: false });

      const now = new Date();
      let filterDate: Date | null = null;

      if (timeFilter === 'week') filterDate = subWeeks(now, 1);
      else if (timeFilter === 'month') filterDate = subMonths(now, 1);
      else if (timeFilter === 'year') filterDate = subYears(now, 1);

      const filteredFuel = fuelData ? fuelData.filter(log => {
        if (!filterDate) return true;
        return isAfter(parseISO(log.tanggal), filterDate);
      }) : [];

      const filteredService = serviceData ? serviceData.filter(log => {
        if (!filterDate) return true;
        return isAfter(parseISO(log.tanggal_service), filterDate);
      }) : [];

      setFuelLogs(filteredFuel);
      setServiceLogs(filteredService);
    } catch (error) {
      console.error('Error fetching analysis data:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalFuelCost = fuelLogs.reduce((acc, curr) => acc + Number(curr.total_harga), 0);
  const totalServiceCost = serviceLogs.reduce((acc, curr) => acc + Number(curr.biaya), 0);
  const totalLiters = fuelLogs.reduce((acc, curr) => acc + Number(curr.jumlah_liter), 0);
  const avgFuelPrice = fuelLogs.length > 0 ? totalFuelCost / totalLiters : 0;

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-text-black tracking-tighter uppercase italic">
            Analisis <span className="text-dark-green">Kendaraan</span>
          </h1>
          <p className="text-gray-600">Laporan mendalam penggunaan dan biaya per kendaraan.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase text-gray-400 mb-1">Pilih Kendaraan</label>
            <select 
              className="input-field py-1 text-sm min-w-[180px]"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.plat_nomor} - {v.jenis_kendaraan}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase text-gray-400 mb-1">Rentang Waktu</label>
            <div className="flex bg-white border-2 border-dark-green rounded overflow-hidden">
              {(['all', 'week', 'month', 'year'] as TimeFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-3 py-1 text-xs font-bold uppercase transition-colors ${
                    timeFilter === f ? 'bg-neon-green text-text-black' : 'hover:bg-neon-green/20'
                  }`}
                >
                  {f === 'all' ? 'Semua' : f === 'week' ? 'Minggu' : f === 'month' ? 'Bulan' : 'Tahun'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {!selectedVehicleId ? (
        <div className="card text-center py-20">
          <Car className="mx-auto h-16 w-16 text-gray-200 mb-4" />
          <p className="text-gray-500 font-bold">Silakan tambah kendaraan terlebih dahulu untuk melihat analisis.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card bg-dark-green text-white">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-neon-green rounded-lg">
                  <TrendingUp className="text-text-black" size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Total Pengeluaran</span>
              </div>
              <h3 className="text-3xl font-black text-neon-green">Rp {(totalFuelCost + totalServiceCost).toLocaleString()}</h3>
              <p className="text-xs mt-2 opacity-70">Gabungan biaya BBM & Service</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-light-gray rounded-lg">
                  <Fuel className="text-dark-green" size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Konsumsi BBM</span>
              </div>
              <h3 className="text-3xl font-black text-text-black">{totalLiters.toFixed(1)} <span className="text-sm font-normal text-gray-500 tracking-normal">Liter</span></h3>
              <p className="text-xs mt-2 text-gray-500">Total volume pengisian</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-light-gray rounded-lg">
                  <Wrench className="text-dark-green" size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Service</span>
              </div>
              <h3 className="text-3xl font-black text-text-black">{serviceLogs.length} <span className="text-sm font-normal text-gray-500 tracking-normal">Kali</span></h3>
              <p className="text-xs mt-2 text-gray-500">Frekuensi perawatan rutin</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Fuel Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-black uppercase italic flex items-center gap-2">
                <Fuel className="text-dark-green" /> Rincian <span className="text-dark-green">BBM</span>
              </h2>
              <div className="card p-0 overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                      <tr className="border-b-2 border-dark-green">
                        <th className="p-3 text-[10px] font-bold uppercase text-gray-400">Tanggal</th>
                        <th className="p-3 text-[10px] font-bold uppercase text-gray-400">Jenis</th>
                        <th className="p-3 text-[10px] font-bold uppercase text-gray-400">Volume</th>
                        <th className="p-3 text-[10px] font-bold uppercase text-gray-400">Biaya</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuelLogs.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic">Tidak ada data BBM.</td></tr>
                      ) : (
                        fuelLogs.map(log => (
                          <tr key={log.id} className="border-b border-gray-50 hover:bg-neon-green/5">
                            <td className="p-3 text-sm font-medium">{format(parseISO(log.tanggal), 'dd/MM/yy')}</td>
                            <td className="p-3 text-sm">{log.jenis_bbm}</td>
                            <td className="p-3 text-sm font-bold">{log.jumlah_liter}L</td>
                            <td className="p-3 text-sm font-black text-dark-green">Rp {log.total_harga.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-black uppercase italic flex items-center gap-2">
                <Wrench className="text-dark-green" /> Rincian <span className="text-dark-green">Service</span>
              </h2>
              <div className="card p-0 overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                      <tr className="border-b-2 border-dark-green">
                        <th className="p-3 text-[10px] font-bold uppercase text-gray-400">Tanggal</th>
                        <th className="p-3 text-[10px] font-bold uppercase text-gray-400">Kilometer</th>
                        <th className="p-3 text-[10px] font-bold uppercase text-gray-400">Jenis Service</th>
                        <th className="p-3 text-[10px] font-bold uppercase text-gray-400">Biaya</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceLogs.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic">Tidak ada data service.</td></tr>
                      ) : (
                        serviceLogs.map(log => (
                          <tr key={log.id} className="border-b border-gray-50 hover:bg-neon-green/5">
                            <td className="p-3 text-sm font-medium">{format(parseISO(log.tanggal_service), 'dd/MM/yy')}</td>
                            <td className="p-3 text-sm">{log.kilometer_service.toLocaleString()} KM</td>
                            <td className="p-3 text-sm font-bold">{log.jenis_service}</td>
                            <td className="p-3 text-sm font-black text-dark-green">Rp {log.biaya.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="card bg-white border-l-8 border-l-neon-green">
            <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
              <BarChart3 className="text-dark-green" /> Insight <span className="text-dark-green">Biaya</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Distribusi Biaya:</p>
                <div className="w-full h-4 bg-light-gray rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-dark-green" 
                    style={{ width: `${(totalFuelCost / (totalFuelCost + totalServiceCost || 1)) * 100}%` }}
                  ></div>
                  <div 
                    className="h-full bg-neon-green" 
                    style={{ width: `${(totalServiceCost / (totalFuelCost + totalServiceCost || 1)) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-dark-green">BBM: Rp {totalFuelCost.toLocaleString()}</span>
                  <span className="text-dark-green">Service: Rp {totalServiceCost.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="bg-light-gray p-4 rounded-lg">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Rata-rata Harga BBM</p>
                <p className="text-2xl font-black text-text-black">Rp {Math.round(avgFuelPrice).toLocaleString()} <span className="text-xs font-normal">/ Liter</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
