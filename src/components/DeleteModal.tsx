import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

export default function DeleteModal({ isOpen, onClose, onConfirm, title, message, isLoading }: DeleteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-red-100 p-3 rounded-full text-red-600">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">{title}</h3>
              </div>
              <p className="text-gray-600 mb-8">{message}</p>
              
              <div className="flex gap-3 mt-4">
                <button
                  disabled={isLoading}
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border-2 border-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  disabled={isLoading}
                  onClick={onConfirm}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
