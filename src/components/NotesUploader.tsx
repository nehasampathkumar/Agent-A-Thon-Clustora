import React, { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  Sparkles,
  Flame,
  AlertCircle,
  FileCode,
  FileType,
  Database,
  ArrowRight,
} from 'lucide-react';
import { Subject } from '../types';
import { api } from '../lib/api';

interface NotesUploaderProps {
  subjects: Subject[];
  defaultSubjectId?: string;
  onUploadSuccess: () => void;
}

export const NotesUploader: React.FC<NotesUploaderProps> = ({
  subjects,
  defaultSubjectId,
  onUploadSuccess,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    defaultSubjectId || (subjects.length > 0 ? subjects[0].id : '')
  );
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    fileName: string;
    wordCount: number;
    extractedTopics: any[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper to handle reading a file
  const processFile = async (file: File) => {
    if (!selectedSubjectId) {
      setError('Please select a subject first.');
      return;
    }

    setError(null);
    setLoading(true);
    setUploadResult(null);

    const fileName = file.name;
    const extension = fileName.split('.').pop()?.toLowerCase() || 'txt';

    try {
      if (extension === 'pdf' || extension === 'docx' || extension === 'doc') {
        // Read as base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const res = await api.uploadFile({
              subjectId: selectedSubjectId,
              fileName,
              fileType: extension,
              contentBase64: base64,
            });
            setUploadResult({
              fileName,
              wordCount: res.file.word_count || 0,
              extractedTopics: res.topics || [],
            });
            onUploadSuccess();
          } catch (err: any) {
            setError(err.message || 'Failed to process file');
          } finally {
            setLoading(false);
          }
        };
        reader.onerror = () => {
          setError('Failed to read file.');
          setLoading(false);
        };
        reader.readAsDataURL(file);
      } else {
        // Text, md, csv, json
        const reader = new FileReader();
        reader.onload = async () => {
          const text = reader.result as string;
          try {
            const res = await api.uploadFile({
              subjectId: selectedSubjectId,
              fileName,
              fileType: extension,
              rawText: text,
            });
            setUploadResult({
              fileName,
              wordCount: res.file.word_count || 0,
              extractedTopics: res.topics || [],
            });
            onUploadSuccess();
          } catch (err: any) {
            setError(err.message || 'Failed to process file');
          } finally {
            setLoading(false);
          }
        };
        reader.onerror = () => {
          setError('Failed to read file.');
          setLoading(false);
        };
        reader.readAsText(file);
      }
    } catch (err: any) {
      setError(err.message || 'Upload error');
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Demo Notes Generator to test instant processing
  const loadDemoNotes = async (preset: 'biology' | 'cs' | 'history') => {
    if (!selectedSubjectId) {
      setError('Please select a subject first.');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadResult(null);

    let fileName = '';
    let text = '';

    if (preset === 'biology') {
      fileName = 'Enzyme_Kinetics_and_Metabolic_Regulation.md';
      text = `# Enzyme Kinetics & Cellular Energetics
## 1. Allosteric Regulation
Enzymes undergo conformational shifts when effector molecules bind to allosteric sites. Positive effectors stabilize the high-affinity R-state, while negative effectors favor the T-state.
## 2. Michaelis-Menten Kinetics
- Vmax: Maximum theoretical reaction rate when enzyme active sites are saturated.
- Km: Substrate concentration at 1/2 Vmax. A lower Km indicates higher substrate affinity.
- Lineweaver-Burk double reciprocal plots linearize kinetic curves.
## 3. Competitive vs Non-Competitive Inhibition
- Competitive inhibitors mimic substrate, increasing Km while Vmax remains unchanged.
- Non-competitive inhibitors bind distinct allosteric sites, decreasing Vmax with Km constant.`;
    } else if (preset === 'cs') {
      fileName = 'Advanced_Graph_Algorithms_and_Trees.md';
      text = `# Graph Theory & Network Optimization
## 1. Dijkstra's Algorithm
Finds single-source shortest path in graphs with non-negative edge weights using a priority queue (min-heap). Time complexity: O((V + E) log V).
## 2. Minimum Spanning Trees (Kruskal & Prim)
- Kruskal: Greedy edge sorting with Union-Find (Disjoint Set Union) for cycle detection.
- Prim: Greedy node expansion using priority queue.
## 3. Topological Sorting & DAGs
Linear ordering of vertices such that for every directed edge u -> v, u comes before v. Solved using Kahn's algorithm (in-degree tracking) or post-order DFS.`;
    } else {
      fileName = 'Post_War_Economic_Expansion_and_Institutions.md';
      text = `# Post-WWII International Order & Bretton Woods
## 1. The Bretton Woods Conference (1944)
Established the International Monetary Fund (IMF) and the World Bank. Pegged global currencies to the US Dollar, which was backed by gold at $35/oz.
## 2. The Marshall Plan (1948)
European Recovery Program providing $13 billion in economic assistance to reconstruct Western European industrial capacity and halt Soviet expansion.
## 3. The Collapse of the Bretton Woods System (1971)
The Nixon Shock suspended gold convertibility, transitioning international finance to floating fiat exchange rates.`;
    }

    try {
      const res = await api.uploadFile({
        subjectId: selectedSubjectId,
        fileName,
        fileType: 'md',
        rawText: text,
      });
      setUploadResult({
        fileName,
        wordCount: res.file.word_count || 0,
        extractedTopics: res.topics || [],
      });
      onUploadSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to load demo note.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            <span>Upload Notes & Syllabus Material</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload PDF, Word (.docx), TXT, Markdown, CSV, or JSON. StudySync automatically extracts key topics to build your adaptive plan.
          </p>
        </div>

        {/* Target Subject Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Assign to Subject:
          </label>
          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          dragActive
            ? 'border-indigo-600 bg-indigo-50/50'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
        }`}
      >
        <input
          type="file"
          id="note-file-input"
          accept=".pdf,.docx,.doc,.txt,.md,.markdown,.csv,.json"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={loading}
        />

        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {loading ? 'Processing Document & Extracting Topics...' : 'Drop notes here or click to browse'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports PDF, Word (.docx), TXT, Markdown (.md), CSV, JSON
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-2 font-medium">
            <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200">PDF</span>
            <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200">DOCX</span>
            <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200">MARKDOWN</span>
            <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200">TEXT</span>
            <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200">CSV/JSON</span>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs rounded-2xl flex items-center justify-center flex-col gap-2 z-10">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-700">
              Extracting text and identifying curriculum topics...
            </p>
          </div>
        )}
      </div>

      {/* Quick Test Demo Notes Pill Buttons */}
      <div className="pt-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Or load sample study notes for quick testing:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadDemoNotes('biology')}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer border border-slate-200/80"
          >
            🧬 Enzyme Kinetics & Allosteric Notes (.md)
          </button>
          <button
            onClick={() => loadDemoNotes('cs')}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer border border-slate-200/80"
          >
            💻 Advanced Graph Algorithms & Dijkstra (.md)
          </button>
          <button
            onClick={() => loadDemoNotes('history')}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer border border-slate-200/80"
          >
            📜 Bretton Woods & Post-War Notes (.md)
          </button>
        </div>
      </div>

      {/* Extraction Results Preview */}
      {uploadResult && (
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  Successfully extracted from {uploadResult.fileName}
                </p>
                <p className="text-[11px] text-emerald-700">
                  {uploadResult.wordCount} words processed • {uploadResult.extractedTopics.length} new topics added to curriculum
                </p>
              </div>
            </div>
          </div>

          {/* Extracted Topics Chips */}
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
              Discovered Topics:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {uploadResult.extractedTopics.map((top, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 bg-white rounded-lg border border-emerald-300 text-xs text-slate-800 font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{top.name}</span>
                  {top.is_hard && (
                    <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
