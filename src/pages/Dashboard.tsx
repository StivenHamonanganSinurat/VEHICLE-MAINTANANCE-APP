import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Car, Fuel, Wrench, TrendingUp, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalFuelCost: 0,
    totalServiceCost: 0,
    lastService: 'Belum ada',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { count: vehicleCount } = await supabase.from('kendaraan').select('*', { count: 'exact', head: true });
        
        const { data: fuelData } = await supabase.from('bahan_bakar').select('total_harga');
        const totalFuel = fuelData?.reduce((acc, curr) => acc + Number(curr.total_harga), 0) || 0;

        const { data: serviceData } = await supabase.from('service').select('biaya, tanggal_service').order('tanggal_service', { ascending: false });
        const totalService = serviceData?.reduce((acc, curr) => acc + Number(curr.biaya), 0) || 0;
        const lastServiceDate = serviceData?.[0]?.tanggal_service || 'Belum ada';

        setStats({
          totalVehicles: vehicleCount || 0,
          totalFuelCost: totalFuel,
          totalServiceCost: totalService,
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

  const statCards = [
    { title: 'Total Kendaraan', value: stats.totalVehicles, icon: Car, color: 'text-blue-500' },
    { title: 'Total Biaya BBM', value: `Rp ${stats.totalFuelCost.toLocaleString()}`, icon: Fuel, color: 'text-orange-500' },
    { title: 'Total Biaya Service', value: `Rp ${stats.totalServiceCost.toLocaleString()}`, icon: Wrench, color: 'text-purple-500' },
    { title: 'Service Terakhir', value: stats.lastService, icon: TrendingUp, color: 'text-green-500' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-dark-green font-bold">Memuat data...</div>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black text-text-black tracking-tighter uppercase italic">
          Dashboard <span className="text-dark-green">Maintenance</span>
        </h1>
        <p className="text-gray-600">Ringkasan aktivitas perawatan kendaraan Anda.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card group hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{card.title}</p>
                <h3 className="text-2xl font-black text-text-black">{card.value}</h3>
              </div>
              <div className={`p-3 rounded-lg bg-light-gray group-hover:bg-neon-green transition-colors`}>
                <card.icon className="h-6 w-6 text-dark-green" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-dark-green" />
            Aktivitas Terbaru
          </h2>
          <div className="space-y-4">
            <p className="text-gray-500 italic">Fitur riwayat aktivitas akan segera hadir.</p>
          </div>
        </div>
        
        <div className="card bg-dark-green text-white">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-neon-green">
            <DollarSign />
            Efisiensi Biaya
          </h2>
          <div className="p-4 bg-black/20 rounded-lg border border-neon-green/30">
            <p className="text-sm opacity-80 mb-2">Total Pengeluaran Bulan Ini</p>
            <p className="text-3xl font-black text-neon-green">Rp {(stats.totalFuelCost + stats.totalServiceCost).toLocaleString()}</p>
          </div>
          <p className="mt-4 text-sm opacity-70 italic">
            "Perawatan rutin menghemat biaya perbaikan besar di masa depan."
          </p>
        </div>
      </div>
    </div>
  );
}
