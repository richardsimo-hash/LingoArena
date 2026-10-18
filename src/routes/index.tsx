import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useLingoStore } from '../lib/lingo/store';
import LearnPath from '../components/lingo/learnpath';
import { BookOpen, Mic, Swords, BarChart2, Heart, Flame } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: LingoApp,
});

function LingoApp() {
  const [activeTab, setActiveTab] = useState<'learn' | 'speech' | 'grammar' | 'stats'>('learn');
  const { xp, streak } = useLingoStore();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <h1 className="text-2xl font-black text-indigo-600">LingoArena</h1>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">AI</span>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('learn')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'learn' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              Aprender
            </button>
            <button
              onClick={() => setActiveTab('speech')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'speech' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Mic className="w-5 h-5" />
              Pronunciación
            </button>
            <button
              onClick={() => setActiveTab('grammar')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'grammar' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Swords className="w-5 h-5" />
              Gramática
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'stats' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart2 className="w-5 h-5" />
              Progreso
            </button>
          </nav>
        </div>

        {/* User Stats / Profile footer */}
        <div className="border-t border-slate-100 pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span className="flex items-center gap-1 font-semibold text-amber-500">
              <Flame className="w-4 h-4 fill-amber-500" /> {streak} días
            </span>
            <span className="flex items-center gap-1 font-semibold text-indigo-600">
              ⚡ {xp} XP
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'learn' && <LearnPath />}

        {activeTab === 'speech' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Práctica de Voz</h2>
            <p className="text-slate-500">Mejora tu pronunciación con IA.</p>
          </div>
        )}

        {activeTab === 'grammar' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Batalla de Gramática</h2>
            <p className="text-slate-500">Desafíos rápidos de gramática en inglés.</p>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Progreso General</h2>
            <p className="text-slate-500">XP acumulado: {xp} | Vidas: Infinitas (∞)</p>
          </div>
        )}
      </main>
    </div>
  );
}
