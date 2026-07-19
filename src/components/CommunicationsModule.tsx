import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MessageSquare, Search, Phone, Clock, User, Bot, ArrowLeft, RefreshCw } from 'lucide-react';
import { useWhatsappConversations } from '../hooks/useData';

const formatPhone = (phone: string) => {
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 10) {
    const cc = clean.slice(0, clean.length - 10);
    const area = clean.slice(-10, -7);
    const p1 = clean.slice(-7, -4);
    const p2 = clean.slice(-4);
    return `+${cc} ${area} ${p1}-${p2}`;
  }
  return phone;
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
};

const formatTimestamp = (ts?: string) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const formatDateSeparator = (ts?: string) => {
  if (!ts) return '';
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Hoy';
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
};

// Get last user message for preview
const getLastPreview = (messages: { role: string; content: string }[]) => {
  if (!Array.isArray(messages) || messages.length === 0) return 'Sin mensajes';
  const last = messages[messages.length - 1];
  const text = last.content || '';
  const prefix = last.role === 'user' ? '' : '🤖 ';
  return prefix + (text.length > 60 ? text.substring(0, 60) + '...' : text);
};

// Count user messages
const countUserMessages = (messages: { role: string }[]) =>
  Array.isArray(messages) ? messages.filter(m => m.role === 'user').length : 0;

