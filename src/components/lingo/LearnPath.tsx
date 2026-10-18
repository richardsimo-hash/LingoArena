import React from 'react';
import { Flame, CheckCircle, Lock } from 'lucide-react';

export default function LearnPath() {
  const units = [
    { id: 1, title: 'Unidad 1: Fundamentos', status: 'completed', description: 'Saludos y presentaciones básicas' },
    { id: 2, title: 'Unidad 2: Comida y Restaurantes', status: 'current', description: 'Pedir platos y hablar de preferencias' },
    { id: 3, title: 'Unidad 3: Viajes y Direcciones', status: 'locked', description: 'Preguntar por el camino y transportes' },
    { id: 4, title: 'Unidad 4: Negocios y Trabajo', status: 'locked', description: 'Vocabulario profesional y reuniones' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Ruta de Aprendizaje</h2>
          <p className="text-slate-500">Completa lecciones para ganar XP y mantener tu racha.</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl font-bold">
          <Flame className="w-5 h-5 fill-amber-500" />
          <span>¡Sigue así!</span>
        </div>
      </div>

      <div className="space-y-4">
        {units.map((unit, index) => (
          <div
            key={unit.id}
            className={`p-6 rounded-2xl border transition-all flex items-center justify-between ${
              unit.status === 'current'
                ? 'bg-indigo-50 border-indigo-300 shadow-md ring-2 ring-indigo-500/20'
                : unit.status === 'completed'
                ? 'bg-white border-emerald-200'
                : 'bg-slate-50 border-slate-200 opacity-75'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                  unit.status === 'current'
                    ? 'bg-indigo-600 text-white'
                    : unit.status === 'completed'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {unit.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : unit.status === 'locked' ? <Lock className="w-6 h-6" /> : index + 1}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{unit.title}</h3>
                <p className="text-sm text-slate-500">{unit.description}</p>
              </div>
            </div>

            <div>
              {unit.status === 'current' && (
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all">
                  Continuar
                </button>
              )}
              {unit.status === 'completed' && (
                <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1.5 rounded-lg">
                  Completado
                </span>
              )}
              {unit.status === 'locked' && (
                <span className="text-slate-400 font-medium text-sm">Bloqueado</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
