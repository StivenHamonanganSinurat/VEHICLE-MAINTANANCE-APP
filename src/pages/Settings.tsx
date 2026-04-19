import React from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, LogOut, Shield, Bell, Smartphone, HelpCircle, Info, ChevronRight, User } from 'lucide-react';

export default function Settings() {
  const settingsGroups = [
    {
      title: 'Akun & Keamanan',
      items: [
        { icon: User, label: 'Profil Saya', description: 'Atur detail informasi personal', color: 'text-blue-500', bg: 'bg-blue-50' },
        { icon: Shield, label: 'Keamanan', description: 'Ganti kata sandi dan akses', color: 'text-green-500', bg: 'bg-green-50' },
      ]
    },
    {
      title: 'Preferensi Aplikasi',
      items: [
        { icon: Bell, label: 'Notifikasi', description: 'Pengingat service & perpanjangan STNK', color: 'text-orange-500', bg: 'bg-orange-50' },
        { icon: Smartphone, label: 'Tampilan PWA', description: 'Mode gelap, tema, dan ikon', color: 'text-purple-500', bg: 'bg-purple-50' },
      ]
    },
    {
      title: 'Bantuan & Lainnya',
      items: [
        { icon: HelpCircle, label: 'Pusat Bantuan', description: 'Panduan penggunaan aplikasi', color: 'text-teal-500', bg: 'bg-teal-50' },
        { icon: Info, label: 'Tentang Aplikasi', description: 'V1.2.0 Build 2026', color: 'text-gray-500', bg: 'bg-gray-50' },
      ]
    }
  ];

  return (
    <div className="space-y-8 pb-24">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-text-black tracking-tighter uppercase italic">
          Setelan <span className="text-gray-400">Aplikasi</span>
        </h1>
        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-1">Konfigurasi & Manajemen</p>
      </header>

      <div className="space-y-8">
        {settingsGroups.map((group, idx) => (
          <div key={idx} className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">{group.title}</h2>
            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden">
               {group.items.map((item, i) => (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    key={i}
                    className="w-full flex items-center justify-between p-5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                       <div className={`${item.bg} ${item.color} p-3 rounded-2xl`}>
                          <item.icon size={20} />
                       </div>
                       <div className="text-left">
                          <h3 className="text-sm font-black text-text-black uppercase italic">{item.label}</h3>
                          <p className="text-[10px] font-medium text-gray-400">{item.description}</p>
                       </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                  </motion.button>
               ))}
            </div>
          </div>
        ))}
        
        <div className="pt-4">
           <motion.button
              whileTap={{ scale: 0.95 }}
              className="w-full bg-red-50 text-red-500 p-5 rounded-[32px] flex items-center justify-center gap-3 font-black uppercase italic tracking-widest border border-red-100 shadow-sm"
           >
              <LogOut size={20} />
              Keluar Sesi
           </motion.button>
           <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-6">Developed with ❤️ for Vehicle Owners</p>
        </div>
      </div>
    </div>
  );
}