export const CommunicationsModule: React.FC = () => {
  const { data: conversations = [], isLoading, refetch } = useWhatsappConversations();
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(c =>
      c.phone.includes(q) ||
      formatPhone(c.phone).toLowerCase().includes(q) ||
      c.messages?.some(m => m.content?.toLowerCase().includes(q))
    );
  }, [conversations, search]);

  const selectedConv = useMemo(() =>
    conversations.find(c => c.phone === selectedPhone),
    [conversations, selectedPhone]
  );

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedPhone, selectedConv?.messages?.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#075e54] to-[#128c7e] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><MessageSquare size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><MessageSquare size={24} /> Comunicaciones</h3>
          <p className="text-green-100 text-sm mt-1">CRM de WhatsApp — Registro completo de conversaciones con Rombo</p>
        </div>
      </div>

      {/* WhatsApp Web Layout */}
      <div className="light-card overflow-hidden" style={{ height: 'calc(100vh - 260px)', minHeight: '500px' }}>
        <div className="flex h-full">

          {/* LEFT PANEL - Conversation list */}
          <div className={`${selectedPhone ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[380px] border-r border-gray-200 bg-white`}>
            {/* Search header */}
            <div className="bg-[#f0f2f5] px-3 py-2.5 border-b border-gray-200">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar conversación..."
                  className="w-full pl-9 pr-3 py-2 bg-white border-0 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00a884]/30"
                />
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-4 px-4 py-2 bg-white border-b border-gray-100 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Phone size={12} className="text-green-600" /> {conversations.length} conversaciones</span>
              <span className="flex items-center gap-1"><MessageSquare size={12} className="text-blue-500" /> {conversations.reduce((s, c) => s + (c.messages?.length || 0), 0)} mensajes</span>
              <button onClick={() => refetch()} className="ml-auto p-1 rounded hover:bg-gray-100 transition-all" title="Refrescar"><RefreshCw size={12} /></button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Sin conversaciones</p>
                  <p className="text-sm">Las conversaciones de WhatsApp aparecerán aquí</p>
                </div>
              ) : (
                filtered.map(conv => {
                  const isSelected = selectedPhone === conv.phone;
                  const userMsgCount = countUserMessages(conv.messages || []);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedPhone(conv.phone)}
                      className={`w-full text-left px-3 py-3 flex items-center gap-3 hover:bg-[#f0f2f5] transition-colors border-b border-gray-100/60 ${isSelected ? 'bg-[#f0f2f5]' : ''}`}
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00a884] to-[#075e54] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                        <User size={22} />
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-gray-900 truncate">{formatPhone(conv.phone)}</span>
                          <span className="text-[11px] text-gray-400 shrink-0 ml-2">{timeAgo(conv.updated_at)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-gray-500 truncate pr-2">{getLastPreview(conv.messages || [])}</p>
                          {userMsgCount > 0 && (
                            <span className="bg-[#25d366] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 min-w-[20px] text-center">{userMsgCount}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL - Chat view */}
          <div className={`${selectedPhone ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-[#efeae2]`}>
            {selectedConv ? (
              <>
                {/* Chat header */}
                <div className="bg-[#f0f2f5] px-4 py-2.5 flex items-center gap-3 border-b border-gray-200 shadow-sm">
                  <button onClick={() => setSelectedPhone(null)} className="md:hidden p-1.5 rounded-lg hover:bg-gray-200 transition-all mr-1">
                    <ArrowLeft size={18} className="text-gray-600" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00a884] to-[#075e54] flex items-center justify-center text-white shadow-sm">
                    <User size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-800">{formatPhone(selectedConv.phone)}</p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Clock size={10} /> Última actividad: {new Date(selectedConv.updated_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      {selectedConv.last_intent && (
                        <span className="badge badge-info">{selectedConv.last_intent.replace(/_/g, ' ')}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-white px-2 py-1 rounded-lg border border-gray-200 font-mono">{(selectedConv.messages || []).length} msgs</span>
                  </div>
                </div>

                {/* Chat messages area */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8c8c8' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}>
                  {(() => {
                    const messages = selectedConv.messages || [];
                    let lastDateKey = '';

                    return messages.map((msg, i) => {
                      const isUser = msg.role === 'user';
                      const ts = msg.timestamp || selectedConv.created_at;
                      const dateKey = new Date(ts).toDateString();
                      let showDateSep = false;
                      if (dateKey !== lastDateKey) {
                        lastDateKey = dateKey;
                        showDateSep = true;
                      }

                      return (
                        <React.Fragment key={i}>
                          {showDateSep && (
                            <div className="flex justify-center py-2">
                              <span className="bg-white/90 text-gray-500 text-[11px] font-medium px-3 py-1 rounded-lg shadow-sm">{formatDateSeparator(ts)}</span>
                            </div>
                          )}
                          <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-0.5`}>
                            <div
                              className={`max-w-[75%] px-3 py-1.5 rounded-lg shadow-sm text-[13px] leading-relaxed relative ${
                                isUser
                                  ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none'
                                  : 'bg-white text-gray-800 rounded-tl-none'
                              }`}
                              style={{ wordBreak: 'break-word' }}
                            >
                              {!isUser && (
                                <p className="text-[10px] font-bold text-[#00a884] mb-0.5 flex items-center gap-1"><Bot size={10} /> Rombo</p>
                              )}
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-[10px] text-right mt-0.5 ${isUser ? 'text-gray-500' : 'text-gray-400'}`}>
                                {formatTimestamp(ts)}
                              </p>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    });
                  })()}
                  <div ref={chatEndRef} />
                </div>

                {/* Footer - read only indicator */}
                <div className="bg-[#f0f2f5] px-4 py-3 border-t border-gray-200 flex items-center gap-3">
                  <div className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm text-gray-400 border border-gray-200 flex items-center gap-2">
                    <MessageSquare size={16} className="text-gray-300" />
                    Vista de solo lectura — Los mensajes se envían desde WhatsApp
                  </div>
                </div>
              </>
            ) : (
              /* Empty state - no conversation selected */
              <div className="flex-1 flex flex-col items-center justify-center text-center bg-[#f0f2f5]">
                <div className="w-[260px]">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#00a884]/20 to-[#075e54]/20 flex items-center justify-center mx-auto mb-6">
                    <MessageSquare size={56} className="text-[#00a884]/60" />
                  </div>
                  <h3 className="text-xl font-light text-gray-700 mb-2">Comunicaciones ECAR</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Seleccioná una conversación para ver el historial completo de mensajes con Rombo por WhatsApp.
                  </p>
                  <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Auto-actualización cada 15 segundos
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
