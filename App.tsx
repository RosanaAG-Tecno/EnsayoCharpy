import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Beaker, Settings, RotateCcw, Play, TrendingUp, BrainCircuit, Trash2, Info, Search, ArrowDown } from 'lucide-react';
import SimulationCanvas from './components/SimulationCanvas';
import { EnergyChart } from './components/Charts';
import { MATERIALS, DEFAULT_CONFIG, GRAVITY } from './constants';
import { Material, PendulumConfig, TestResult, SimulationState } from './types';
import { analyzeResults } from './services/geminiService';
import ReactMarkdown from 'react-markdown';

const App: React.FC = () => {
  // --- State ---
  const [config, setConfig] = useState<PendulumConfig>(DEFAULT_CONFIG);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(MATERIALS[0].id);
  const [simulationState, setSimulationState] = useState<SimulationState>(SimulationState.IDLE);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showMagnifier, setShowMagnifier] = useState(false);
  
  // Refs
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Current Simulation Calculation State
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);

  const selectedMaterial = MATERIALS.find(m => m.id === selectedMaterialId) || MATERIALS[0];

  // --- Physics Logic ---
  const runSimulation = useCallback(() => {
    if (simulationState !== SimulationState.IDLE) return;
    setShowMagnifier(false); // Hide magnifier when starting

    // 1. Calculate Initial Potential Energy (PE1)
    // h1 = L(1 - cos(startAngle))
    const startRad = config.startAngle * (Math.PI / 180);
    const h1 = config.length * (1 - Math.cos(startRad));
    const pe1 = config.mass * GRAVITY * h1;

    // 2. Determine Material Absorption (Simulated with random variance)
    const variance = (Math.random() * 0.1) - 0.05; 
    let absorbed = selectedMaterial.baseToughness * (1 + variance);

    // Physics constraint
    let didBreak = true;
    if (absorbed >= pe1) {
      absorbed = pe1;
      didBreak = false; 
    }

    // 3. Calculate Final Height and Angle
    const pe2 = pe1 - absorbed;
    const h2 = pe2 / (config.mass * GRAVITY);
    const cosBeta = 1 - (h2 / config.length);
    const safeCosBeta = Math.max(-1, Math.min(1, cosBeta)); 
    const finalAngleRad = Math.acos(safeCosBeta);
    const finalAngleDeg = finalAngleRad * (180 / Math.PI);

    const result: TestResult = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      material: selectedMaterial,
      initialEnergy: pe1,
      absorbedEnergy: absorbed,
      finalAngle: finalAngleDeg,
      didBreak
    };

    setCurrentResult(result);
    setSimulationState(SimulationState.SWINGING_DOWN);

    setTimeout(() => {
      setSimulationState(SimulationState.IMPACT);
      setTimeout(() => {
        setSimulationState(SimulationState.SWINGING_UP);
        setTimeout(() => {
           setSimulationState(SimulationState.OSCILLATING);
        }, 1000);
      }, 100);
    }, 800); 

  }, [config, selectedMaterial, simulationState]);

  const handleAnimationComplete = () => {
    setSimulationState(SimulationState.IDLE);
    if (currentResult) {
      setTestHistory(prev => [...prev, currentResult]);
    }
  };

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    const analysis = await analyzeResults(testHistory);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const clearHistory = () => {
    setTestHistory([]);
    setAiAnalysis('');
    setCurrentResult(null);
  };

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Beaker className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">CharpySim Lab</h1>
              <p className="text-xs text-slate-400">Simulador Interactivo de Ensayo de Impacto</p>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               Sistema Listo
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 flex flex-col gap-6">
        
        {/* ROW 1: Simulation (Left) & Config (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Simulation Area (8 Cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-slate-200 p-1 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl flex-wrap gap-4">
               <h2 className="font-semibold text-slate-700 flex items-center gap-2 mr-auto">
                 <RotateCcw className={`w-4 h-4 ${simulationState !== SimulationState.IDLE ? 'animate-spin' : ''}`}/>
                 Cámara de Ensayo
               </h2>
               <div className="flex items-center gap-3">
                 <button
                    onClick={runSimulation}
                    disabled={simulationState !== SimulationState.IDLE}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-full font-bold shadow-sm transition-all active:scale-95 text-xs uppercase tracking-wide"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Iniciar Ensayo
                  </button>
                 <div className="h-6 w-px bg-slate-200 mx-1"></div>
                 <button 
                   onClick={() => setShowMagnifier(!showMagnifier)}
                   className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${showMagnifier ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                   title="Ver detalle de probeta"
                 >
                   <Search className="w-3 h-3" />
                   {showMagnifier ? 'Ocultar Lupa' : 'Ver Probeta'}
                 </button>
                 <button 
                   onClick={scrollToResults}
                   className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border bg-white border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                   title="Ir a resultados"
                 >
                   <ArrowDown className="w-3 h-3" />
                   Ver Resultados
                 </button>
               </div>
            </div>
            <div className="p-4 flex-1 relative">
              <SimulationCanvas 
                config={config} 
                material={simulationState !== SimulationState.IDLE || showMagnifier ? selectedMaterial : null}
                state={simulationState}
                finalAngleResult={currentResult?.finalAngle || 0}
                onAnimationComplete={handleAnimationComplete}
                showMagnifier={showMagnifier}
              />
            </div>
          </div>

          {/* Configuration Panel (4 Cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6 text-slate-800 pb-4 border-b border-slate-100">
              <Settings className="w-5 h-5" />
              <h2 className="font-semibold">Configuración del Ensayo</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              {/* Machine Config */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parámetros del Péndulo</h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Masa de la Maza (kg)</label>
                  <input 
                    type="range" min="5" max="50" step="1"
                    value={config.mass}
                    disabled={simulationState !== SimulationState.IDLE}
                    onChange={(e) => setConfig({...config, mass: Number(e.target.value)})}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>5kg</span>
                    <span className="font-bold text-slate-700">{config.mass} kg</span>
                    <span>50kg</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Longitud del Brazo (m)</label>
                  <input 
                    type="range" min="0.5" max="1.5" step="0.1"
                    value={config.length}
                    disabled={simulationState !== SimulationState.IDLE}
                    onChange={(e) => setConfig({...config, length: Number(e.target.value)})}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0.5m</span>
                    <span className="font-bold text-slate-700">{config.length} m</span>
                    <span>1.5m</span>
                  </div>
                </div>

                 <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Ángulo Inicial (Grados)</label>
                  <input 
                    type="range" min="90" max="160" step="1"
                    value={config.startAngle}
                    disabled={simulationState !== SimulationState.IDLE}
                    onChange={(e) => setConfig({...config, startAngle: Number(e.target.value)})}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>90°</span>
                    <span className="font-bold text-slate-700">{config.startAngle}°</span>
                    <span>160°</span>
                  </div>
                </div>
              </div>

              {/* Material Config */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Material de la Probeta</h3>
                <div className="grid grid-cols-1 gap-2">
                  {MATERIALS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMaterialId(m.id)}
                      disabled={simulationState !== SimulationState.IDLE}
                      className={`flex items-center p-3 rounded-lg border text-left transition-all ${
                        selectedMaterialId === m.id 
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full mr-3 shadow-sm flex-shrink-0" style={{backgroundColor: m.color}}></span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">{m.name}</div>
                        <div className="text-xs text-slate-500 truncate">{m.type}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-100 italic">
                  {selectedMaterial.description}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Results (Left) & Charts (Right) */}
        <div ref={resultsRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Results & Live Data (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-slate-900 text-white rounded-xl shadow-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="w-32 h-32" />
              </div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Resultados del Ensayo
              </h2>
              
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                      <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Energía Inicial ($E_p$)</div>
                      <div className="text-2xl font-mono font-bold">
                        {simulationState !== SimulationState.IDLE || currentResult 
                         ? (currentResult?.initialEnergy || (config.mass * GRAVITY * config.length * (1 - Math.cos(config.startAngle * Math.PI/180)))).toFixed(1) 
                         : '0.0'} J
                      </div>
                    </div>
                    <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/5">
                      <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Energía Absorbida (KV)</div>
                      <div className={`text-2xl font-mono font-bold ${currentResult ? 'text-green-400' : 'text-slate-500'}`}>
                        {currentResult ? currentResult.absorbedEnergy.toFixed(1) : '---'} J
                      </div>
                    </div>
                 </div>

                 <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                   <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                     Resiliencia (Tenacidad de Entalla)
                     <Info className="w-3 h-3 cursor-help" title="Energía absorbida por unidad de área de la sección transversal en la entalla."/>
                   </div>
                   <div className="text-lg font-semibold">
                     {currentResult 
                      ? `${(currentResult.absorbedEnergy / 0.8).toFixed(2)} J/cm²` 
                      : '---'}
                   </div>
                   <p className="text-xs text-slate-400 mt-1">Estimado para probeta estándar (sección 0.8 cm²)</p>
                 </div>

                 {currentResult && (
                   <div className="bg-blue-900/40 p-3 rounded border border-blue-500/30 text-sm">
                     <span className="font-bold text-blue-200">Interpretación:</span> El material se comportó de manera 
                     <span className="font-bold text-white uppercase ml-1">{currentResult.material.fractureType === 'Ductile' ? 'Dúctil' : currentResult.material.fractureType === 'Brittle' ? 'Frágil' : 'Mixta'}</span>.
                   </div>
                 )}
              </div>
            </div>
            
            {/* Last Results List */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-slate-700">Historial Reciente</h3>
                  {testHistory.length > 0 && (
                    <button onClick={clearHistory} className="text-xs text-red-500 flex items-center gap-1 hover:underline">
                      <Trash2 className="w-3 h-3"/> Limpiar
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto max-h-[200px] space-y-2">
                   {testHistory.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Sin datos registrados.</p>}
                   {testHistory.slice().reverse().map((r) => (
                     <div key={r.id} className="flex justify-between items-center p-2 bg-slate-50 rounded text-sm">
                        <span className="font-medium text-slate-700">{r.material.name}</span>
                        <span className="font-mono text-slate-600">{r.absorbedEnergy.toFixed(1)} J</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Comparative Charts & Analysis (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <h2 className="font-semibold text-slate-800 mb-4">Análisis Comparativo</h2>

            {testHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-lg min-h-[300px]">
                <Info className="w-10 h-10 mb-3 opacity-30" />
                <p>Realiza varios ensayos para comparar materiales.</p>
              </div>
            ) : (
              <>
                <EnergyChart results={testHistory} />
                
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <button 
                    onClick={handleAiAnalysis}
                    disabled={isAnalyzing}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 p-4 rounded-lg flex items-center justify-center gap-2 transition-colors mb-4"
                  >
                    {isAnalyzing ? (
                      <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <BrainCircuit className="w-5 h-5" />
                    )}
                    {isAnalyzing ? "Analizando Propiedades del Material..." : "Generar Informe con IA"}
                  </button>

                  {aiAnalysis && (
                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-sm text-slate-700 leading-relaxed max-h-[400px] overflow-y-auto prose prose-sm prose-slate">
                      <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;