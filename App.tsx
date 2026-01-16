
import React, { useState, useEffect } from 'react';
import {
  User,
  HistoryItem,
  AnalysisData,
  Section,
  DrillProblem,
  DrillResult,
  MasteryMetrics
} from './types';
import { generateDrills } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { AnalysisResult } from './components/AnalysisResult';
import { DrillSession } from './components/DrillSession';
import { Settings } from './components/Settings';
import { TrainingGrounds } from './components/TrainingGrounds';
import { ProblemInput } from './components/ProblemInput';
import { Onboarding } from './components/Onboarding';
import { VocabularyTrainer } from './components/VocabularyTrainer';
import { Documentation } from './components/Documentation';
import { LayoutDashboard, Target, Settings as SettingsIcon, BrainCircuit, Crosshair, User as UserIcon, Book, BookOpen } from 'lucide-react';
import { syncUser, syncHistoryItem, pullHistory, wipeCloudHistory } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'analyze' | 'analysis-result' | 'drills' | 'training' | 'vocab' | 'settings' | 'docs'>('dashboard');
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisData | null>(null);
  const [lastUserAnswer, setLastUserAnswer] = useState<string>('');
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState<string>('');
  const [drills, setDrills] = useState<DrillProblem[] | null>(null);
  const [loadingDrills, setLoadingDrills] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem('act_user_profile');
    if (savedProfile) {
      const parsedUser = JSON.parse(savedProfile);
      setUser(parsedUser);
      initUserData(parsedUser);
    } else {
      setShowOnboarding(true);
    }
  }, []);

  const initUserData = async (activeUser: User) => {
    try {
      const cloudData = await pullHistory(activeUser.id);
      if (cloudData && cloudData.length > 0) {
        setHistory(cloudData);
        localStorage.setItem('act_history', JSON.stringify(cloudData));
      } else {
        const saved = localStorage.getItem('act_history');
        if (saved) setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("History pull failed.");
    }
    syncUser(activeUser).catch(() => { });
  };

  const handleOnboardingComplete = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('act_user_profile', JSON.stringify(newUser));
    setShowOnboarding(false);
    initUserData(newUser);
  };

  const handleAnalysisComplete = async (data: AnalysisData, userAnswer: string, correctAnswer: string) => {
    setLastAnalysis(data);
    setLastUserAnswer(userAnswer);
    setLastCorrectAnswer(correctAnswer);
    setDrills(null);
    setCurrentView('analysis-result');
  };

  const handleGenerateDrills = async (overrideAnalysis?: AnalysisData) => {
    const analysisToUse = overrideAnalysis || lastAnalysis;
    if (!analysisToUse) return;
    setLoadingDrills(true);
    try {
      const generatedDrills = await generateDrills(analysisToUse);
      setDrills(generatedDrills);
    } catch (error) {
      console.error("Drill Generation Failed:", error);
    } finally {
      setLoadingDrills(false);
    }
  };

  const handleDrillComplete = async (result: DrillResult) => {
    const analysisData = lastAnalysis;
    if (!analysisData) {
      setCurrentView('dashboard');
      return;
    }

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: result.timestamp,
      originalInput: analysisData.surface.underlinedSnippet || 'Combat Training',
      analysis: analysisData,
      drillResult: result
    };

    const newHistory = [newItem, ...history];
    setHistory(newHistory);
    localStorage.setItem('act_history', JSON.stringify(newHistory));

    if (user) {
      syncHistoryItem(user.id, newItem).catch(() => { });
    }

    setDrills(null);
    setLastAnalysis(null);
    setCurrentView('dashboard');
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('act_user_profile', JSON.stringify(updatedUser));
    syncUser(updatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('act_user_profile');
    localStorage.removeItem('act_history');
    setUser(null);
    setHistory([]);
    setShowOnboarding(true);
    setCurrentView('dashboard');
  };

  const masteryData: MasteryMetrics[] = history.reduce((acc: MasteryMetrics[], item) => {
    if (!item.analysis?.surface?.questionType) return acc;
    const cat = item.analysis.surface.questionType;
    let m = acc.find(x => x.category === cat);
    if (!m) {
      m = { category: cat, attempts: 0, avgAccuracy: 0, stabilityScore: 0, status: 'Stabilized' };
      acc.push(m);
    }
    m.attempts += 1;
    m.avgAccuracy = (m.avgAccuracy * (m.attempts - 1) + (item.drillResult?.scorePercentage || 0)) / m.attempts;
    if (m.avgAccuracy < 70) m.status = 'Critical';
    else if (m.avgAccuracy < 85) m.status = 'Unstable';
    else m.status = 'Secured';
    return acc;
  }, []);

  if (showOnboarding) return <Onboarding onComplete={handleOnboardingComplete} />;
  if (!user) return null;

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white selection:bg-[#2e7dff]/30 ${user.preferences.highContrast ? 'contrast-125' : ''}`}>
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-20 bg-black/80 backdrop-blur-xl border-t md:border-t-0 md:border-r border-white/5 z-50 flex md:flex-col justify-around md:justify-start items-center p-4 md:py-10 gap-8">
        <div className="hidden md:flex mb-10 text-[#2e7dff]"><BrainCircuit size={32} /></div>
        <button onClick={() => setCurrentView('dashboard')} className={`p-3 rounded-2xl transition-all ${currentView === 'dashboard' ? 'text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`} title="Dashboard"><LayoutDashboard size={24} /></button>
        <button onClick={() => setCurrentView('analyze')} className={`p-3 rounded-2xl transition-all ${currentView === 'analyze' || currentView === 'analysis-result' ? 'text-act-red bg-act-red/10 shadow-[0_0_20px_rgba(255,77,77,0.2)]' : 'text-gray-500 hover:text-gray-300'}`} title="Combat Analysis"><Crosshair size={24} /></button>
        <button onClick={() => setCurrentView('training')} className={`p-3 rounded-2xl transition-all ${currentView === 'training' ? 'text-act-accent bg-act-accent/10 shadow-[0_0_20px_rgba(46,125,255,0.2)]' : 'text-gray-500 hover:text-gray-300'}`} title="Combat Map"><Target size={24} /></button>
        <button onClick={() => setCurrentView('vocab')} className={`p-3 rounded-2xl transition-all ${currentView === 'vocab' ? 'text-purple-400 bg-purple-400/10 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'text-gray-500 hover:text-gray-300'}`} title="Elite Vocab"><Book size={24} /></button>
        <button onClick={() => setCurrentView('docs')} className={`p-3 rounded-2xl transition-all ${currentView === 'docs' ? 'text-act-accent bg-act-accent/10 shadow-[0_0_20px_rgba(46,125,255,0.2)]' : 'text-gray-500 hover:text-gray-300'}`} title="Tactical Blueprint"><BookOpen size={24} /></button>
        <button onClick={() => setCurrentView('settings')} className={`p-3 rounded-2xl transition-all ${currentView === 'settings' ? 'text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`} title="Settings"><SettingsIcon size={24} /></button>

        <div className="hidden md:flex flex-col items-center mt-auto gap-2 opacity-40 hover:opacity-100 transition-opacity">
          <div className="h-10 w-10 glass rounded-full flex items-center justify-center text-act-accent border-act-accent/20">
            <UserIcon size={18} />
          </div>
          <span className="text-[8px] font-mono font-bold uppercase text-center max-w-[60px] truncate">{user.name}</span>
        </div>
      </nav>

      <main className="md:pl-20 px-6 pt-10 pb-32 max-w-7xl mx-auto">
        {currentView === 'dashboard' && <Dashboard history={history} onDelete={(id) => {
          const next = history.filter(h => h.id !== id);
          setHistory(next);
          localStorage.setItem('act_history', JSON.stringify(next));
        }} />}
        {currentView === 'analyze' && <ProblemInput onAnalysisComplete={handleAnalysisComplete} history={history} />}
        {currentView === 'analysis-result' && lastAnalysis && (
          <div className="space-y-6">
            <AnalysisResult
              data={lastAnalysis}
              drills={drills}
              loadingDrills={loadingDrills}
              onGenerateDrills={() => handleGenerateDrills()}
              userAnswer={lastUserAnswer}
              correctAnswer={lastCorrectAnswer}
            />
            {drills && <button onClick={() => setCurrentView('drills')} className="w-full bg-[#2e7dff] text-white font-bold py-6 rounded-3xl hover:bg-blue-600 transition-all uppercase font-mono tracking-widest text-sm shadow-xl shadow-act-accent/20">Commence Live Drills</button>}
          </div>
        )}
        {currentView === 'drills' && drills && <DrillSession drills={drills} questionType={lastAnalysis?.surface.questionType || 'Mixed'} section={lastAnalysis?.surface.section || Section.English} enableTimer={user.preferences.enableTimer} onComplete={handleDrillComplete} onCancel={() => setCurrentView('dashboard')} />}
        {currentView === 'training' && <TrainingGrounds masteryData={masteryData} history={history} onDeployDrill={(analysis) => { setLastAnalysis(analysis as AnalysisData); setDrills(null); setCurrentView('analysis-result'); }} loading={loadingDrills} />}
        {currentView === 'vocab' && <VocabularyTrainer user={user} onUpdateUser={handleUpdateUser} />}
        {currentView === 'docs' && <Documentation />}
        {currentView === 'settings' && <Settings user={user} onWipe={async () => {
          setHistory([]);
          localStorage.removeItem('act_history');
          await wipeCloudHistory(user.id);
        }} onUpdateScore={(s) => handleUpdateUser({ targetScore: s })}
          onUpdatePreferences={(p) => handleUpdateUser({ preferences: { ...user.preferences, ...p } })}
          onUpdateCallsign={(n) => handleUpdateUser({ name: n })}
          onLogout={handleLogout}
        />}
      </main>
    </div>
  );
};

export default App;
