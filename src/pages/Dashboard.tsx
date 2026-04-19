import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Car, Fuel, Wrench, TrendingUp, DollarSign, Plus, ArrowRight, Gauge } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalFuelCost: 0,
    totalServiceCost: 0,
    totalLiters: 0,
    lastService: 'Belum ada',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { count: vehicleCount } = await supabase.from('kendaraan').select('*', { count: 'exact', head: true });
        
        const { data: fuelData } = await supabase.from('bahan_bakar').select('total_harga, jumlah_liter');
        const totalFuel = fuelData?.reduce((acc, curr) => acc + Number(curr.total_harga), 0) || 0;
        const totalLiters = fuelData?.reduce((acc, curr) => acc + Number(curr.jumlah_liter), 0) || 0;

        const { data: serviceData } = await supabase.from('service').select('biaya, tanggal_service').order('tanggal_service', { ascending: false });
        const totalService = serviceData?.reduce((acc, curr) => acc + Number(curr.biaya), 0) || 0;
        const lastServiceDate = serviceData?.[0]?.tanggal_service || 'Belum ada';

        setStats({
          totalVehicles: vehicleCount || 0,
          totalFuelCost: totalFuel,
          totalServiceCost: totalService,
          totalLiters,
          lastService: lastServiceDate,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-neon-green border-t-dark-green rounded-full"
        />
        <p className="text-dark-green font-black uppercase italic tracking-tighter">Sinkronisasi Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden rounded-3xl bg-dark-green p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-neon-green font-bold uppercase tracking-[0.2em] text-[10px] mb-2"
          >
            {getGreeting()}
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none"
          >
            Overview <span className="text-neon-green">Maintenance</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-gray-400 max-w-md text-sm md:text-base"
          >
            Sistem manajemen armada pribadi Anda. Pantau biaya, konsumsi BBM, dan jadwal service dalam satu genggaman.
          </motion.p>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-neon-green/10 rounded-full blur-3xl" />
        <Car className="absolute bottom-0 right-0 opacity-10 h-64 w-64 -mb-16 -mr-16 transform -rotate-12" />
      </section>

      {/* Quick Actions - Mobile First */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/fuel" className="group">
          <div className="flex items-center justify-between p-6 bg-white border-2 border-transparent hover:border-neon-green rounded-2xl shadow-sm transition-all hover:shadow-xl active:scale-95">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <Fuel size={24} className="text-orange-600 group-hover:text-white" />
              </div>
              <div>
                <h3 className="font-black uppercase italic text-text-black">Log BBM</h3>
                <p className="text-xs text-gray-500">Catat pengisian bahan bakar</p>
              </div>
            </div>
            <Plus className="text-gray-300 group-hover:text-neon-green" />
          </div>
        </Link>

        <Link to="/service" className="group">
          <div className="flex items-center justify-between p-6 bg-white border-2 border-transparent hover:border-neon-green rounded-2xl shadow-sm transition-all hover:shadow-xl active:scale-95">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <Wrench size={24} className="text-purple-600 group-hover:text-white" />
              </div>
              <div>
                <h3 className="font-black uppercase italic text-text-black">Log Service</h3>
                <p className="text-xs text-gray-500">Catat perawatan rutin</p>
              </div>
            </div>
            <Plus className="text-gray-300 group-hover:text-neon-green" />
          </div>
        </Link>
      </section>

      {/* Stats Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Statistik Utama</h2>
          <Link to="/analysis" className="text-[10px] font-bold uppercase text-dark-green hover:text-neon-green flex items-center gap-1">
            Lihat Analisis <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div whileHover={{ y: -5 }} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-50 p-2 rounded-lg"><Car size={16} className="text-blue-600" /></div>
              <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Garasi</span>
            </div>
            <h4 className="text-2xl font-black text-text-black">{stats.totalVehicles} <span className="text-[10px] font-normal text-gray-400">Kendaraan</span></h4>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-green-50 p-2 rounded-lg"><Gauge size={16} className="text-green-600" /></div>
              <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Konsumsi</span>
            </div>
            <h4 className="text-2xl font-black text-text-black">{stats.totalLiters.toFixed(1)} <span className="text-[10px] font-normal text-gray-400">Liter</span></h4>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-orange-50 p-2 rounded-lg"><Fuel size={16} className="text-orange-600" /></div>
              <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Biaya BBM</span>
            </div>
            <h4 className="text-lg font-black text-text-black italic">Rp {stats.totalFuelCost.toLocaleString()}</h4>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-purple-50 p-2 rounded-lg"><Wrench size={16} className="text-purple-600" /></div>
              <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Biaya Service</span>
            </div>
            <h4 className="text-lg font-black text-text-black italic">Rp {stats.totalServiceCost.toLocaleString()}</h4>
          </motion.div>
        </div>
      </section>

      {/* Highlights Split */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-neon-green/20 text-dark-green px-3 py-1 rounded-full text-[10px] font-bold uppercase mb-4">
              <TrendingUp size={12} /> Insight Terakhir
            </div>
            <h3 className="text-xl font-black text-text-black uppercase italic mb-2 leading-tight">Total Investasi <br /><span className="text-dark-green">Kendaraan Anda</span></h3>
            <div className="text-4xl font-black tracking-tighter text-dark-green mt-4">
              Rp {(stats.totalFuelCost + stats.totalServiceCost).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-4 max-w-[200px]">Gabungan seluruh biaya operasional yang tercatat dalam sistem.</p>
          </div>
          <DollarSign className="absolute -bottom-6 -right-6 h-32 w-32 text-neon-green/10 group-hover:scale-125 transition-transform" />
        </div>

        <div className="bg-dark-green p-8 rounded-3xl shadow-xl text-white flex flex-col justify-between">
          <div>
             <h3 className="text-lg font-black uppercase italic text-neon-green tracking-widest mb-1">Status Terakhir</h3>
             <p className="text-xs text-gray-400 font-bold uppercase">Pelayanan Perawatan</p>
          </div>
          
          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
               <span className="text-sm opacity-60">Terakhir Service</span>
               <span className="text-sm font-black text-neon-green">{stats.lastService !== 'Belum ada' ? new Date(stats.lastService).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum ada'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
               <span className="text-sm opacity-60">Rata-rata BBM</span>
               <span className="text-sm font-black text-neon-green">Rp {(stats.totalLiters > 0 ? Math.round(stats.totalFuelCost / stats.totalLiters) : 0).toLocaleString()} /L</span>
            </div>
          </div>
          
          <Link to="/analysis" className="mt-8 inline-flex items-center gap-2 text-xs font-black uppercase italic text-neon-green hover:underline">
            Buka Laporan Lengkap <Plus size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
