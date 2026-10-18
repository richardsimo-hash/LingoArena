import React, { useState } from 'react';
import { useLingoStore } from '@/lib/lingo/store';
import { LearnPath } from '@/components/lingo/LearnPath';
import { SpeechArena } from '@/components/lingo/SpeechArena';
import { GrammarBattle } from '@/components/lingo/GrammarBattle';
import { Stats } from '@/components/lingo/Stats';
import { Settings } from '@/components/lingo/Settings';
import { 
  BookOpen, 
  Mic, 
  Swords, 
  BarChart3, 
  Settings as SettingsIcon, 
  Flame, 
  Gem, 
  Heart,
  MessageSquare
} from 'lucide-react';

export default function LingoArenaApp() {
  const [activeTab, setActiveTab] = useState<'learn' | 'speech' | 'grammar' | 'progress' | 'chat'>('learn');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { nativeLanguage, targetLanguage, xp, streak, setTargetLanguage } = useLingoStore();
  const isSpanish = nativeLanguage === 'es' || nativeLanguage === 'Spanish' || nativeLanguage === 'español';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-indigo-600 tracking-tight">LingoArena</h1>
          <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-2.5 py-1 rounded-full border border-indigo-100">
            AI Vibe Coding
          </span>
        </div>

        {/* Stats & Quick Actions */}
        <div className="flex items-center gap-6">
          {/* Target Language Selector */}
          <select 
            value={targetLanguage} 
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="en">🇺🇸 English</option>
            <option value="fr">🇫🇷 French</option>
            <option value="de">🇩🇪 German</option>
            <option value="it">🇮🇹 Italian</option>
            <option value="ja">🇯🇵 Japanese</option>
            <option value="pt">🇵🇹 Portuguese</option>
          </select>

          <div className="flex items-center gap-1.5 font-bold text-amber-500 text-sm bg-amber-50 px-3 py-1.5 rounded-xl">
            <Flame size={18} className="fill-amber-500" />
            <span>{streak}</span>
          </div>

          <div className="flex items-center gap-1.5 font-bold text-cyan-600 text-sm bg-cyan-50 px-3 py-1.5 rounded-xl">
            <Gem size={18} className="fill-cyan-500" />
            <span>{xp}</span>
          </div>

          {/* Vidas Infinitas */}
          <div className="flex items-center gap-1.5 font-bold text-rose-500 text-sm bg-rose-50 px-3 py-1.5 rounded-xl">
            <Heart size={18} className="fill-rose-500" />
            <span className="text-base">∞</span>
          </div>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Settings"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('learn')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'learn' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen size={20} />
            <span>{isSpanish ? 'Ruta de Aprendizaje' : 'Learn Path'}</span>
          </button>

          <button
            onClick={() => setActiveTab('speech')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'speech' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mic size={20} />
            <span>{isSpanish ? 'Arena de Voz' : 'Speech Arena'}</span>
          </button>

          <button
            onClick={() => setActiveTab('grammar')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'grammar' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Swords size={20} />
            <span>{isSpanish ? 'Batalla Gramatical' : 'Grammar Battle'}</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'chat' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare size={20} />
            <span>{isSpanish ? 'Chat con Avatar' : 'Free Chat AI'}</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'progress' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 size={20} />
            <span>{isSpanish ? 'Progreso' : 'Progress'}</span>
          </button>
        </aside>

        {/* Dynamic Workspace Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === 'learn' && <LearnPath />}
          {activeTab === 'speech' && <SpeechArena />}
          {activeTab === 'grammar' && <GrammarBattle />}
          {activeTab === 'progress' && <Stats />}
          {activeTab === 'chat' && (
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
              <h2 className="text-2xl font-black text-slate-800 mb-2">
                {isSpanish ? 'Chat Abierto con el Avatar' : 'Free Chat Avatar'}
              </h2>
              <p className="text-slate-500 mb-6">
                {isSpanish ? 'Conversa libremente con tu guía de IA en cualquier idioma.' : 'Chat freely with your AI guide in any language.'}
              </p>
              <div className="p-12 bg-indigo-50/50 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-700 font-medium">
                {isSpanish ? 'Módulo de Avatar Conversacional Activo.' : 'Conversational Avatar Module Active.'}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Settings Modal Component */}
      {isSettingsOpen && <Settings onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}
