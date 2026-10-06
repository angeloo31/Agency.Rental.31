'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  X, Send, Bot, User, Sparkles, 
  RefreshCw, Gauge, Fuel, CheckCheck, ArrowRight, Maximize2, Minimize2, ShieldCheck
} from 'lucide-react';
import BrandLogo from './BrandLogo';

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  pricePerDay?: number;
  pricePerHour?: number;
  images?: string[];
  landingImage?: string;
  status: string;
  category: string;
  subcategory?: string;
  description?: string;
  description_fr?: string;
  features?: {
    transmission?: string;
    fuel?: string;
    doors?: number;
    horsepower?: number;
    cc?: number;
  };
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  suggestions?: Vehicle[];
  timestamp: string;
  provider?: string;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Bonjour ! 👋 Je suis **WahranRent AI**, votre concierge automobile VIP alimenté par Google Gemini.\n\nQuelle est votre demande aujourd'hui ? *(ex: \"Je cherche un SUV automatique diesel pour ma famille\", \"Une petite voiture économique pas chère\", \"Quels sont vos tarifs pour 3 jours ?\")*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Fetch available vehicles count for display
  useEffect(() => {
    async function loadVehicles() {
      try {
        const res = await fetch('/api/vehicles');
        if (res.ok) {
          const data = await res.json();
          setVehicles(Array.isArray(data) ? data : (data.vehicles || []));
        }
      } catch (err) {
        console.error('Failed to load vehicles count for chatbot assistant:', err);
      }
    }

    loadVehicles();
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  // Format markdown bold & italic into clean styled spans
  const formatText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const formattedParts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-extrabold text-blue-200">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={pIdx} className="text-slate-300 font-medium not-italic bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">{part.slice(1, -1)}</em>;
        }
        return part;
      });

      return (
        <span key={idx} className="block min-h-[1.3em]">
          {formattedParts}
        </span>
      );
    });
  };

  const sendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setIsTyping(true);

    try {
      // Send chat request to backend AI / RAG endpoint
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          messages: [...messages, userMsg].map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: data.reply || "Voici les recommandations correspondant à votre demande :",
          suggestions: data.recommendedVehicles || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: data.provider || 'AI Engine'
        };

        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error('API request failed');
      }
    } catch (err) {
      console.error('Chat error:', err);
      // Fallback response if network issue
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "Desolé, une petite gêne réseau s'est produite. Voici notre flotte principale disponible immédiatement :",
        suggestions: vehicles.slice(0, 3),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleChipClick = (suggestionText: string) => {
    sendMessage(suggestionText);
  };

  return (
    <>
      {/* Floating Launcher Button with Halo */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {/* Notification Badge Bubble */}
          {hasUnread && (
            <div 
              onClick={handleOpen}
              className="hidden sm:flex items-center gap-2.5 bg-slate-900/90 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl border border-blue-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-bounce cursor-pointer group hover:border-blue-400 transition-all"
            >
              <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="group-hover:text-blue-300 transition-colors">Discuter avec notre IA Concierge 💬</span>
            </div>
          )}

          <button
            onClick={handleOpen}
            className="relative group p-4 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 text-white shadow-[0_0_35px_rgba(37,99,235,0.45)] hover:shadow-[0_0_50px_rgba(37,99,235,0.7)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer border border-white/30"
            aria-label="Ouvrir le Chatbot Concierge"
          >
            <Bot className="w-7 h-7 text-white group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse shadow-sm" />
          </button>
        </div>
      )}

      {/* Chat Window Drawer / Modal */}
      {isOpen && (
        <div 
          className={`fixed z-50 bg-slate-950/95 border border-slate-800/90 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col backdrop-blur-2xl overflow-hidden text-slate-200 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 ${
            isExpanded 
              ? 'bottom-2 right-2 sm:bottom-4 sm:right-4 w-[calc(100vw-1rem)] sm:w-[620px] h-[calc(100vh-2rem)] sm:h-[750px]' 
              : 'bottom-3 right-3 sm:bottom-6 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[500px] max-h-[88vh] h-[660px]'
          }`}
        >
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-blue-950/70 to-slate-900 border-b border-slate-800/80 flex items-center justify-between relative overflow-hidden shrink-0">
            {/* Ambient Top Glow */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-12 bg-blue-500/20 blur-xl rounded-full pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white shadow-lg ring-2 ring-blue-400/30">
                <Bot className="w-5.5 h-5.5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-white tracking-wide">
                    WahranRent Concierge
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/30 to-indigo-500/30 text-blue-200 text-[10px] font-extrabold border border-blue-400/30 shadow-xs flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    AI Real
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  <span>En ligne</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 relative z-10">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Réduire" : "Agrandir"}
                className="hidden sm:flex p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setMessages([{
                  id: 'welcome',
                  sender: 'bot',
                  text: "Discussion réinitialisée ! 🔄 Quel véhicule souhaitez-vous réserver aujourd'hui ?",
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }])}
                title="Effacer la discussion"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3.5 py-2.5 bg-slate-900/70 border-b border-slate-800/60 overflow-x-auto no-scrollbar flex items-center gap-2 text-xs shrink-0">
            <button
              onClick={() => handleChipClick('Propose-moi un SUV 4x4 familial spacieux automatique')}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700/60 shadow-sm transition-all shrink-0 font-semibold cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <span>🚗</span>
              <span>SUV & 4x4</span>
            </button>
            <button
              onClick={() => handleChipClick('Je veux une voiture de luxe automatique très puissante')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500 hover:to-amber-600 text-amber-300 hover:text-slate-950 border border-amber-500/30 transition-all shrink-0 font-bold cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sport & Luxe</span>
            </button>
            <button
              onClick={() => handleChipClick('Une citadine pas chère et économique pour la ville')}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700/60 shadow-sm transition-all shrink-0 font-semibold cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <span>💰</span>
              <span>Citadine Économique</span>
            </button>
            <button
              onClick={() => handleChipClick('Quelles sont les conditions de location et faut-il une caution ?')}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700/60 shadow-sm transition-all shrink-0 font-semibold cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <span>📜</span>
              <span>Conditions & Caution</span>
            </button>
            <button
              onClick={() => handleChipClick('Quels modèles Dacia avez-vous en stock ?')}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700/60 shadow-sm transition-all shrink-0 font-semibold cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <span>🇩🇿</span>
              <span>Gamme Dacia</span>
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-4 text-xs sm:text-sm bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/25 via-slate-950 to-slate-950 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 sm:gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Bot Avatar */}
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 border border-blue-400/40 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`space-y-2 ${msg.sender === 'user' ? 'max-w-[88%] items-end' : 'w-full max-w-[96%] items-start'}`}>
                  {/* Message Bubble */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl shadow-xl leading-relaxed transition-all ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-tr-xs font-medium shadow-blue-600/20 border border-blue-400/30'
                        : 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/90 text-slate-200 rounded-tl-xs backdrop-blur-xl shadow-black/40'
                    }`}
                  >
                    {/* Bot Badge Tag inside message */}
                    {msg.sender === 'bot' && (
                      <div className="flex items-center justify-between gap-1.5 mb-2.5 pb-2 border-b border-slate-800/80 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-extrabold uppercase tracking-wider text-blue-400">
                            WahranRent AI Concierge
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="text-slate-200 leading-relaxed">
                      {formatText(msg.text)}
                    </div>

                    {/* Vehicle Suggestions Cards inside Bot Message */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-3">
                        {msg.suggestions.map((veh) => {
                          const mainImg = veh.images?.[0] || veh.landingImage || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=400';
                          return (
                            <div 
                              key={veh._id} 
                              className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/90 hover:border-blue-500/80 shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 group relative overflow-hidden"
                            >
                              {/* Glowing side accent */}
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 via-indigo-500 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity" />

                              {/* Vehicle Image Container */}
                              <div className="w-full sm:w-32 h-36 sm:h-24 rounded-xl bg-slate-900 overflow-hidden relative shrink-0 border border-slate-800/80 shadow-inner">
                                <img 
                                  src={mainImg} 
                                  alt={`${veh.make} ${veh.model}`}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                />
                                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/90 text-emerald-400 font-extrabold text-[9px] border border-emerald-500/30 backdrop-blur-md shadow-sm">
                                  {veh.status === 'Available' ? 'Disponible' : veh.status}
                                </span>
                                {veh.subcategory && (
                                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-blue-950/90 text-blue-300 font-bold text-[8px] uppercase tracking-wider border border-blue-500/30 backdrop-blur-md">
                                    {veh.subcategory}
                                  </span>
                                )}
                              </div>

                              {/* Details Container */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2.5">
                                <div>
                                  {/* Title row with emblem logo */}
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <BrandLogo brand={veh.make} size={16} className="shrink-0" />
                                    <h4 className="font-extrabold text-sm text-white truncate group-hover:text-blue-300 transition-colors">
                                      {veh.make} {veh.model}
                                    </h4>
                                  </div>

                                  {/* Specifications tags */}
                                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-300 font-medium">
                                    <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-bold">{veh.year}</span>
                                    {veh.features?.transmission && (
                                      <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1 text-slate-300">
                                        <Gauge className="w-3 h-3 text-blue-400" />
                                        {veh.features.transmission === 'Automatic' ? 'Automatique' : 'Manuelle'}
                                      </span>
                                    )}
                                    {veh.features?.fuel && (
                                      <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1 text-slate-300">
                                        <Fuel className="w-3 h-3 text-amber-400" />
                                        {veh.features.fuel}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Price and Action CTA */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-900/90">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tarif conseillé</span>
                                    <span className="font-black text-sm text-emerald-400 tracking-tight">
                                      {veh.pricePerDay ? `${veh.pricePerDay.toLocaleString()} DA` : `${veh.pricePerHour || 0} DA/h`}
                                      {veh.pricePerDay && <span className="text-[10px] font-normal text-slate-400"> / jour</span>}
                                    </span>
                                  </div>

                                  <Link
                                    href={`/fleet?vehicle=${veh._id}`}
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-[11px] shadow-lg shadow-blue-600/30 transition-all shrink-0 flex items-center gap-1.5 group/btn active:scale-95"
                                  >
                                    <span>Réserver</span>
                                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                  </Link>
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Timestamp & Status Icon */}
                  <div className={`flex items-center gap-1 text-[10px] text-slate-500 px-1 font-medium ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'user' && (
                      <CheckCheck className="w-3.5 h-3.5 text-blue-400 inline" />
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 shadow-md mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800/90 flex items-center gap-2 text-slate-300 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-150" />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-300" />
                  <span className="text-xs font-semibold ml-1">L'IA génère la réponse et analyse la flotte...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3.5 bg-slate-900/90 border-t border-slate-800/80 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez votre question à l'IA (ex: tarifs, SUV disponible, conditions...)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/80 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/30 active:scale-95 shrink-0 flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>

            <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 px-1 font-medium">
              <span className="flex items-center gap-1 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Flotte synchronisée en direct
              </span>
              <span className="text-blue-400 font-bold">WahranRent AI 2026</span>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
