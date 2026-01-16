<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Elite ACT Strategist

> **Mission**: Transform ACT 34 into 35-36 through AI-powered precision analysis and adaptive training

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)](https://vitejs.dev/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-orange.svg)](https://ai.google.dev/)

## 🎯 What Makes This Different

This isn't another ACT prep tool. **Elite ACT Strategist** is designed specifically for students at the **34-point threshold** who need surgical precision to reach 35-36.

### Key Features

- **🧠 AI-Powered Deep Analysis**: Gemini AI identifies the subtle distinctions that separate 34 from 36
- **🎯 Adaptive Drill System**: Generates targeted practice problems based on your specific weaknesses
- **📊 Combat Map**: Visualizes your mastery across all ACT sections and question types
- **📚 Elite Vocabulary Trainer**: 34-36 level words with contextual nuance training
- **☁️ Cloud Sync**: Supabase integration for multi-device learning continuity
- **⚡ Real-time Feedback**: Instant analysis with actionable execution rules

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **Gemini API Key** ([Get one free](https://aistudio.google.com/app/apikey))

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local and add your VITE_GEMINI_API_KEY

# 3. Start development server
npm run dev
```

Visit `http://localhost:5173` and start your journey to 36! 🚀

📖 **Detailed Setup**: See [SETUP.md](./SETUP.md) for comprehensive installation guide and Supabase configuration.

## 🏗️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **AI Engine**: Google Gemini 3 Flash
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + Custom Design System
- **Charts**: Recharts
- **Icons**: Lucide React

## 📁 Project Structure

```
ACT/
├── components/          # React components
│   ├── Dashboard.tsx   # Learning analytics
│   ├── AnalysisResult.tsx
│   ├── DrillSession.tsx
│   └── ...
├── services/           # External integrations
│   ├── geminiService.ts    # AI analysis engine
│   └── supabaseClient.ts   # Cloud sync
├── data/              # Static data
│   └── eliteVocab.json
├── types.ts           # TypeScript definitions
└── App.tsx            # Main application

```

## 🎓 How It Works

### 1. **Analyze Your Mistakes**
Upload a problem you got wrong. The AI performs deep analysis to identify:
- The exact trap ACT designers set
- Why your answer was tempting but wrong
- The subtle concept 36-scorers automatically recognize

### 2. **Train with Precision Drills**
Get 3 adaptive drills:
- **Cloned**: Same pattern, different content
- **Pressure**: Higher complexity, time constraints
- **Edge Case**: Unusual variations to test deep understanding

### 3. **Track Your Mastery**
Monitor progress across all ACT sections:
- **Critical** (< 70%): Urgent attention needed
- **Unstable** (70-85%): Needs reinforcement
- **Secured** (85%+): Mastered

### 4. **Master Elite Vocabulary**
Train on 34-36 level words with:
- Contextual usage in complex sentences
- Subtle nuance distinctions
- Adaptive review system

## 📊 Features in Detail

### Combat Analysis
- **Surgical Precision**: Identifies micro-concepts, not just general topics
- **Pattern Recognition**: Tracks recurring weaknesses
- **Execution Rules**: Actionable 3-second strategies for test day

### Training Grounds
- **Weakness Targeting**: Auto-generates drills for your critical areas
- **Difficulty Calibration**: 8-10/10 difficulty (34-36 level)
- **Progress Tracking**: Real-time mastery metrics

### Cloud Sync (Optional)
- **Multi-device**: Continue learning anywhere
- **Auto-backup**: Never lose your progress
- **Privacy**: Your data, your control

## 🔧 Development

```bash
# Development server with hot reload
npm run dev

# Type checking
npx tsc --noEmit

# Production build
npm run build

# Preview production build
npm run preview
```

## 🌐 Deployment

This app can be deployed to:
- **Vercel** (Recommended): Zero-config deployment
- **Netlify**: Easy static hosting
- **GitHub Pages**: Free hosting option

See [SETUP.md](./SETUP.md) for deployment guides.

## 🤝 Contributing

This is a personal learning tool, but suggestions are welcome! Open an issue to discuss improvements.

## 📄 License

MIT License - Feel free to use this for your own ACT prep journey!

## 🎯 Your Next Steps

1. ✅ Complete setup (see [SETUP.md](./SETUP.md))
2. 📝 Analyze your first mistake
3. 💪 Complete your first drill session
4. 📈 Track your progress to 36!

---

**Remember**: The difference between 34 and 36 isn't talent—it's precision. Let's get there together! 🚀

*Originally developed in [AI Studio](https://ai.studio/apps/drive/150Q729ERcgz4qLlQYnmEa7xro5Ef6Lbj)*
