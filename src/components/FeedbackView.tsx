import React, { useState } from 'react';
import { 
  MessageSquare, 
  Search, 
  CheckCircle2, 
  Clock, 
  User, 
  Send,
  AlertCircle
} from 'lucide-react';
import { ManagerFeedback } from '../types';

interface FeedbackViewProps {
  feedbacks: ManagerFeedback[];
  onReplyFeedback: (id: string, response: string) => void;
  onResolveFeedback: (id: string) => void;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({
  feedbacks,
  onReplyFeedback,
  onResolveFeedback
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState<ManagerFeedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback || !replyText.trim()) return;
    onReplyFeedback(selectedFeedback.id, replyText.trim());
    showToast('Response recorded and sent to teacher.');
    setReplyText('');
    setSelectedFeedback(null);
  };

  const query = (search || '').toLowerCase();
  const filtered = feedbacks.filter(f => {
    if (!f) return false;
    const matchSearch = 
      (f.subject || '').toLowerCase().includes(query) ||
      (f.teacherName || '').toLowerCase().includes(query) ||
      (f.message || '').toLowerCase().includes(query);
    const matchCat = activeCategory === 'all' || f.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {toastMsg && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between border border-slate-700">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider">
          <MessageSquare className="w-4 h-4" />
          <span>Academic Management Inbox</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
          Faculty Feedback & Inquiries
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review notes, attendance correction requests, and curriculum feedback sent by faculty members.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inquiries by teacher, keyword, subject..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {['all', 'attendance', 'schedule', 'technical', 'general'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize cursor-pointer transition-all ${
                activeCategory === cat ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Inquiries Found</h3>
            <p className="text-xs text-slate-400 mt-1">All faculty inquiries are up to date.</p>
          </div>
        ) : (
          filtered.map((fb) => (
            <div
              key={fb.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    fb.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {fb.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                    {fb.category}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : 'Today'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{fb.subject}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{fb.message}</p>

                <div className="flex items-center space-x-2 pt-1 text-xs text-slate-500 font-medium">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>{fb.teacherName} ({fb.department || 'Faculty'})</span>
                </div>

                {fb.response && (
                  <div className="mt-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-blue-700">Academic Manager Response:</span>
                    <p>{fb.response}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => {
                    setSelectedFeedback(fb);
                    setReplyText(fb.response || '');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {fb.response ? 'Edit Response' : 'Reply'}
                </button>
                {fb.status !== 'resolved' && (
                  <button
                    onClick={() => {
                      onResolveFeedback(fb.id);
                      showToast('Inquiry marked as resolved.');
                    }}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Reply to Faculty Inquiry</h3>
              <button onClick={() => setSelectedFeedback(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">{selectedFeedback.subject}</p>
              <p className="text-slate-500">{selectedFeedback.message}</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Response *</label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official manager response..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedFeedback(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Response</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
