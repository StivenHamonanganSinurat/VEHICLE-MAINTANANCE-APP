# Vehicle Maintenance App

A comprehensive web application for tracking vehicle maintenance, fuel logs, and service history.

## Features
- **Vehicle Management**: Add and track your vehicles.
- **Fuel Logs**: Keep track of fuel consumption and costs.
- **Service History**: Log maintenance and repairs for each vehicle.
- **Dashboard**: Get a quick overview of your maintenance stats.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Lucide Icons, Motion.
- **Backend**: Supabase (Database & Auth).

## Setup Instructions

### 1. Supabase Database Setup
Run the following SQL script in your Supabase SQL Editor to create the necessary tables:

```sql
-- Tabel kendaraan
CREATE TABLE kendaraan (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plat_nomor TEXT UNIQUE NOT NULL,
    jenis_kendaraan TEXT NOT NULL,
    tahun INTEGER NOT NULL,
    kilometer INTEGER NOT NULL,
    warna TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel bahan_bakar
CREATE TABLE bahan_bakar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kendaraan_id UUID REFERENCES kendaraan(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    nama_pom TEXT NOT NULL,
    jenis_bbm TEXT NOT NULL,
    jumlah_liter DECIMAL(10,2) NOT NULL,
    harga_perliter DECIMAL(10,2) NOT NULL,
    total_harga DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel service
CREATE TABLE service (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kendaraan_id UUID REFERENCES kendaraan(id) ON DELETE CASCADE,
    tanggal_service DATE NOT NULL,
    kilometer_service INTEGER NOT NULL,
    jenis_service TEXT NOT NULL,
    biaya DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE kendaraan ENABLE ROW LEVEL SECURITY;
ALTER TABLE bahan_bakar ENABLE ROW LEVEL SECURITY;
ALTER TABLE service ENABLE ROW LEVEL SECURITY;

-- Policy untuk akses semua (development)
CREATE POLICY "Allow all access" ON kendaraan FOR ALL USING (true);
CREATE POLICY "Allow all access" ON bahan_bakar FOR ALL USING (true);
CREATE POLICY "Allow all access" ON service FOR ALL USING (true);
```

### 2. Environment Variables
Create a `.env` file (or use the AI Studio Secrets panel) and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Color Palette
- **Neon Green**: #00FF00 (Main Accent)
- **Dark Green**: #008800 (Secondary/Hover)
- **Light Gray**: #F0F0F0 (Background)
- **Text Black**: #1A1A1A (Primary Text)
