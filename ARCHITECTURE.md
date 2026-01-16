# Elite ACT Strategist - Architecture Documentation

## System Overview

Elite ACT Strategist is a React-based single-page application designed to help students improve from ACT 34 to 35-36 through AI-powered analysis and adaptive training.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│                     (React Components)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼────────┐         ┌─────▼──────┐
│  Services  │         │   State    │
│            │         │ Management │
│ • Gemini   │         │            │
│ • Supabase │         │ • useState │
└───┬────────┘         │ • useEffect│
    │                  └────────────┘
    │
    ├──────────┬──────────────┐
    │          │              │
┌───▼───┐  ┌──▼───┐    ┌────▼─────┐
│Gemini │  │Supa- │    │ Local    │
│  AI   │  │base  │    │ Storage  │
│ API   │  │  DB  │    │          │
└───────┘  └──────┘    └──────────┘
```

## Core Components

### 1. Application Layer (`App.tsx`)

**Responsibilities:**
- Global state management
- Route/view management
- User session handling
- Data synchronization orchestration

**Key State:**
```typescript
- user: User | null                    // Current user profile
- history: HistoryItem[]               // Learning history
- currentView: ViewType                // Active screen
- lastAnalysis: AnalysisData | null    // Recent analysis
- drills: DrillProblem[] | null        // Generated drills
```

**Data Flow:**
1. User completes onboarding → `user` state set
2. User submits problem → AI analysis → `lastAnalysis` set
3. Generate drills → `drills` state populated
4. Complete drill session → Add to `history` → Sync to cloud

### 2. View Components

#### Dashboard (`components/Dashboard.tsx`)
- **Purpose**: Learning analytics and history overview
- **Data**: `history` array
- **Features**:
  - Recent activity timeline
  - Quick stats (total drills, accuracy)
  - History item cards with delete functionality

#### ProblemInput (`components/ProblemInput.tsx`)
- **Purpose**: Problem submission and analysis trigger
- **Inputs**:
  - Text context
  - User answer vs correct answer
  - Optional images (base64)
  - Section selection
- **Output**: Calls `analyzeProblem()` → triggers analysis

#### AnalysisResult (`components/AnalysisResult.tsx`)
- **Purpose**: Display AI analysis results
- **Data**: `AnalysisData` object
- **Sections**:
  - Surface layer (question type, difficulty)
  - Deep diagnosis (error category, nuance)
  - Tactical countermeasures (execution rules)
  - Drill generation trigger

#### DrillSession (`components/DrillSession.tsx`)
- **Purpose**: Interactive practice session
- **Features**:
  - Timer (optional)
  - Multiple choice interface
  - Immediate feedback
  - Results summary
- **Output**: `DrillResult` object

#### TrainingGrounds (`components/TrainingGrounds.tsx`)
- **Purpose**: Weakness-targeted training
- **Data**: `masteryData` (derived from history)
- **Features**:
  - Mastery visualization by category
  - Proactive drill generation for weak areas
  - Progress tracking

#### VocabularyTrainer (`components/VocabularyTrainer.tsx`)
- **Purpose**: Elite vocabulary mastery
- **Data**: `eliteVocab.json` + user progress
- **Features**:
  - Daily mission system
  - Adaptive review (spaced repetition)
  - Latency and accuracy tracking

#### Settings (`components/Settings.tsx`)
- **Purpose**: User preferences and data management
- **Features**:
  - Profile editing (name, target score)
  - Preferences (timer, high contrast)
  - Supabase connection management
  - Data wipe functionality

#### Onboarding (`components/Onboarding.tsx`)
- **Purpose**: First-time user setup
- **Flow**:
  1. Welcome screen
  2. Name input
  3. Target score selection
  4. Preferences setup
- **Output**: Creates `User` object

## Service Layer

### Gemini Service (`services/geminiService.ts`)

**Purpose**: AI-powered analysis and content generation

**Functions:**

1. **`analyzeProblem()`**
   - **Input**: Problem context, answers, images, section, history
   - **Process**:
     - Constructs elite-level analysis prompt
     - Includes pattern frequency from history
     - Sends to Gemini API with structured schema
   - **Output**: `AnalysisData` object
   - **Schema**: Enforced JSON structure for consistency

2. **`generateDrills()`**
   - **Input**: `AnalysisData` or proactive category
   - **Process**:
     - Creates 3 drills (Cloned, Pressure, Edge Case)
     - Calibrated to 34-36 difficulty level
     - Targets specific fault from analysis
   - **Output**: `DrillProblem[]` array

3. **`generateVocabDrill()`**
   - **Input**: Target word
   - **Process**:
     - Creates contextual sentence
     - Generates near-synonym distractors
     - Tests nuance understanding
   - **Output**: `DrillProblem` object

**AI Prompt Strategy:**
- **34-36 Focus**: Assumes student knows basics
- **Precision**: Surgical identification of micro-concepts
- **Actionability**: 3-second test-day strategies
- **Pattern Awareness**: Uses historical data for urgency

### Supabase Service (`services/supabaseClient.ts`)

**Purpose**: Cloud data synchronization

**Database Schema:**

```sql
users (
  id TEXT PRIMARY KEY,
  name TEXT,
  target_score INTEGER,
  preferences JSONB,
  vocab_data JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

history (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  timestamp BIGINT,
  data JSONB,
  created_at TIMESTAMP
)
```

**Functions:**

1. **`syncUser(user)`**: Upsert user profile
2. **`syncHistoryItem(userId, item)`**: Upsert history entry
3. **`pullHistory(userId)`**: Fetch all history for user
4. **`getUserByCallsign(name)`**: Find user by name
5. **`wipeCloudHistory(userId)`**: Delete all history
6. **`testSupabaseConnection()`**: Validate credentials

**Configuration Priority:**
1. Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
2. LocalStorage (user-configured in Settings)
3. Fallback defaults (backward compatibility)

## Data Models

### User
```typescript
{
  id: string,              // Unique identifier
  name: string,            // Display name / callsign
  targetScore: number,     // Goal (typically 36)
  preferences: {
    highContrast: boolean,
    autoSave: boolean,
    enableTimer: boolean,
    webhookUrl?: string
  },
  vocabData?: {
    mastered: string[],
    stats: { ... },
    dailyMission: { ... }
  }
}
```

### AnalysisData
```typescript
{
  surface: {
    section: Section,           // English/Math/Reading/Science
    questionType: string,       // Specific skill node
    underlinedSnippet: string,  // Focused text
    difficulty: number          // 1-10 scale
  },
  diagnosis: {
    errorCategory: ErrorCategory,
    explanation: string,
    nuance36: string           // What 36-scorers know
  },
  pattern: {
    isKillerType: boolean,
    repetitionCount: number
  },
  impact: {
    scoreLoss: string          // Quantified damage
  },
  tactical: {
    fatalMistake: string,      // Specific error
    designersIntent: string,   // Why trap works
    executionRule: string      // Actionable strategy
  }
}
```

### DrillProblem
```typescript
{
  type: 'Cloned' | 'Pressure' | 'Edge Case',
  content: string,           // Question text
  options: string[],         // Answer choices
  correctAnswer: string,     // Correct option
  explanation: string        // Why correct + why others fail
}
```

### HistoryItem
```typescript
{
  id: string,
  timestamp: number,
  originalInput: string,
  analysis: AnalysisData,
  drillResult?: DrillResult
}
```

## State Management Strategy

**Approach**: React Hooks (useState, useEffect)

**Why not Redux/Context?**
- App complexity doesn't justify overhead
- State is mostly local to App.tsx
- Props drilling is minimal (1-2 levels)
- Performance is not bottlenecked by re-renders

**Persistence:**
- **LocalStorage**: Primary persistence (works offline)
- **Supabase**: Optional cloud sync (multi-device)
- **Sync Strategy**: Optimistic updates (local first, cloud async)

## Performance Considerations

### Code Splitting
- Currently: Single bundle
- Future: Lazy load heavy components (VocabularyTrainer, Documentation)

### API Optimization
- **Caching**: Analysis results cached in history
- **Debouncing**: Not needed (user-triggered actions only)
- **Batch Requests**: Not applicable (sequential workflow)

### Rendering Optimization
- **Memoization**: Opportunity for `useMemo` on masteryData calculation
- **Virtualization**: Not needed (history list typically < 100 items)

## Security

### API Keys
- **Gemini**: Client-side (acceptable for personal use)
- **Supabase**: Anon key (RLS should be enabled)

### Data Privacy
- **Local-first**: Works without cloud sync
- **User control**: Can wipe cloud data anytime
- **No PII**: Only learning data stored

## Deployment

### Build Process
```bash
npm run build
# Outputs to /dist
```

### Environment Variables
- **Development**: `.env.local`
- **Production**: Platform-specific (Vercel, Netlify)

### Hosting Options
1. **Vercel** (Recommended)
   - Auto-deploy from Git
   - Environment variables in dashboard
   - Edge network CDN

2. **Netlify**
   - Similar to Vercel
   - Drag-and-drop option

3. **GitHub Pages**
   - Free static hosting
   - Requires base path configuration

## Future Enhancements

### Planned Features
1. **Advanced Analytics**
   - Time-series progress tracking
   - Predictive score modeling
   - Weakness heatmaps

2. **Collaborative Features**
   - Share drill sets
   - Study group leaderboards

3. **Mobile App**
   - React Native port
   - Offline-first architecture

### Technical Debt
1. **Testing**: Add unit tests (Vitest) and E2E tests (Playwright)
2. **Error Boundaries**: Wrap components for graceful failures
3. **Accessibility**: ARIA labels, keyboard navigation
4. **i18n**: Multi-language support

## Development Workflow

### Local Development
```bash
npm run dev          # Start dev server
npx tsc --noEmit     # Type check
```

### Adding a New Feature
1. Update types in `types.ts`
2. Create/modify component in `components/`
3. Update service layer if needed
4. Integrate in `App.tsx`
5. Test locally
6. Update documentation

### Debugging
- **React DevTools**: Component inspection
- **Network Tab**: API call monitoring
- **Console**: Service layer logs

## Conclusion

Elite ACT Strategist follows a straightforward React architecture optimized for rapid development and user-focused features. The AI-powered analysis engine and adaptive drill system are the core differentiators, built on a solid foundation of TypeScript, Vite, and modern React patterns.

**Key Principles:**
- **User-first**: Every feature serves the 34→36 goal
- **AI-powered**: Gemini provides surgical precision
- **Adaptive**: System learns from user patterns
- **Accessible**: Works offline, syncs when online
