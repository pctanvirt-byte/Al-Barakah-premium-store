import React from 'react';
import { X, UploadCloud, FileCode, CheckCircle2, Database, Sparkles, FolderArchive, ArrowRight } from 'lucide-react';

interface ZipImportGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZipImportGuideModal: React.FC<ZipImportGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Zip File UI Import & New Database Guide</h2>
              <p className="text-xs text-slate-300">আপনার Zip ফাইলের ডিজাইন ও নতুন ডাটাবেজ সেটআপ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-700 text-xs leading-relaxed">
          {/* Bengali Quick Summary */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>আপনার জন্য সম্পূর্ণ প্রস্তুত ফ্রেমওয়ার্ক</span>
            </div>
            <p className="text-emerald-900 text-xs">
              আমরা আপনার রিকোয়ারমেন্ট অনুযায়ী ডাটাবেজ স্ট্রাকচার সম্পূর্ণ নতুনভাবে তৈরি করেছি (Clean Types, Product Schema, Cart, Checkout, Order Tracking)। 
              আপনার Zip ফাইলে থাকা UI/HTML/CSS বা Components আপনি নিচের নিয়মে আমাদের সাথে যুক্ত করতে পারবেন:
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              How to Upload or Share your Zip Design files:
            </h3>

            {/* Step 1 */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                1
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900">Upload to Chat or File Explorer</div>
                <div className="text-slate-600 text-xs">
                  AI Studio-র বাম পাশের File Explorer এ আপনার ফাইলের কোড ড্রপ করতে পারেন অথবা চ্যাটে Zip-এর ভেতরের HTML / React / Tailwind কম্পোনেন্ট কোড পেস্ট করতে পারেন।
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                2
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900">Zero Database Conflict (Database isolation)</div>
                <div className="text-slate-600 text-xs">
                  Zip-এর পুরনো কোনো ডাটাবেজ বা SQL ফাইল লোড করা হবে না। আমরা ফ্রেশ ই-কমার্স স্কিমা (`/src/types.ts`) এর সাথে আপনার UI সরাসরি কানেক্ট করব।
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900">Add Custom Products & Test Database</div>
                <div className="text-slate-600 text-xs">
                  আপনি এখনই <strong>"Add Item"</strong> বাটনে ক্লিক করে নতুন যেকোনো প্রোডাক্ট, প্রাইস, ক্যাটাগরি এবং ছবি অ্যাড করে টেস্ট করতে পারেন।
                </div>
              </div>
            </div>
          </div>

          {/* Database Schema representation */}
          <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] space-y-1 overflow-x-auto">
            <div className="text-emerald-400 font-bold mb-1">// Fresh Database Collections & Schemas</div>
            <div>📁 products: {`{ id, name, category, price, rating, inStock, colors, sizes, images }`}</div>
            <div>📁 orders: {`{ id, items, customer, paymentMethod, status, total, createdAt }`}</div>
            <div>📁 cart_session: {`{ items: [{ productId, quantity, color, size }] }`}</div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Got it, Continue Exploring
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
