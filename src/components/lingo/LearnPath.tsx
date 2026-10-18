import React, { useState } from 'react';
import { useLingoStore } from '@/lib/lingo/store';
import { getUnitsForLanguages, Exercise } from '@/lib/lingo/content';
import { ArrowRight } from 'lucide-react';

export const LearnPath = () => {
  const { nativeLanguage, targetLanguage, addXp } = useLingoStore();
  const units = getUnitsForLanguages(nativeLanguage, targetLanguage);
  
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSelectOption = (option: string) => {
    if (!activeExercise) return;
    setSelectedOption(option);
    const correct = option === activeExercise.correctAnswer;
    setIsCorrect(correct);
    if (correct) {
      addXp(10);
    }
  };

  const handleNext = () => {
    setActiveExercise(null);
    setSelectedOption(null);
    setIsCorrect(null);
  };

  const isSpanish = nativeLanguage === 'es' || nativeLanguage === 'Spanish' || nativeLanguage === 'español';

  if (activeExercise) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-sm mt-8 border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => setActiveExercise(null)}
            className="text-slate-400 hover:text-slate-600 font-medium"
          >
            ← {isSpanish ? "Volver a la Ruta" : "Back to Path"}
          </button>
          <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            {isSpanish ? "Práctica de Lección" : "Lesson Practice"}
          </span>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-6">{activeExercise.prompt}</h2>

        <div className="space-y-3 mb-8">
          {activeExercise.options?.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            let btnStyle = "border-slate-200 hover:border-indigo-500 text-slate-700 bg-white";
            if (isSelected) {
              if (isCorrect) btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800";
              else btnStyle = "border-rose-500 bg-rose-50 text-rose-800";
            }
            return (
              <button
                key={idx}
                onClick={() => !selectedOption && handleSelectOption(opt)}
                className={`w-full p-4 text-left border-2 rounded-xl font-medium transition-all shadow-sm ${btnStyle}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {selectedOption && (
          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
            <span className={`font-bold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isCorrect ? (isSpanish ? "¡Correcto! 🎉" : "Correct! 🎉") : (isSpanish ? "Incorrecto. Intenta de nuevo." : "Incorrect. Try again.")}
            </span>
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              {isSpanish ? "Siguiente" : "Next"} <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-black text-slate-800 mb-2">
        {isSpanish ? "Ruta de Aprendizaje" : "Learning Path"}
      </h1>
      <p className="text-slate-500 mb-8">
        {isSpanish ? "Selecciona cualquier lección libremente a tu propio ritmo." : "Select any lesson freely at your own pace."}
      </p>

      <div className="space-y-6">
        {units.map((unit) => (
          <div key={unit.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800">{unit.title}</h3>
            <p className="text-sm text-slate-500 mb-4">{unit.description}</p>
            <div className="flex gap-3 flex-wrap">
              {unit.lessons.map((lesson, lIdx) => (
                <button
                  key={lIdx}
                  onClick={() => setActiveExercise(lesson[0])}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {isSpanish ? `Lección ${lIdx + 1}` : `Lesson ${lIdx + 1}`}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
