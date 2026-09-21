'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/sidebar';
import Navbar from '@/app/components/navbar';
import { api } from '@/lib/api';
import {
  Folder,
  Upload,
  Search,
  ChevronDown,
  Filter,
  Download,
  MoreVertical,
  Edit,
  Palette,
  FileText,
  ShoppingBag,
  DollarSign,
  MapPin,
  Camera,
  Scan,
  Image as ImageIcon,
  Plus,
  RefreshCw,
} from 'lucide-react';

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchDoc, setSearchDoc] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/design-projects');
      if (res && res.data) {
        setDocuments(res.data.map((proj) => ({
          id: proj._id,
          name: proj.title || `Design_Project_${proj._id.slice(-6)}`,
          client: proj.customerName || 'Client Order',
          category: 'Design Artwork',
          type: proj.status || 'ACTIVE',
          uploader: proj.designerName || 'Designer',
          date: new Date(proj.createdAt || Date.now()).toLocaleDateString(),
          version: `V${proj.currentVersion || 1}`,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = documents.filter(d =>
    !searchDoc ||
    (d.name || '').toLowerCase().includes(searchDoc.toLowerCase()) ||
    (d.client || '').toLowerCase().includes(searchDoc.toLowerCase())
  );

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Folder className="w-6 h-6 text-blue-600" />
                Documents & Artwork Repository
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Design proofs, high-resolution artwork files, and order attachments
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchDocuments}
                disabled={loading}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              <button
                onClick={() => router.push('/dashboard/design')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/25 transition-all"
              >
                <Upload className="w-4 h-4" />
                Go to Design Studio
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents and artwork..."
                value={searchDoc}
                onChange={(e) => setSearchDoc(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="pb-3">Artwork / File Name</th>
                    <th className="pb-3">Client</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Version</th>
                    <th className="pb-3">Uploader</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredDocs.length > 0 ? (
                    filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 font-bold text-slate-900 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-purple-600" />
                          {doc.name}
                        </td>
                        <td className="py-3 text-slate-600">{doc.client}</td>
                        <td className="py-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {doc.category}
                          </span>
                        </td>
                        <td className="py-3 font-black text-slate-800">{doc.version}</td>
                        <td className="py-3 text-slate-600">{doc.uploader}</td>
                        <td className="py-3 text-slate-400">{doc.date}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => router.push('/dashboard/design')}
                            className="text-blue-600 font-bold hover:underline"
                          >
                            Open in Studio →
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        No documents or artwork uploaded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
