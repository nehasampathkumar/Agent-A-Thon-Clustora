import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  FolderOpen,
  FileText,
  Flame,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ChevronRight,
  Upload,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { Subject, Topic, UploadedNoteFile } from '../types';
import { api } from '../lib/api';

interface SubjectManagerProps {
  subjects: Subject[];
  topics: Topic[];
  files: UploadedNoteFile[];
  onRefresh: () => void;
  onOpenUploadForSubject: (subjectId: string) => void;
}

export const SubjectManager: React.FC<SubjectManagerProps> = ({
  subjects,
  topics,
  files,
  onRefresh,
  onOpenUploadForSubject,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    subjects.length > 0 ? subjects[0].id : null
  );

  // Add Subject Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjColor, setNewSubjColor] = useState('#6366F1');
  const [newSubjDesc, setNewSubjDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Topic Modal
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicIsHard, setNewTopicIsHard] = useState(false);
  const [newTopicDifficulty, setNewTopicDifficulty] = useState(3);
  const [newTopicSummary, setNewTopicSummary] = useState('');

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0] || null;
  const currentTopics = topics.filter(t => t.subject_id === selectedSubject?.id);
  const currentFiles = files.filter(f => f.subject_id === selectedSubject?.id);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await api.createSubject({
        name: newSubjName.trim(),
        color: newSubjColor,
        description: newSubjDesc.trim(),
      });
      setShowAddModal(false);
      setNewSubjName('');
      setNewSubjDesc('');
      onRefresh();
      setSelectedSubjectId(created.id);
    } catch (err) {
      console.error('Failed to create subject:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" and its associated topics?`)) return;
    try {
      await api.deleteSubject(id);
      onRefresh();
      if (selectedSubjectId === id) {
        setSelectedSubjectId(null);
      }
    } catch (err) {
      console.error('Failed to delete subject:', err);
    }
  };

  const handleToggleHard = async (topicId: string) => {
    try {
      await api.toggleTopicHard(topicId);
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle hard status:', err);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Delete this topic?')) return;
    try {
      await api.deleteTopic(topicId);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete topic:', err);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !newTopicName.trim()) return;
    setIsSubmitting(true);
    try {
      await api.createTopic({
        subject_id: selectedSubject.id,
        name: newTopicName.trim(),
        is_hard: newTopicIsHard,
        difficulty: newTopicIsHard ? Math.max(4, newTopicDifficulty) : newTopicDifficulty,
        summary: newTopicSummary.trim() || 'Custom student topic added for exam preparation.',
      });
      setShowAddTopicModal(false);
      setNewTopicName('');
      setNewTopicSummary('');
      setNewTopicIsHard(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to create topic:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const colorPresets = [
    '#6366F1', // Indigo
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#EF4444', // Red
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Subjects & Topic Curriculum</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Manage your exam subjects, mark challenging topics as <strong>Hard</strong> to get +50% study time allocation, and review material pulled from your uploaded notes.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Subject</span>
        </button>
      </div>

      {/* Main Grid: Subjects List (Left) and Topic Manager (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Subject Cards */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Subjects ({subjects.length})
            </h3>
          </div>

          <div className="space-y-2">
            {subjects.map(subj => {
              const subjTopics = topics.filter(t => t.subject_id === subj.id);
              const hardCount = subjTopics.filter(t => t.is_hard).length;
              const subjFiles = files.filter(f => f.subject_id === subj.id);
              const isSelected = selectedSubject?.id === subj.id;

              return (
                <div
                  key={subj.id}
                  onClick={() => setSelectedSubjectId(subj.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: subj.color }}
                      />
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                        {subj.name}
                      </h4>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSubject(subj.id, subj.name);
                      }}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {subj.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 pl-6">
                      {subj.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] font-medium text-slate-600 pl-6">
                    <span>{subjTopics.length} topics</span>
                    <span>•</span>
                    {hardCount > 0 ? (
                      <span className="text-amber-700 font-bold flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {hardCount} hard
                      </span>
                    ) : (
                      <span className="text-slate-400">0 hard</span>
                    )}
                    <span>•</span>
                    <span>{subjFiles.length} files</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Subject Topics & Details */}
        <div className="lg:col-span-8">
          {selectedSubject ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              {/* Subject Banner Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: selectedSubject.color }}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{selectedSubject.name}</h3>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: selectedSubject.color }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {currentTopics.length} topics extracted • {currentFiles.length} notes uploaded
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenUploadForSubject(selectedSubject.id)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Upload Notes</span>
                  </button>

                  <button
                    onClick={() => setShowAddTopicModal(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Topic</span>
                  </button>
                </div>
              </div>

              {/* Hard Topics Explanation Notice */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <Flame className="w-4 h-4 text-amber-600 fill-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Adaptive Scheduling Tip:</span> Mark topics you find difficult as{' '}
                  <strong>Hard</strong>. The adaptive plan builder automatically gives them <strong>50% more study time</strong> and schedules them earlier and more frequently in your revision cycles.
                </div>
              </div>

              {/* Topics List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Topics & Difficulty Ratings ({currentTopics.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Click flame to toggle Hard priority
                  </span>
                </div>

                {currentTopics.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No topics added for this subject yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                      Upload your PDF, Word, or Markdown notes, or add topics manually above to build your study schedule.
                    </p>
                    <button
                      onClick={() => onOpenUploadForSubject(selectedSubject.id)}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
                    >
                      Upload Notes Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentTopics.map(topic => (
                      <div
                        key={topic.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          topic.is_hard
                            ? 'bg-amber-50/40 border-amber-300/80 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-bold text-sm text-slate-900">
                              {topic.name}
                            </h5>
                            {topic.is_hard && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300">
                                <Flame className="w-3 h-3 text-amber-600 fill-amber-600" />
                                HARD TOPIC (1.5x Time)
                              </span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                              Diff: {topic.difficulty}/5
                            </span>
                          </div>
                          {topic.summary && (
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {topic.summary}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {/* Hard Toggle Button */}
                          <button
                            onClick={() => handleToggleHard(topic.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              topic.is_hard
                                ? 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                                : 'bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 border border-slate-200'
                            }`}
                            title={topic.is_hard ? 'Click to unmark as hard' : 'Mark as hard to give more study time'}
                          >
                            <Flame className={`w-3.5 h-3.5 ${topic.is_hard ? 'fill-white' : ''}`} />
                            <span>{topic.is_hard ? 'Marked Hard' : 'Mark Hard'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteTopic(topic.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete topic"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Connected Uploaded Notes Files */}
              {currentFiles.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Source Note Files ({currentFiles.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentFiles.map(file => (
                      <div
                        key={file.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-semibold text-slate-800 truncate">{file.file_name || file.fileName}</p>
                            <p className="text-[10px] text-slate-400">
                              {(file.file_type || file.fileType || 'txt').toUpperCase()} • {file.word_count ?? file.wordCount ?? 0} words
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <p>Select or create a subject to view and manage its curriculum.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Subject Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubjName}
                  onChange={e => setNewSubjName(e.target.value)}
                  placeholder="e.g. Organic Chemistry, Macroeconomics"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Color</label>
                <div className="flex items-center gap-2">
                  {colorPresets.map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewSubjColor(col)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        newSubjColor === col ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newSubjDesc}
                  onChange={e => setNewSubjDesc(e.target.value)}
                  placeholder="e.g. Core final exam topics including reaction mechanisms..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {showAddTopicModal && selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Add Topic to {selectedSubject.name}
            </h3>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic Title</label>
                <input
                  type="text"
                  required
                  value={newTopicName}
                  onChange={e => setNewTopicName(e.target.value)}
                  placeholder="e.g. Enthalpy, Entropy & Gibbs Free Energy"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Summary / Concept Notes</label>
                <textarea
                  rows={3}
                  value={newTopicSummary}
                  onChange={e => setNewTopicSummary(e.target.value)}
                  placeholder="Brief overview of the formulas, definitions, or exam questions covered in this topic..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Is Hard Toggle */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                    <span>Find this topic difficult?</span>
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Will be weighted for extra study time in the plan.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={newTopicIsHard}
                  onChange={e => setNewTopicIsHard(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTopicModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
