
export enum Section {
  English = 'English',
  Math = 'Math',
  Reading = 'Reading',
  Science = 'Science'
}

export enum ErrorCategory {
  ConceptDeficit = 'Concept Deficit',
  Misapplication = 'Misapplication',
  TrapExposure = 'ACT Trap Exposure',
  TimeInduced = 'Time-Induced Error'
}

export const TACTICAL_MAP = {
  [Section.English]: [
    { unit: "Punctuation Mastery", nodes: ["Commas: Intro & Transitions", "Commas: Appositives & Interrupters", "Semicolons & Periods", "Colons & Dashes", "Apostrophes: Possessives"] },
    { unit: "Grammar & Usage", nodes: ["Subject-Verb Agreement", "Pronoun Case & Ambiguity", "Verb Tense & Mood", "Misplaced & Dangling Modifiers", "Parallel Structure", "Idiomatic Diction"] },
    { unit: "Rhetorical Strategy", nodes: ["Transitions: Logical Links", "Conciseness & Redundancy", "Relevance: Add/Delete Info", "Sentence/Paragraph Organization", "Style & Tone Consistency"] }
  ],
  [Section.Math]: [
    { unit: "Algebra & Functions", nodes: ["Linear Equations & Slopes", "Quadratic Functions & Parabolas", "Systems of Equations", "Inequalities & Absolute Values", "Function Transformations", "Logarithms & Exponents"] },
    { unit: "Geometry & Trig", nodes: ["Circle Equations & Properties", "Triangle Congruence & Similarity", "Trigonometric Identities (Sin/Cos)", "Volume & Surface Area", "Special Right Triangles"] },
    { unit: "Advanced Topics", nodes: ["Matrices & Determinants", "Complex Numbers", "Vectors & Polar Coordinates", "Probability & Combinatorics", "Arithmetic & Geometric Sequences"] }
  ],
  [Section.Reading]: [
    { unit: "Key Ideas", nodes: ["Main Idea & Summary", "Direct Evidence Finding", "Sequential & Causal Events"] },
    { unit: "Craft & Structure", nodes: ["Vocabulary in Context", "Author's Tone & Attitude", "Textual Structure Analysis", "Point of View & Purpose"] },
    { unit: "Integration", nodes: ["Dual Passage Comparison", "Quantitative Evidence (Charts)", "Inference & Generalization"] }
  ],
  [Section.Science]: [
    { unit: "Data & Charts", nodes: ["Trend Extrapolation", "Data Synthesis across Tables", "Variable Identification"] },
    { unit: "Investigation", nodes: ["Experimental Design", "Controlled Variables", "Hypothesis Validity"] },
    { unit: "Models & Theories", nodes: ["Conflicting Viewpoints", "Theoretical Support", "Scientific Reasoning"] }
  ]
};

export interface UserPreferences {
  highContrast: boolean;
  autoSave: boolean;
  enableTimer: boolean;
  webhookUrl?: string;
  showKoreanExplanations?: boolean; // Toggle for Korean translations
}

export interface VocabStats {
  masteredCount: number;
  streak: number;
  lastPracticeDate: string;
  avgLatency: number;
  accuracyRate: number;
}

export interface VocabData {
  mastered: string[];
  stats: VocabStats;
  dailyMission: {
    date: string;
    words: string[];
    progress: number;
  };
  latencyHistory: number[];
  accuracyHistory: number[];
}

export interface User {
  id: string;
  name: string;
  targetScore: number;
  preferences: UserPreferences;
  vocabData?: VocabData;
}

export interface MasteryMetrics {
  category: string;
  attempts: number;
  avgAccuracy: number;
  stabilityScore: number;
  status: 'Critical' | 'Unstable' | 'Stabilized' | 'Secured';
}

export interface AnalysisData {
  surface: {
    section: Section;
    questionType: string;
    underlinedSnippet?: string;
    difficulty: number;
  };
  diagnosis: {
    errorCategory: ErrorCategory;
    explanation: string;
    nuance36: string;
  };
  pattern: {
    isKillerType: boolean;
    repetitionCount: number;
  };
  impact: {
    scoreLoss: string;
    urgency: string;
  };
  tactical: {
    fatalMistake: string;
    designersIntent: string;
    executionRule: string;
    correctAnswerContent?: string;
  };
  aiSolution?: {
    derivedAnswer: string; // AI's answer from solving the problem
    solvingProcess: string; // Step-by-step how AI solved it
    reasoning: string; // Why this answer is correct
    confidence: 'High' | 'Medium' | 'Low'; // AI's confidence in its answer
  };
}

export interface DrillProblem {
  type: 'Cloned' | 'Pressure' | 'Edge Case';
  content: string; // Full passage with [underlined portion]
  passage?: string; // Optional: Passage without answer choices (for ACT English)
  underlinedText?: string; // The original underlined text (what NO CHANGE would keep)
  questionText?: string; // Optional: Explicit question text
  options: string[]; // Answer choices
  correctAnswer: string;
  explanation: string; // Full English explanation
  explanationSummary?: string; // One-line English summary
  explanationKorean?: string; // Detailed Korean explanation
  hasNoChange?: boolean; // Whether this question includes NO CHANGE as first option
  answerLabels?: string[]; // ACT-style labels: ['A', 'B', 'C', 'D'] or ['F', 'G', 'H', 'J']
}


export interface DrillResult {
  timestamp: number;
  totalQuestions: number;
  correctCount: number;
  overtimeCount: number;
  scorePercentage: number;
  questionType: string;
  timeSpentSeconds: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  originalInput: string;
  errorContext?: string;
  userAnswer?: string;
  correctAnswer?: string;
  images?: string[];
  analysis: AnalysisData;
  drillResult?: DrillResult;
}

// ============================================
// Enhanced Types for Image Storage & Collections
// ============================================

export interface ProblemImage {
  id: string;
  user_id: string;
  image_url: string;
  image_data?: string;  // Base64 backup
  thumbnail_url?: string;
  section: Section;
  question_number?: number;
  test_source?: string;
  extracted_text?: string;
  uploaded_at: string;
  tags?: string[];
  is_favorite: boolean;
  notes?: string;
}

export interface StudyCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  auto_filter?: {
    section?: Section;
    questionType?: string;
    difficulty?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  history_id: string;
  position: number;
  collection_notes?: string;
  added_at: string;
}

// Enhanced HistoryItem with image reference
export interface EnhancedHistoryItem extends HistoryItem {
  problem_image_id?: string;
  problem_image?: ProblemImage;  // Joined data
}

export interface CollectionWithItems extends StudyCollection {
  items: Array<{
    history: EnhancedHistoryItem;
    collection_notes?: string;
    position: number;
  }>;
  item_count: number;
}
