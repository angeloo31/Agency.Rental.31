import React, { useState, useEffect } from 'react';
import { Mail, Check, Trash2, X, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';

interface Message {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'Unread' | 'Read';
  createdAt: string;
}

interface MessagesTabProps {
  onUnreadCountChange?: (count: number) => void;
}

export default function MessagesTab({ onUnreadCountChange }: MessagesTabProps) {
  const { t } = useLanguage();
  const { token } = useAuth();
  const { confirm } = useConfirm();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const updateUnreadCount = (list: Message[]) => {
    const count = list.filter(m => m.status === 'Unread').length;
    onUnreadCountChange?.(count);
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/messages', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data: Message[] = await res.json();
        setMessages(data);
        updateUnreadCount(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Unread' ? 'Read' : 'Unread';
    try {
      const res = await fetch(`/api/messages/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages(prev => {
          const next = prev.map(m => m._id === id ? updated : m);
          updateUnreadCount(next);
          return next;
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteMessage = async (id: string) => {
    const isConfirmed = await confirm(t('deleteMessageConfirm') || 'Delete this message?');
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        setMessages(prev => {
          const next = prev.filter(m => m._id !== id);
          updateUnreadCount(next);
          return next;
        });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Mail className="w-6 h-6 text-indigo-600" />
          {t('inboxMessages')}
        </h2>
        <div className="bg-white border border-slate-200/60 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 shadow-sm">
          {messages.filter(m => m.status === 'Unread').length} {t('unread')}
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white border border-dashed rounded-[2rem] p-16 text-center max-w-xl mx-auto shadow-sm">
          <Mail className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {t('noMessages')}
          </h3>
          <p className="text-slate-500 font-medium">
            {t('noContactRequests')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {messages.map(msg => (
            <div 
              key={msg._id} 
              className={`bg-white rounded-[2rem] p-6 md:p-8 border shadow-sm transition-all duration-500 hover:shadow-xl ${
                msg.status === 'Unread' ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200/60'
              }`}
            >
              <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-4">
                    {msg.status === 'Unread' && (
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                      </span>
                    )}
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {msg.subject}
                    </h3>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-5">
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-medium text-sm">
                      {msg.message}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-500">
                    <div><span className="uppercase text-[10px] font-extrabold text-slate-400 block mb-0.5 tracking-wider">{t('from')}</span> <span className="text-slate-800">{msg.name}</span></div>
                    <div><span className="uppercase text-[10px] font-extrabold text-slate-400 block mb-0.5 tracking-wider">{t('emailAddress')}</span> <a href={`mailto:${msg.email}`} className="text-indigo-600 hover:text-indigo-700 hover:underline transition-colors">{msg.email}</a></div>
                    <div><span className="uppercase text-[10px] font-extrabold text-slate-400 block mb-0.5 tracking-wider">{t('date')}</span> {new Date(msg.createdAt).toLocaleString('fr-FR')}</div>
                  </div>
                </div>

                <div className="flex md:flex-col gap-3 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
                  <button 
                    onClick={() => toggleStatus(msg._id, msg.status)}
                    className={`px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 text-sm w-full md:w-auto shadow-sm hover:shadow-md active:scale-95 ${
                      msg.status === 'Unread' 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {msg.status === 'Unread' ? <><Check className="w-4 h-4" /> {t('markRead')}</> : <><AlertCircle className="w-4 h-4" /> {t('markUnread')}</>}
                  </button>
                  <button 
                    onClick={() => deleteMessage(msg._id)}
                    className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 text-sm w-full md:w-auto active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" /> {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
