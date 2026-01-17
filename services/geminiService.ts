
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisData, DrillProblem, Section, ErrorCategory, TACTICAL_MAP } from "../types";

// Gemini Model Fallback Configuration
// Priority order: Latest experimental → Stable → Lightweight
const GEMINI_MODELS = [
  "gemini-2.0-flash-exp",      // Latest, experimental, may have tighter quotas
  "gemini-1.5-flash",          // Stable, 1500 RPD free tier
  "gemini-1.5-flash-8b"        // Lightweight, fallback option
] as const;

/**
 * Fallback system for Gemini API calls
 * Tries models in order until one succeeds or all fail
 * Handles quota exhaustion, rate limits, and model availability errors
 */
async function callGeminiWithFallback<T>(
  ai: GoogleGenAI,
  requestConfig: {
    contents: any;
    config: {
      systemInstruction?: string;
      responseMimeType?: string;
      responseSchema?: any;
    };
  }
): Promise<{ text: string; model: string }> {
  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[Gemini Fallback] Trying model: ${model}`);

      const response = await ai.models.generateContent({
        model,
        ...requestConfig
      });

      if (!response.text) {
        throw new Error(`Empty response from ${model}`);
      }

      console.log(`[Gemini Fallback] ✅ Success with model: ${model}`);
      return { text: response.text, model };

    } catch (error: any) {
      console.warn(`[Gemini Fallback] ❌ Failed with ${model}:`, error.message);
      lastError = error;

      // Check if error is quota/rate limit related
      const errorMessage = error.message?.toLowerCase() || '';
      const isQuotaError =
        errorMessage.includes('quota') ||
        errorMessage.includes('resource_exhausted') ||
        errorMessage.includes('429') ||
        errorMessage.includes('rate limit');

      // If it's a quota error, try next model
      if (isQuotaError) {
        console.log(`[Gemini Fallback] Quota/rate limit hit, trying next model...`);
        continue;
      }

      // If it's not a quota error (e.g., invalid request), don't retry
      console.error(`[Gemini Fallback] Non-quota error, stopping fallback`);
      throw error;
    }
  }

  // All models failed
  console.error(`[Gemini Fallback] All models exhausted`);
  throw new Error(
    `All Gemini models failed. Last error: ${lastError?.message || 'Unknown error'}. ` +
    `Please check your API key quota at https://aistudio.google.com/apikey`
  );
}

const SYSTEM_INSTRUCTION = `You are the ELITE ACT Master Strategist - specialized in transforming 34-scorers into 36-scorers.


CORE IDENTITY:
You are NOT a general tutor. You are a precision instrument designed for students who:
- Already score 34 (99th percentile)
- Know all the "basics" and standard rules
- Need to identify and eliminate the SUBTLE errors that prevent perfection
- Require surgical precision, not broad explanations

YOUR EXPERTISE:
1. **MICRO-CONCEPT IDENTIFICATION**: You identify the 1-2% differences that separate 34 from 36
   - Not "subject-verb agreement" but "subject-verb agreement with inverted sentence structures and collective nouns"
   - Not "comma rules" but "the subtle difference between restrictive and non-restrictive clauses in complex sentences"

2. **ACT TRAP ANALYSIS**: You reverse-engineer how ACT designers create 34-level traps
   - Why does the wrong answer FEEL right to a 34-scorer?
   - What automatic assumption does a 36-scorer avoid?
   - What's the 3-second mental check that prevents this error?

3. **ELITE VOCABULARY MASTERY**: For English/Reading sections
   - Only use Tier 3 academic vocabulary (college-level, discipline-specific)
   - Focus on CONTEXTUAL DICTION - words that are correct only in specific tones/structures
   - Create sentences where multiple options seem correct, but only one is perfectly idiomatic

4. **PRECISION OVER BREADTH**: 
   - A 34-scorer doesn't need to know WHAT a comma splice is
   - They need to know WHY they missed THIS specific comma splice in THIS specific context
   - Your explanations should be surgical, not encyclopedic

5. **ACTIONABLE STRATEGIES**:
   - Every analysis must end with a 3-second test-day strategy
   - Format: "When [trigger], immediately [action] because [reason]"
   - Must be specific enough to apply in 30 seconds under pressure

6. **PATTERN RECOGNITION**:
   - Track recurring weaknesses (provided in history data)
   - Escalate urgency for repeated errors
   - Predict test-day impact with quantified score loss

CRITICAL STANDARDS:
- Assume the student is SMART and PREPARED
- Never explain basics they already know
- Focus on the EDGE CASES and EXCEPTIONS
- Be brutally honest about weaknesses
- Provide hope through precision, not platitudes

YOUR GOAL: Transform "I usually get this right" into "I ALWAYS get this right."
`;

