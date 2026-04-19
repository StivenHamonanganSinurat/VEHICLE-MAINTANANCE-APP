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
  Filter,
  PieChart,
  Activity,
  Zap,
  Info,
  ChevronDown,
  BarChart as ChartBar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  subWeeks, 
  subMonths, 
  subYears, 
  isAfter, 
  parseISO,
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
  kilometer: number;
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
      const { data: fuelData } = await supabase
        .from('bahan_bakar')
        .select('*')
        .eq('kendaraan_id', selectedVehicleId)
        .order('tanggal', { ascending: false });

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
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const totalFuelCost = fuelLogs.reduce((acc, curr) => acc + Number(curr.total_harga), 0);
  const totalServiceCost = serviceLogs.reduce((acc, curr) => acc + Number(curr.biaya), 0);
  const totalLiters = fuelLogs.reduce((acc, curr) => acc + Number(curr.jumlah_liter), 0);
  const avgFuelPrice = fuelLogs.length > 0 ? totalFuelCost / totalLiters : 0;
  
  const fuelPercentage = ((totalFuelCost / (totalFuelCost + totalServiceCost || 1)) * 100);
  const servicePercentage = 100 - fuelPercentage;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-text-black tracking-tighter uppercase italic">
            Analisis <span className="text-blue-600">Insight</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Data Driven Overview</p>
          </div>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-2">
            <div className="flex-grow sm:flex-grow-0 relative">
               <Car size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
               <select 
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-xs font-bold uppercase focus:border-blue-500 outline-none transition-all"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plat_nomor}</option>
                  ))}
               </select>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-xl">
               {(['all', 'week', 'month'] as TimeFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                      timeFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'week' ? '7D' : '30D'}
                  </button>
                ))}
            </div>
        </div>
      </header>

      {!selectedVehicleId ? (
        <div className="bg-white border-4 border-dashed border-gray-100 rounded-[32px] text-center py-24 px-6">
          <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ChartBar size={40} className="text-blue-200" />
          </div>
          <h3 className="text-xl font-black uppercase italic text-text-black mb-2">No Vehicle Found</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">Please register a vehicle first to see data analytics.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main Stat Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-600 rounded-[32px] p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                   <Activity size={120} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Combined Cost</p>
                <h3 className="text-4xl font-black italic tracking-tighter mb-4">
                   <span className="text-lg font-normal not-italic opacity-60 mr-1">Rp</span>
                   {((totalFuelCost || 0) + (totalServiceCost || 0)).toLocaleString()}
                </h3>
                <div className="flex items-center gap-2">
                   <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">Health Check: Normal</div>
                </div>
             </motion.div>

             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                   <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500">
                      <Fuel size={24} />
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-gray-400">Fuel Consumption</p>
                      <h4 className="text-2xl font-black text-text-black italic tracking-tighter">{totalLiters.toFixed(1)} <span className="text-xs font-normal not-italic">LITERS</span></h4>
                   </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-gray-400 uppercase">Avg Efficiency</span>
                       <span className="text-sm font-black text-orange-600">-- KM/L</span>
                    </div>
                    <div className="flex flex-col text-right">
                       <span className="text-[10px] font-bold text-gray-400 uppercase">Avg Price</span>
                       <span className="text-sm font-black text-text-black">Rp {Math.round(avgFuelPrice).toLocaleString()}</span>
                    </div>
                </div>
             </motion.div>

             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                   <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-500">
                      <Wrench size={24} />
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-gray-400">Maintenance Events</p>
                      <h4 className="text-2xl font-black text-text-black italic tracking-tighter">{serviceLogs.length} <span className="text-xs font-normal not-italic">ENTRIES</span></h4>
                   </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-gray-400 uppercase">Total Spent</span>
                       <span className="text-sm font-black text-purple-600">Rp {totalServiceCost.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col text-right">
                       <span className="text-[10px] font-bold text-gray-400 uppercase">Last Service</span>
                       <span className="text-sm font-black text-text-black">{serviceLogs.length > 0 ? format(parseISO(serviceLogs[0].tanggal_service), 'dd/MM') : '--'}</span>
                    </div>
                </div>
             </motion.div>
          </div>

          {/* Allocation Bar */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-black uppercase italic text-text-black flex items-center gap-2"><PieChart size={18} className="text-blue-600" /> Cost Allocation</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Weighted Distribution</span>
             </div>
             
             <div className="space-y-4">
                <div className="h-6 w-full bg-gray-50 rounded-full overflow-hidden flex p-1">
                   {totalFuelCost + totalServiceCost > 0 ? (
                     <>
                        <div 
                          className="h-full bg-orange-500 rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${fuelPercentage}%` }}
                        ></div>
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all duration-1000 ease-out ml-1" 
                          style={{ width: `${servicePercentage}%` }}
                        ></div>
                     </>
                   ) : (
                     <div className="h-full w-full bg-gray-200 rounded-full"></div>
                   )}
                </div>
                
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-[10px] font-black uppercase text-gray-500">Fuel ({fuelPercentage.toFixed(0)}%)</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-[10px] font-black uppercase text-gray-500">Service ({servicePercentage.toFixed(0)}%)</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Detailed Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Fuel Breakdown */}
             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="font-black uppercase italic text-text-black leading-none">Recent Fueling</h2>
                    <Zap size={16} className="text-orange-500" />
                </div>
                <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden">
                   <div className="max-h-[350px] overflow-y-auto scrollbar-hide">
                      {fuelLogs.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 italic text-sm">No recent data</div>
                      ) : (
                         fuelLogs.map((log, idx) => {
                            let kml = '-';
                            if (idx < fuelLogs.length - 1) {
                               const dist = log.kilometer - fuelLogs[idx+1].kilometer;
                               if (dist > 0) kml = `${(dist / log.jumlah_liter).toFixed(1)}`;
                            }
                            return (
                               <div key={log.id} className="p-5 border-b border-gray-50 last:border-0 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center gap-4">
                                     <div className="text-center min-w-[40px]">
                                        <p className="text-[8px] font-black text-gray-400 uppercase leading-none">{format(parseISO(log.tanggal), 'MMM')}</p>
                                        <p className="text-lg font-black text-text-black leading-none mt-1">{format(parseISO(log.tanggal), 'dd')}</p>
                                     </div>
                                     <div>
                                        <p className="text-xs font-black text-text-black uppercase italic">{log.kilometer.toLocaleString()} KM</p>
                                        <p className="text-[10px] font-bold text-orange-500 uppercase">{log.jumlah_liter}L • {log.jenis_bbm}</p>
                                     </div>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-sm font-black text-text-black">Rp {log.total_harga.toLocaleString()}</p>
                                     <p className="text-[9px] font-black text-blue-600 uppercase italic">{kml} KM/L</p>
                                  </div>
                               </div>
                            )
                         })
                      )}
                   </div>
                </div>
             </div>

             {/* Service Breakdown */}
             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="font-black uppercase italic text-text-black leading-none">Service History</h2>
                    <Wrench size={16} className="text-purple-500" />
                </div>
                <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden">
                   <div className="max-h-[350px] overflow-y-auto scrollbar-hide">
                      {serviceLogs.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 italic text-sm">No recent data</div>
                      ) : (
                         serviceLogs.map((log) => (
                           <div key={log.id} className="p-5 border-b border-gray-50 last:border-0 flex items-center justify-between hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-4">
                                 <div className="text-center min-w-[40px]">
                                    <p className="text-[8px] font-black text-gray-400 uppercase leading-none">{format(parseISO(log.tanggal_service), 'MMM')}</p>
                                    <p className="text-lg font-black text-text-black leading-none mt-1">{format(parseISO(log.tanggal_service), 'dd')}</p>
                                 </div>
                                 <div className="max-w-[150px]">
                                    <p className="text-xs font-black text-text-black uppercase italic truncate">{log.jenis_service}</p>
                                    <p className="text-[10px] font-bold text-purple-500 uppercase">{log.kilometer_service.toLocaleString()} KM</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-sm font-black text-text-black">Rp {log.biaya.toLocaleString()}</p>
                                 <div className="bg-purple-100 px-2 py-0.5 rounded text-[8px] font-black text-purple-600 uppercase inline-block">MNTNC</div>
                              </div>
                           </div>
                         ))
                      )}
                   </div>
                </div>
             </div>
          </div>
          
          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
             <Info className="text-blue-500 shrink-0" size={20} />
             <p className="text-xs font-medium text-blue-900 leading-relaxed">
                <span className="font-black uppercase">Pro-Tip:</span> Data efisiensi KM/L hanya tampil jika terdapat minimal 2 catatan entry berurutan untuk menghitung selisih jarak. Pastikan input Odometer akurat untuk hasil maksimal.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
