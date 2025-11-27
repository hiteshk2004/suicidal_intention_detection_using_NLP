
import React, { useState, useEffect } from 'react';
import { 
  Brain, Heart, Activity, CheckCircle, AlertTriangle, 
  Stethoscope, MessageSquare, ChevronRight, Shield, User, Phone, 
  Lock, ArrowRight, Ambulance, Send, Database, Wifi, Mic, MessageCircle,
  Cpu, Code, Layers
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

import { PageStep, AppState, INITIAL_DATA, AssessmentData, QuestionDef } from './types';
import { analyzeWellness } from './geminiService';
import { Button } from './components/Button';
import { ProgressBar } from './components/ProgressBar';

// --- Question Dictionary ---
const BASE_QUESTIONS = [
  { 
    id: 'hopeless', 
    text: "How have you been feeling lately?", 
    subtext: "Have feelings of hopelessness been weighing on you?",
    options: [
      { label: 'Not at all', value: 0 },
      { label: 'A few times', value: 1 },
      { label: 'Often', value: 2 },
      { label: 'Almost constantly', value: 3 }
    ]
  },
  { 
    id: 'anxiety', 
    text: "Let's check your stress levels.", 
    subtext: "Do you often feel nervous, anxious, or unable to relax?",
    options: [
      { label: 'Rarely', value: 0 },
      { label: 'Sometimes', value: 1 },
      { label: 'Often', value: 2 },
      { label: 'Very Often', value: 3 }
    ]
  },
  { 
    id: 'sleep', 
    text: "How is your rest?", 
    subtext: "Sleep quality often reflects our inner state.",
    options: [
      { label: 'Restful', value: 0 },
      { label: 'Average', value: 1 },
      { label: 'Restless', value: 2 },
      { label: 'Insomnia', value: 3 }
    ]
  },
  { 
    id: 'social_withdraw', 
    text: "Connection with others.", 
    subtext: "Have you found yourself pulling away from friends or family?",
    options: [
      { label: 'No, I stay connected', value: 'No' },
      { label: 'Yes, I prefer to be alone', value: 'Yes' }
    ]
  },
  { 
    id: 'self_harm', 
    text: "A sensitive question.", 
    subtext: "Have you had thoughts that life isn't worth living?",
    options: [
      { label: 'Never', value: 0 },
      { label: 'Fleeting thoughts', value: 1 },
      { label: 'Sometimes', value: 2 },
      { label: 'Often', value: 3 }
    ]
  }
];

const HIGH_RISK_QUESTIONS = [
  {
    id: 'plan',
    text: "I want to keep you safe.",
    subtext: "Have you made any specific plans to hurt yourself?",
    options: [
      { label: 'No', value: 'No' },
      { label: 'Yes', value: 'Yes' }
    ]
  },
  {
    id: 'means',
    text: "Safety Check.",
    subtext: "Do you have immediate access to anything you might use to hurt yourself?",
    options: [
      { label: 'No', value: 'No' },
      { label: 'Yes', value: 'Yes' }
    ]
  }
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: PageStep.CONSENT,
    user: { name: '', phone: '', guardianPhone: '' },
    data: INITIAL_DATA,
    userDescription: '',
    result: null,
    isLoading: false,
    error: null,
    currentQuestionIndex: 0,
  });

  const [activeQuestions, setActiveQuestions] = useState(BASE_QUESTIONS);
  const [alertSent, setAlertSent] = useState(false);

  // --- Handlers ---

  const handleConsent = () => {
    setState(prev => ({ ...prev, step: PageStep.REGISTER }));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.user.name || !state.user.phone) {
      alert("Please provide your details so we can assist you better.");
      return;
    }
    setState(prev => ({ ...prev, step: PageStep.HOME }));
  };

  const handleOptionSelect = (value: string | number) => {
    const currentQ = activeQuestions[state.currentQuestionIndex];
    const newData = { ...state.data, [currentQ.id]: value };
    
    // Dynamic Logic
    let newQuestionSet = [...activeQuestions];
    if (currentQ.id === 'self_harm') {
      const numericVal = typeof value === 'number' ? value : 0;
      if (numericVal >= 2) {
        const riskIds = HIGH_RISK_QUESTIONS.map(q => q.id);
        const hasRiskQs = newQuestionSet.some(q => riskIds.includes(q.id));
        if (!hasRiskQs) {
          newQuestionSet = [...BASE_QUESTIONS, ...HIGH_RISK_QUESTIONS];
        }
      }
    }

    setState(prev => ({ ...prev, data: newData }));
    setActiveQuestions(newQuestionSet);

    if (state.currentQuestionIndex < newQuestionSet.length - 1) {
      setTimeout(() => {
        setState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
      }, 400); // Allow animation time
    } else {
      setTimeout(() => {
        setState(prev => ({ ...prev, step: PageStep.DESCRIPTION }));
      }, 400);
    }
  };

  const submitForAnalysis = async () => {
    setState(prev => ({ ...prev, isLoading: true, step: PageStep.LOADING }));
    
    try {
      const result = await analyzeWellness(state.data, state.userDescription);
      
      const isHighRisk = result.risk_alert === "Immediate Support Suggested" || result.prediction === "Suicidal";
      
      if (isHighRisk && state.user.guardianPhone) {
        // Simulation of backend WhatsApp service
        setTimeout(() => setAlertSent(true), 3500);
      }

      setState(prev => ({
        ...prev,
        result,
        step: isHighRisk ? PageStep.CRISIS_INTERVENTION : PageStep.RESULTS,
        isLoading: false
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, isLoading: false, step: PageStep.DESCRIPTION }));
    }
  };

  const restart = () => {
    setState(prev => ({
      ...prev,
      step: PageStep.HOME,
      data: INITIAL_DATA,
      userDescription: '',
      result: null,
      currentQuestionIndex: 0
    }));
    setActiveQuestions(BASE_QUESTIONS);
    setAlertSent(false);
  };

  // --- Renders ---

  const renderConsent = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in-up">
      <div className="max-w-2xl bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="flex items-center gap-3 mb-6 text-teal-700">
          <Shield className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Confidentiality & Consent</h1>
        </div>
        <div className="space-y-4 text-slate-600 leading-relaxed mb-8">
          <p>Welcome to the Suicidal Intention Detection System. Before we begin, please understand:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>This tool uses Advanced AI Transformers to analyze patterns in your text.</li>
            <li><strong>This is NOT a replacement for professional medical advice or diagnosis.</strong></li>
            <li>In cases of detected immediate risk, we prioritize your safety above all else.</li>
            <li>Your conversation is processed securely.</li>
          </ul>
        </div>
        <Button onClick={handleConsent} className="w-full text-lg">
          I Understand & Agree
        </Button>
      </div>
    </div>
  );

  const renderRegister = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in-up">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Patient Registration</h2>
        <p className="text-slate-500 mb-6">Help us personalize your support.</p>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input 
                required
                type="text" 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="John Doe"
                value={state.user.name}
                onChange={e => setState(p => ({...p, user: {...p.user, name: e.target.value}}))}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input 
                required
                type="tel" 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="(+91) 999-999-9999"
                value={state.user.phone}
                onChange={e => setState(p => ({...p, user: {...p.user, phone: e.target.value}}))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Guardian/Parent Contact</label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-3 w-5 h-5 text-green-500" />
              <input 
                type="tel" 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="WhatsApp Alert Number"
                value={state.user.guardianPhone}
                onChange={e => setState(p => ({...p, user: {...p.user, guardianPhone: e.target.value}}))}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">We will send a WhatsApp alert to this number if high risk is detected.</p>
          </div>

          <Button type="submit" className="w-full mt-4">Continue to Assessment</Button>
        </form>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-fade-in-up">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-800 px-4 py-2 rounded-full text-sm font-bold mb-6">
          <Activity className="w-4 h-4" />
          <span>Advanced AI Detection Enabled</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
          Suicidal Intention <br/> Detection System
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          A specialized NLP tool powered by Transformer models to analyze text, detect crisis patterns, and provide immediate intervention support.
        </p>
        
        <div className="flex justify-center">
          <Button onClick={() => setState(p => ({...p, step: PageStep.ASSESSMENT}))} className="px-12 py-5 text-lg bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-200/50 transform hover:scale-105 transition-all">
            Start Prediction / Assessment
          </Button>
        </div>
      </div>

      {/* Model Tech Stack Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Cpu className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">BERT Architecture</h3>
          <p className="text-slate-500 text-sm">
            Bidirectional Encoder Representations from Transformers for deep context understanding of user sentiment.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-indigo-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Layers className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">RoBERTa & DistilBERT</h3>
          <p className="text-slate-500 text-sm">
            Robustly optimized and distilled versions ensuring high accuracy and faster inference speeds on Python backends.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Code className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Python & PyTorch</h3>
          <p className="text-slate-500 text-sm">
            Powered by a native Python backend using torch and transformers libraries for real-time classification.
          </p>
        </div>
      </div>

    </div>
  );

  const renderAssessment = () => {
    const currentQuestion = activeQuestions[state.currentQuestionIndex];
    return (
      <div className="max-w-xl mx-auto min-h-[500px] flex flex-col justify-center">
        {/* 3D Card Container */}
        <div className="perspective-1000">
           {/* We use a key to force re-render animation on change */}
          <div 
            key={currentQuestion.id}
            className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl shadow-teal-900/10 border border-slate-100 card-enter transform-style-3d relative"
          >
            {/* Depth Element visual */}
            <div className="absolute inset-0 bg-slate-100 rounded-3xl transform translate-z-[-10px] translate-y-[10px] -z-10"></div>

            <div className="flex items-center gap-3 mb-6">
              <div className="bg-teal-50 p-2 rounded-lg">
                <Brain className="w-6 h-6 text-teal-600" />
              </div>
              <span className="text-sm font-bold text-teal-600 uppercase tracking-widest">
                Step {state.currentQuestionIndex + 1} of {activeQuestions.length}
              </span>
            </div>

            <h2 className="text-3xl font-bold text-slate-800 mb-3 leading-tight">
              {currentQuestion.text}
            </h2>
            <p className="text-lg text-slate-500 mb-8 font-medium">
              {currentQuestion.subtext}
            </p>

            <div className="grid gap-4">
              {currentQuestion.options.map((opt) => {
                const isSelected = state.data[currentQuestion.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleOptionSelect(opt.value)}
                    className={`
                      relative w-full text-left p-5 rounded-xl border-2 transition-all duration-300 flex justify-between items-center group
                      hover:-translate-y-1 hover:shadow-lg
                      ${isSelected 
                        ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-md' 
                        : 'border-slate-100 bg-white text-slate-600 hover:border-teal-200'
                      }
                    `}
                  >
                    <span className="font-semibold text-lg">{opt.label}</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-teal-500 bg-teal-500' : 'border-slate-200'}`}>
                      {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDescription = () => (
    <div className="max-w-2xl mx-auto animate-fade-in-up mt-10">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-indigo-500"></div>
        
        <h2 className="text-3xl font-bold text-slate-800 mb-4">In your own words...</h2>
        <p className="text-slate-600 mb-8 text-lg">
          Share whatever is on your mind. Our AI backend will analyze this text for clinical patterns to better understand your needs.
        </p>

        <textarea
          className="w-full h-48 p-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 transition-all resize-none text-slate-700 text-lg leading-relaxed"
          placeholder="I'm feeling..."
          value={state.userDescription}
          onChange={(e) => setState(prev => ({ ...prev, userDescription: e.target.value }))}
        />

        <div className="mt-8">
          <Button onClick={submitForAnalysis} isLoading={state.isLoading} className="w-full text-lg py-4 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 shadow-lg">
            Analyze & Generate Report
          </Button>
        </div>
      </div>
    </div>
  );

  const renderCrisisIntervention = () => {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in-up pb-12">
        {/* Soft, supportive UI - No red alarms */}
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-indigo-50">
          <div className="bg-indigo-600 p-10 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <Heart className="w-16 h-16 mx-auto mb-4 text-rose-300 fill-current animate-pulse" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">We are here for you, {state.user.name}.</h2>
            <p className="text-indigo-100 text-lg max-w-2xl mx-auto">
              You are going through a difficult time, but you do not have to do this alone. Your safety is the most important thing right now.
            </p>
          </div>

          <div className="p-8 md:p-12">
            
            {/* AI Insight (Softened) */}
            <div className="mb-10 bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
              <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <Brain className="w-5 h-5" /> Clinical Assessment Note
              </h3>
              <p className="text-indigo-800 leading-relaxed">
                "{state.result?.crisis_support || "Our assessment suggests you are carrying a heavy burden right now. Professional support is highly recommended to help you navigate these feelings safely."}"
              </p>
            </div>

            {/* Action Buttons - Only Helpline */}
            <div className="flex justify-center mb-10">
              <button className="flex items-center justify-center gap-3 bg-rose-500 hover:bg-rose-600 text-white p-8 rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-rose-200 w-full md:w-2/3">
                <Phone className="w-8 h-8" />
                <div className="text-left">
                  <span className="block text-xs font-bold opacity-80 uppercase">Free 24/7 Support</span>
                  <span className="block text-2xl font-bold">Call AASRA: 9820466726</span>
                </div>
              </button>
            </div>

            {/* Guardian Alert Feedback */}
            {state.user.guardianPhone && (
              <div className={`p-5 rounded-xl flex items-center gap-4 transition-all duration-1000 transform ${alertSent ? 'bg-green-50 text-green-800 border-2 border-green-200 scale-100 opacity-100' : 'bg-amber-50 text-amber-800 border border-amber-200 scale-95 opacity-90'}`}>
                {alertSent ? <CheckCircle className="w-8 h-8 text-green-600" /> : <MessageCircle className="w-6 h-6 animate-pulse" />}
                <div>
                  <p className="font-bold text-lg">{alertSent ? "WhatsApp Alert Sent" : "Sending WhatsApp Alert..."}</p>
                  <p className="text-sm opacity-90">
                    {alertSent 
                      ? `We have notified ${state.user.guardianPhone} via WhatsApp to check on you.` 
                      : `Opening secure WhatsApp channel to ${state.user.guardianPhone}... (Ensure Python backend is running)`}
                  </p>
                </div>
              </div>
            )}
            
            <div className="text-center mt-8">
              <button onClick={restart} className="text-slate-400 hover:text-slate-600 font-medium px-4">Start New Assessment</button>
            </div>

          </div>
        </div>

        <p className="text-center text-slate-400 mt-8 text-sm max-w-xl mx-auto">
          Disclaimer: This is an AI-assisted self-evaluation tool. If you are in immediate danger, please call emergency services immediately.
        </p>
      </div>
    );
  };

  const renderNormalResults = () => {
    if (!state.result) return null;
    const { prediction, confidence, suicidal_prob, non_suicidal_prob, coping_suggestions } = state.result;
    
    // Visualization Data
    const chartData = [
      { name: 'Wellness', value: parseFloat(non_suicidal_prob), color: '#10b981' }, 
      { name: 'Risk', value: parseFloat(suicidal_prob), color: '#fbbf24' }, 
    ];

    return (
      <div className="max-w-5xl mx-auto animate-fade-in-up pb-12">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-slate-200">
           <div className="p-8 border-b border-slate-100">
              <div className="flex items-center gap-4 mb-2">
                 <div className="bg-teal-100 p-2 rounded-full"><Activity className="w-6 h-6 text-teal-600" /></div>
                 <h2 className="text-2xl font-bold text-slate-800">Mental Wellness Report</h2>
              </div>
              <p className="text-slate-500">Analysis complete based on your responses and description.</p>
           </div>

           <div className="p-8 grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="font-bold text-slate-800 mb-6">Risk Probability Analysis</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{top:20, bottom: 20}}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px'}} />
                      <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={60}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center text-sm text-slate-400 mt-4">
                  AI Confidence: {(parseFloat(confidence) * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="space-y-6">
                 <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100">
                   <h3 className="font-bold text-teal-900 mb-2">Doctor's Note</h3>
                   <p className="text-teal-800 text-sm leading-relaxed">
                     "{state.result.supportive_message}"
                   </p>
                 </div>

                 <div>
                   <h3 className="font-bold text-slate-800 mb-4">Recommended Actions</h3>
                   <ul className="space-y-3">
                     {coping_suggestions.map((s, i) => (
                       <li key={i} className="flex gap-3 text-slate-600 bg-slate-50 p-3 rounded-lg">
                         <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0" />
                         <span className="text-sm">{s}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
              </div>
           </div>
        </div>
        
        <div className="text-center space-x-4">
          <button onClick={restart} className="px-8 py-3 bg-slate-900 text-white hover:bg-black rounded-full font-medium transition-all">Start New Assessment</button>
        </div>
      </div>
    );
  };
  
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
        <Brain className="absolute inset-0 m-auto text-teal-500 w-8 h-8 animate-pulse" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Analyzing Patterns...</h2>
      <p className="text-slate-500">Consulting BERT Model & Generating Insights</p>
    </div>
  );

  return (
    <div className="min-h-screen font-sans">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
            <div className="bg-gradient-to-br from-teal-500 to-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-teal-200">
              <Stethoscope className="w-5 h-5" />
            </div>
            Suicidal Intention Detection
          </div>
          {state.step > PageStep.REGISTER && (
             <div className="flex items-center gap-3">
               <span className="text-sm font-medium text-slate-500 hidden md:block">Patient: {state.user.name || 'Guest'}</span>
               <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                 <User className="w-4 h-4" />
               </div>
             </div>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {state.step === PageStep.CONSENT && renderConsent()}
        {state.step === PageStep.REGISTER && renderRegister()}
        {state.step === PageStep.HOME && renderHome()}
        {state.step === PageStep.ASSESSMENT && renderAssessment()}
        {state.step === PageStep.DESCRIPTION && renderDescription()}
        {state.step === PageStep.LOADING && renderLoading()}
        {state.step === PageStep.RESULTS && renderNormalResults()}
        {state.step === PageStep.CRISIS_INTERVENTION && renderCrisisIntervention()}
      </main>
    </div>
  );
};

export default App;