export const analyzeProblem = async (
  contextText: string,
  userAnswer: string,
  correctAnswer: string,
  errorContext: string,
  base64Images: string[],
  section: Section,
  history: any[]
): Promise<AnalysisData> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in .env.local');
  }
  const ai = new GoogleGenAI({ apiKey });
  const validNodes = TACTICAL_MAP[section].flatMap(u => u.nodes);

  // Calculate pattern frequency from history
  const patternFrequency = history.filter(h =>
    h.analysis?.surface?.questionType === validNodes[0]
  ).length;

  const promptText = `
    ELITE COMBAT ANALYSIS - ACT ${section} Error (Target: 34→36)
    
    [MISSION BRIEFING]
    This student is at the 34-point threshold. They need PRECISION, not basics.
    Your analysis must identify the SUBTLE differences that separate 34 from 36.
    
    ${base64Images.length > 0 ? `
    [IMAGE ANALYSIS - CRITICAL PRIORITY]
    The student has uploaded ${base64Images.length} image(s) of the problem.
    
    ${section === Section.English ? `
    **ENGLISH SECTION SPECIAL INSTRUCTIONS:**
    ACT English questions often have UNDERLINED portions in the passage, but the image may not show clear underlines.
    
    YOUR TASKS:
    1. **LOCATE THE QUESTION NUMBER** in the image
       - Find which numbered question this is (e.g., "23.", "24.", etc.)
       - The question number usually appears in brackets or parentheses in the passage
    
    2. **IDENTIFY THE UNDERLINED PORTION**
       - Look for the text segment that corresponds to that question number
       - In ACT English, the underlined portion is what needs to be evaluated
       - It might be a phrase, a word, or punctuation
       - Extract the EXACT text that is being questioned
    
    3. **EXTRACT ALL ANSWER CHOICES**
       - Usually labeled A, B, C, D or F, G, H, J
       - One choice is often "NO CHANGE"
       - Get the complete text of each choice
    
    4. **FIND THE ACTUAL CORRECT ANSWER**
       - Look for answer keys, explanations, or correct answer indicators
       - Check for text like "Correct Answer: C" or similar
       - If there's an explanation, it will indicate which choice is correct
       - The student may have circled the WRONG answer - ignore their marking
    
    5. **DETERMINE WHAT THE STUDENT SELECTED**
       - Look for circles, checkmarks, or highlights
       - This is likely wrong (that's why they're analyzing it)
    ` : `
    **GENERAL SECTION INSTRUCTIONS:**
    1. **EXTRACT THE ACTUAL CORRECT ANSWER** from the image
       - Look for answer keys, explanations, or marked correct answers
       - The student may have circled the WRONG answer - ignore their marking
       - Find the TRUE correct answer from the test material
       - If you see "Correct Answer: C" or similar, use that
       - If you see explanations that indicate the right answer, extract it
    
    2. **IDENTIFY THE PROBLEM CONTENT**
       - Extract the full question text
       - Identify underlined portions or specific test points
       - Note all answer choices (A, B, C, D, etc.)
    
    3. **DETERMINE WHAT THE STUDENT SELECTED**
       - Look for circles, marks, or highlights the student made
       - This is likely WRONG - that's why they're analyzing it
    `}
    
    CRITICAL: The "Correct Response" field below may be WRONG if the student filled it incorrectly.
    Your PRIMARY job is to find the ACTUAL correct answer from the image and use that for analysis.
    
    For the 'underlinedSnippet' field in your response:
    - Extract the EXACT text that is being tested (the underlined portion)
    - This should be the specific phrase/word/punctuation being questioned
    - Make it clear and specific so the student knows exactly what to focus on
    ` : ''}
    
    [INTEL PACKAGE]
    - Student's Claimed Answer: "${userAnswer}" ${base64Images.length > 0 ? '(VERIFY from image - may be incorrect)' : ''}
    - Student's Claimed Correct Answer: "${correctAnswer}" ${base64Images.length > 0 ? '(VERIFY from image - may be incorrect)' : ''}
    - Problem Context: "${contextText}"
    - Error Context: "${errorContext}"
    - Historical Pattern Count: ${patternFrequency} similar errors
    ${base64Images.length > 0 ? '\n    NOTE: Prioritize information extracted from the images over the text fields above.' : ''}
    
    [ANALYSIS REQUIREMENTS - 36-POINT STANDARD]
    
    1. SURFACE LAYER:
       - Identify the exact 'underlinedSnippet' (the precise text/concept being tested)
         ${section === Section.English ? '→ For English: This MUST be the actual underlined portion from the passage' : ''}
       - Select the most specific 'questionType' from: ${validNodes.join(", ")}
       - Rate difficulty (1-10, where 8-10 = 34-36 level traps)
    
    2. DEEP DIAGNOSIS:
       - Error Category: Is this a Concept Deficit, Misapplication, ACT Trap, or Time-Induced error?
       - Root Cause: What SPECIFIC micro-concept did the student miss? (Not general - be surgical)
       - 36-Point Nuance: What subtle distinction do 36-scorers automatically recognize here?
         (e.g., "36-scorers know that 'however' requires a semicolon when joining independent clauses,
          while 34-scorers might incorrectly use a comma based on 'feel'")
    
    3. PATTERN RECOGNITION:
       - Is this a "Killer Type" (question type that consistently costs this student points)?
       - How many times has this pattern appeared? (Use historical data)
       - Predict: Will this pattern repeat on test day?
    
    4. IMPACT ASSESSMENT:
       - Score Loss: Quantify the damage (e.g., "-1 to -2 points per test" or "Critical: -3+ points")
       - Urgency Level: How critical is fixing this for reaching 36?
    
    5. TACTICAL COUNTERMEASURES:
       - Fatal Mistake: The exact logical error the student made (be brutally specific)
       - Designer's Intent: Why did ACT make the wrong answer tempting? What trap did they set?
       - Execution Rule: A single, actionable command for next encounter
         (Format: "When [trigger], immediately [action] because [reason]")
         Example: "When seeing transition words between clauses, immediately check if both sides 
         are independent sentences because ACT traps 34-scorers with comma splices"
       - **Correct Answer Content**: Extract the FULL TEXT of the correct answer choice from the image
         (e.g., if correct answer is "A", provide the complete text of choice A)
         This helps students understand WHY this answer is correct.
    
    
    [🎓 EXPERT TEACHER MODE - ACT MASTERY RULES]
    You are the BEST ACT teacher in each subject. Teach like explaining to a smart student who needs SPECIFIC, ACTIONABLE rules.
    
    **Teaching Standards:**
    ❌ BAD: "Pay attention to verb tense"
    ✅ GOOD: "When you see 'since 2010' or 'for 5 years', use present perfect (has/have + past participle). When you see 'yesterday' or 'last week', use simple past."
    
    ❌ BAD: "Check pronoun agreement"
    ✅ GOOD: "When This/That starts a sentence, look at the PREVIOUS sentence. This/That = singular idea. These/Those = plural. If previous sentence has multiple ideas, This/That refers to the ENTIRE sentence."
    
    **ACT Pattern Rules (Use These in Your Explanation):**
    
    ENGLISH:
    - Transition words (However/Therefore/Moreover) require STRONG punctuation (period or semicolon) BEFORE them
    - Commas: NEVER between subject-verb. NEVER between verb-object
    - Modifier placement: Opening phrase modifies the FIRST NOUN after the comma
    - "Which" vs "That": "Which" = extra info (use commas). "That" = essential info (no commas)
    
    MATH:
    - Word problems: "is" → =, "of" → ×, "per" → ÷
    - Geometry: If no diagram, DRAW ONE
    - Percent change: (New - Old) ÷ Old × 100
    
    READING:
    - Main idea: First paragraph + last paragraph + topic sentences
    - Inference: Must be DIRECTLY supported by text
    
    SCIENCE:
    - Graphs: Read axis labels FIRST
    - Experiments: Control group = no change
    
    **Execution Rule Format:**
    "When [trigger], immediately [action], because [reason]"
    
    **Korean Explanation:**
    Translate with SAME specificity. Keep "When → Do → Because" structure.
    Example: "쉼표 앞에 'and'가 나오면, 양쪽이 모두 완전한 문장인지 확인하세요..."

    [CRITICAL STANDARDS]
    - Assume the student knows the basics. Focus on EDGE CASES and SUBTLE DISTINCTIONS.
    - Your explanation should teach something a 34-scorer doesn't know but a 36-scorer does.
    - Be specific enough that the student can apply this on test day in 3 seconds.
    - If this is a repeated pattern, emphasize the URGENCY and provide a drill strategy.
  `;

  const parts: any[] = [];
  if (base64Images?.length > 0) {
    base64Images.forEach((img) => {
      const cleanBase64 = img.split(',')[1] || img;
      parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } });
    });
  }
  parts.push({ text: promptText });

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      surface: {
        type: Type.OBJECT,
        properties: {
          section: { type: Type.STRING, enum: Object.values(Section) },
          questionType: { type: Type.STRING },
          underlinedSnippet: { type: Type.STRING },
          difficulty: { type: Type.INTEGER },
        },
        required: ["section", "questionType", "underlinedSnippet", "difficulty"]
      },
      diagnosis: {
        type: Type.OBJECT,
        properties: {
          errorCategory: { type: Type.STRING, enum: Object.values(ErrorCategory) },
          explanation: { type: Type.STRING },
          nuance36: { type: Type.STRING },
        },
        required: ["errorCategory", "explanation", "nuance36"]
      },
      pattern: {
        type: Type.OBJECT,
        properties: { isKillerType: { type: Type.BOOLEAN }, repetitionCount: { type: Type.INTEGER } },
        required: ["isKillerType", "repetitionCount"]
      },
      impact: { type: Type.OBJECT, properties: { scoreLoss: { type: Type.STRING } }, required: ["scoreLoss"] },
      tactical: {
        type: Type.OBJECT,
        properties: {
          fatalMistake: { type: Type.STRING },
          designersIntent: { type: Type.STRING },
          executionRule: { type: Type.STRING },
          correctAnswerContent: { type: Type.STRING }
        },
        required: ["fatalMistake", "designersIntent", "executionRule"]
      }
    },
    required: ["surface", "diagnosis", "pattern", "impact", "tactical"]
  };

  try {
    const { text, model } = await callGeminiWithFallback(ai, {
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    console.log(`[Analysis] Used model: ${model}`);
    return JSON.parse(text);
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

export const generateDrills = async (analysis: Partial<AnalysisData> & { proactiveCategory?: string }): Promise<DrillProblem[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in .env.local');
  }
  const ai = new GoogleGenAI({ apiKey });
  const isProactive = !!analysis.proactiveCategory;
  const category = isProactive ? analysis.proactiveCategory : analysis.surface?.questionType;
  const section = analysis.surface?.section || "ACT";
  const originalFault = analysis.tactical?.fatalMistake || "General Logic Failure";

  const prompt = `
    🎯 ELITE DRILL GENERATION - 35-36 POINT MASTERY (PERFECT SCORE TARGET)
    
    Student Target: 35-36 composite (English: 75/75 correct - ZERO mistakes)
    Top 1% of test-takers. Generate drills HARDER than typical ACT questions.
    
    Original Weakness: "${originalFault}"
    
    DIFFICULTY MANDATE:
    - 32-scorer: 0/3 correct (overwhelmed)
    - 34-scorer: 0-1/3 correct (struggling)
    - 35-scorer: 1-2/3 correct (challenged)
    - 36-scorer: 2-3/3 correct (careful thought required)
    
    If drills feel "fair", they are TOO EASY. Goal: Train for ZERO mistakes.
    
    DRILL SPECIFICATIONS:
    
    1. CLONED DRILL (Difficulty: 9/10)
       - Recreate EXACT trap/pattern from original error
       - Add ONE extra complexity layer
       - Test PRECISE micro-distinction student missed
    
    2. PRESSURE DRILL (Difficulty: 10/10)
       - Same concept, MAXIMUM complexity
       - Multiple potential errors in one question
       - 3-4 distractors that fool 35-scorers
       - Solve in 30-40 seconds (real ACT pace)
    
    3. EDGE CASE DRILL (Difficulty: 10+/10)
       - RAREST exception/variation to the rule
       - Test deep understanding, not memorization
       - Distractor that applies rule TOO rigidly
       - Appears 1-2 times per test
    
    ACT-AUTHENTIC FORMATTING (CRITICAL):
    - Use [brackets] for tested portion
    - Example: "The impact, [which has been studied,] remains controversial."
    - Advanced vocabulary, multi-clause sentences
    - Distractors = SUBTLE misconceptions (not obvious)
    
    For English drills:
    - passage: Full sentence with [underlined portion]
    - underlinedText: Text inside brackets only
    - options: ["NO CHANGE", option2, option3, option4]
    - correctAnswer: One of the options
    - hasNoChange: true
    - answerLabels: ["A", "B", "C", "D"]
    
    Explanations (REQUIRED):
    - explanation: Full English (focus on micro-distinctions)
    - explanationSummary: One-line core concept (max 15 words)
    - explanationKorean: Detailed Korean translation
    
    [ACT-AUTHENTIC FORMATTING - CRITICAL]
    **For English/Grammar drills, you MUST follow this exact format:**
    
    1. **passage**: The full sentence/paragraph with [underlined portion] in brackets
       - Do NOT include answer choices in the passage
       - Example: "The proliferation of misinformation, particularly via social media platforms, [has engendered] a climate of skepticism."
    
    2. **underlinedText**: Extract ONLY the text inside the brackets (without brackets)
       - This is what "NO CHANGE" would keep
       - Example: "has engendered"
    
    3. **options**: Array of 4 answer choices
       - **ALWAYS** make the first option "NO CHANGE" for English questions
       - The other 3 options are alternative phrasings/corrections
       - Example: ["NO CHANGE", "has been engendering", "is engendering", "will have engendered"]
    
    4. **correctAnswer**: Must be one of the options (including "NO CHANGE" if appropriate)
       - Example: "NO CHANGE" or "has been engendering"
    
    5. **hasNoChange**: Set to true for English questions, false for Reading/Math/Science
    
    6. **answerLabels**: Use ACT-style labels
       - For odd-numbered questions: ["A", "B", "C", "D"]
       - For even-numbered questions: ["F", "G", "H", "J"]
       - Since we don't know question number, default to ["A", "B", "C", "D"]
    
    7. **content**: Keep the same as passage for backward compatibility
    
    **Example English Drill:**
    \`\`\`json
    {
      "type": "Cloned",
      "passage": "The economic downturn, which began in 2008, [has affected] millions of workers nationwide.",
      "underlinedText": "has affected",
      "content": "The economic downturn, which began in 2008, [has affected] millions of workers nationwide.",
      "options": ["NO CHANGE", "affected", "had affected", "will affect"],
      "correctAnswer": "NO CHANGE",
      "hasNoChange": true,
      "answerLabels": ["A", "B", "C", "D"],
      "explanation": "..."
    }
    \`\`\`
    
    **For Reading/Science/Math drills:**
    - Set hasNoChange to false
    - Do NOT include "NO CHANGE" in options
    - Use regular answer choices
    - Still use answerLabels: ["A", "B", "C", "D"]
    
    [BILINGUAL EXPLANATIONS - REQUIRED]
    For EVERY drill, you must provide THREE types of explanations:
    
    1. **explanation**: Full detailed English explanation (existing format)
       - Format: "Why correct: [reason]. Why others fail: [specific traps]"
       - Be comprehensive and technical
    
    2. **explanationSummary**: ONE-LINE English core concept summary
       - Maximum 15 words
       - Focus on the KEY rule or concept being tested
       - Example: "Present perfect tense shows action starting in past, continuing to present."
       - Example: "Semicolons join independent clauses; commas cannot."
    
    3. **explanationKorean**: Detailed Korean explanation
       - Translate and EXPAND the full explanation into Korean
       - Use clear, educational Korean
       - Include examples in Korean if helpful
       - Make it accessible for Korean-speaking students
       - Example: "현재완료 시제는 과거에 시작되어 현재까지 계속되는 행동을 나타냅니다. 'has affected'는 2008년에 시작된 경기 침체가 현재까지도 영향을 미치고 있음을 보여줍니다. 'affected' (과거)는 이미 끝난 행동을 의미하므로 부적절하고, 'had affected' (과거완료)는 과거의 특정 시점 이전을 나타내므로 문맥에 맞지 않습니다."
  `;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ["Cloned", "Pressure", "Edge Case"] },
        content: { type: Type.STRING },
        passage: { type: Type.STRING },
        underlinedText: { type: Type.STRING },
        questionText: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        correctAnswer: { type: Type.STRING },
        explanation: { type: Type.STRING },
        explanationSummary: { type: Type.STRING },
        explanationKorean: { type: Type.STRING },
        hasNoChange: { type: Type.BOOLEAN },
        answerLabels: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["type", "content", "explanation", "options", "correctAnswer"]
    }
  };

  try {
    const { text, model } = await callGeminiWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });
    console.log(`[Drills] Used model: ${model}`);
    return JSON.parse(text);
  } catch (error) {
    console.error("Drill Generation Error:", error);
    throw error;
  }
};

// Elite Vocabulary Drill Generation (34-36 Level)
export const generateVocabDrill = async (word: string): Promise<DrillProblem> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in .env.local');
  }
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    ELITE VOCABULARY DRILL - 34 - 36 LEVEL

    [TARGET WORD]: "${word}"

    [MISSION]
    The student is studying "${word}" and knows they need to master it.
    Your job is NOT to test recognition - they already know the word.
    Your job is to test CONTEXTUAL MASTERY at the 36 - point level.
    
    [REQUIREMENTS]

    1. ** Create a Complex Academic Sentence **
      - College - level complexity(similar to ACT Reading passages)
        - The sentence should have subtle contextual clues that make "${word}" the ONLY correct choice
          - The context should require understanding of:
         * Precise connotation(formal vs informal, positive vs neutral)
      * Intensity level(mild vs strong)
        * Idiomatic usage(which prepositions, which contexts)
          * Tone consistency(academic, literary, scientific)

    2. ** Generate Near - Synonym Distractors **
      - Each distractor must be a near - synonym of "${word}"
        - They should fit the GENERAL meaning but fail on:
         * Wrong intensity(too strong / weak for context)
         * Wrong register(too informal / formal)
      * Wrong connotation(slightly different emotional tone)
        * Idiomatic mismatch(doesn't collocate with surrounding words)
          - A 32 - scorer should find 2 - 3 options plausible
        - A 34 - scorer should narrow it to 2 options
        - A 36 - scorer should immediately recognize "${word}" as the only perfect fit
    
    3. ** Provide Surgical Explanation **
        - Why "${word}" is correct: Explain the SPECIFIC contextual requirement it fulfills
        - Why each distractor fails: Be precise about the subtle mismatch
        - Format: "Why [word]: [specific reason]. Why not [distractor]: [specific flaw]."
        - Teach the NUANCE that 36 - scorers automatically recognize

        [EXAMPLE QUALITY STANDARD]

          Word: "Mitigate"
    
    Good sentence: "The new policy was designed to _____ the economic impact of the recession."
        - Correct: "mitigate"(reduce severity, formal, commonly used with "impact")
    - Wrong: "lessen"(too informal for policy context)
      - Wrong: "eliminate"(too strong - policies rarely eliminate, they reduce)
        - Wrong: "alleviate"(typically used with suffering / pain, not economic impact)

    Explanation: "Mitigate is the precise term for reducing the severity of negative impacts in formal policy contexts. 'Lessen' is too casual for academic writing. 'Eliminate' overstates what policies can achieve. 'Alleviate' collocates with pain/suffering, not economic metrics."

    [CRITICAL STANDARDS]
    - This should feel like a REAL ACT question at the 34 - 36 difficulty level
      - The sentence should be interesting and realistic(not contrived)
        - Distractors should be genuinely tempting, not obviously wrong
          - The explanation should teach something subtle and actionable
            `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING },
      content: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      correctAnswer: { type: Type.STRING },
      explanation: { type: Type.STRING },
    },
    required: ["type", "content", "options", "correctAnswer", "explanation"]
  };

  const { text, model } = await callGeminiWithFallback(ai, {
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });

  console.log(`[Vocab] Used model: ${model}`);
  return JSON.parse(text);
};
