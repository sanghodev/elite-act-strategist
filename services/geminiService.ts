
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
      generationConfig?: {
        temperature?: number;
        topP?: number;
        topK?: number;
      };
    };
  }
): Promise<{ text: string; model: string }> {
  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[Gemini Fallback] Trying model: ${model}`);

      const response = await ai.models.generateContent({
        model,
        ...requestConfig,
        config: {
          ...requestConfig.config,
          generationConfig: {
            temperature: 0.0,  // ACT는 논리 문제 - 창의성 제거
            topP: 0.95,
            topK: 64,
          }
        } as any  // Type assertion: generationConfig is supported but not in type definition
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
  history: any[],
  questionNumber?: string // 문제 번호 (선택적)
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
    
    ═══════════════════════════════════════════════════════════════
    STEP 1: DESCRIBE WHAT YOU SEE
    ═══════════════════════════════════════════════════════════════
    Before analyzing, first mentally describe the image:
    - Is this a passage with questions, or just a question?
    - Can you see answer choices clearly?
    - Is there an answer key or explanation visible?
    - Are there any student markings (circles, checks, highlights)?
    - What question number is this?
    ${questionNumber ? `\n    **CRITICAL**: User wants to analyze question number ${questionNumber} ONLY.\n    - If you see multiple questions, focus ONLY on question ${questionNumber}\n    - Ignore all other question numbers\n    - Extract information ONLY for question ${questionNumber}` : ''}
    
    ═══════════════════════════════════════════════════════════════
    STEP 2: EXTRACT THE CORRECT ANSWER (MOST IMPORTANT!)
    ═══════════════════════════════════════════════════════════════
    
    **CRITICAL**: The student may have filled in the WRONG answer in the form fields.
    Your PRIMARY job is to find the ACTUAL correct answer from the image itself.
    
    **Look for these visual indicators** (in order of reliability):
    
    1. **Answer Key Section**: 
       - Text like "Answer: C" or "Correct Answer: C"
       - A separate answer key table or list
       - Bold or highlighted correct answer
    
    2. **Explanation Section**:
       - Text that says "Choice C is correct because..."
       - Explanations that reference the correct answer
       - Rationale that identifies the right choice
    
    3. **Visual Markers**:
       - Checkmarks (✓) next to the correct answer
       - Green highlighting on correct choice
       - "CORRECT" label next to an option
    
    **IGNORE these** (they are likely WRONG):
    - Student's circles or marks on answer choices
    - Crossed out options
    - Student's handwritten notes
    
    ${section === Section.English ? `
    ═══════════════════════════════════════════════════════════════
    STEP 3: ENGLISH-SPECIFIC EXTRACTION
    ═══════════════════════════════════════════════════════════════
    
    For ACT English questions:
    
    A. **LOCATE QUESTION NUMBER**:
       - Look for numbers in brackets like [23] or (23) in the passage
       - Or question numbers at the bottom like "23. A B C D"
       ${questionNumber ? `\n       - **CRITICAL**: User specified question number ${questionNumber}. ONLY analyze this question, ignore all others!` : ''}
    
    B. **IDENTIFY UNDERLINED PORTION**:
       - Find the text that corresponds to that question number
       - It may be underlined, in brackets, or numbered
       - Extract the EXACT text being questioned
       - Example: If you see "The cat [was sleeping] peacefully", extract "was sleeping"
       ${questionNumber ? `\n       - Focus ONLY on question ${questionNumber}'s underlined portion` : ''}
    
    C. **EXTRACT ALL ANSWER CHOICES**:
       - Usually A, B, C, D (odd questions) or F, G, H, J (even questions)
       - First choice is often "NO CHANGE"
       - Get complete text: "A. NO CHANGE", "B. is sleeping", etc.
    
    D. **VERIFY CORRECT ANSWER AND EXTRACT ITS CONTENT**:
       - Cross-reference with answer key
       - If answer key says "23. C", then choice C is correct
       - **CRITICAL**: Extract the FULL TEXT of choice C (NOT choice A, NOT choice B)
       - **VALIDATION**: Double-check that you're extracting the content of the IDENTIFIED correct answer
       
       **Example Process**:
       1. Answer key shows: "17. B" → Correct answer LETTER is B
       2. Look at the answer choices:
          - A. NO CHANGE
          - B. heritage, which she believes her art embodies
          - C. heritage which she believes her art embodies
          - D. heritage; which she believes her art embodies
       3. Extract content of choice B (because answer key said B):
          - correctAnswerContent = "heritage, which she believes her art embodies"
       4. **DO NOT extract content of A just because it's first!**
       5. **DO NOT extract "NO CHANGE" unless the answer key specifically says A is correct!**
    ` : `
    ═══════════════════════════════════════════════════════════════
    STEP 3: GENERAL SECTION EXTRACTION
    ═══════════════════════════════════════════════════════════════
    
    A. **EXTRACT QUESTION TEXT**:
       - Get the complete question being asked
       - Include any passage or context provided
    
    B. **EXTRACT ALL ANSWER CHOICES**:
       - Usually A, B, C, D
       - Get complete text of each option
    
    C. **VERIFY CORRECT ANSWER**:
       - Find answer key or explanation
       - Extract the FULL TEXT of the correct choice
    `}
    
    ═══════════════════════════════════════════════════════════════
    STEP 4: IDENTIFY STUDENT'S MISTAKE
    ═══════════════════════════════════════════════════════════════
    
    - Look for the student's markings (circles, highlights)
    - This is what they CHOSE (likely wrong)
    - Compare to the ACTUAL correct answer from the answer key
    - This difference is what you'll analyze
    
    ═══════════════════════════════════════════════════════════════
    CRITICAL REMINDERS
    ═══════════════════════════════════════════════════════════════
    
    ⚠️ The "Correct Response" field below may be WRONG (student's mistake)
    ✅ Your PRIMARY job: Find ACTUAL correct answer from IMAGE
    📸 Prioritize information from IMAGE over text fields
    🎯 For 'underlinedSnippet': Extract EXACT tested text
    🔍 For 'correctAnswerContent': Extract FULL TEXT of correct choice
    
    ⚠️ **CRITICAL FOR correctAnswerContent**:
    - If correct answer is "B", extract content of choice B
    - If correct answer is "C", extract content of choice C
    - DO NOT always extract "A. NO CHANGE" by default!
    - DO NOT extract the first choice unless it's the correct answer!
    - VALIDATION: The answer letter and answer content MUST match!
    
    **Common Mistake to Avoid**:
    ❌ WRONG: Correct answer = "B", but extracting "A. NO CHANGE"
    ✅ RIGHT: Correct answer = "B", extracting content of choice B
    
    ` : ''}
    
    [INTEL PACKAGE]
    - Student's Claimed Answer: "${userAnswer}" ${base64Images.length > 0 ? '(VERIFY from image - may be incorrect)' : ''}
    - Student's Claimed Correct Answer: "${correctAnswer}" ${base64Images.length > 0 ? '(VERIFY from image - may be incorrect)' : ''}
    - Problem Context: "${contextText}"
    - Error Context: "${errorContext}"
    - Historical Pattern Count: ${patternFrequency} similar errors
    ${base64Images.length > 0 ? '\n    NOTE: Prioritize information extracted from the images over the text fields above.' : ''}
    
    ═══════════════════════════════════════════════════════════════
    [🤖 AI PROBLEM SOLVING - INDEPENDENT ANALYSIS]
    ═══════════════════════════════════════════════════════════════
    
    **CRITICAL NEW REQUIREMENT**: You must SOLVE the problem yourself, not just analyze the student's mistake.
    
    **Your Task**:
    1. **Read and understand the problem** from the image
    2. **Solve it independently** using your ACT expertise
    3. **Derive the correct answer** through logical reasoning
    4. **Explain your solving process** step-by-step
    5. **Compare your answer** with what the student provided
    
    **Why This Matters**:
    - Student may not know the correct answer
    - Student may have entered wrong "correct answer"
    - You need to be the AUTHORITY on what's correct
    - Your solution validates the analysis
    
    **AI Solution Requirements** (populate aiSolution field):
    
    1. **derivedAnswer**: Your answer after solving the problem
       - Format: Just the letter (e.g., "B" or "C")
       - This is YOUR answer from solving, not from answer key
       - If answer key exists, compare and note any discrepancy
    
    2. **solvingProcess**: Step-by-step how you solved it
       - Format: "Step 1: [action]. Step 2: [action]. Step 3: [conclusion]"
       - Be specific and logical
       - Show your reasoning clearly
       - Example: "Step 1: Identified that 'which' introduces a non-restrictive clause. Step 2: Non-restrictive clauses require commas before and after. Step 3: Only choice B has both commas, making it correct."
    
    3. **reasoning**: Why your answer is correct
       - Explain the underlying ACT principle
       - Reference specific rules or patterns
       - Make it educational
       - Example: "Choice B is correct because non-restrictive clauses (extra information) must be set off with commas. The phrase 'which she believes her art embodies' is extra information about heritage, not essential to identify it, so it needs commas."
    
    4. **confidence**: Your confidence level
       - "High": 95%+ certain, clear application of rules
       - "Medium": 70-95% certain, some ambiguity
       - "Low": <70% certain, unusual or tricky case
    
    **Example AI Solution**:
    {
      "derivedAnswer": "B",
      "solvingProcess": "Step 1: Identified the clause 'which she believes her art embodies' as non-restrictive (extra info). Step 2: Checked punctuation rules - non-restrictive clauses need commas. Step 3: Evaluated all choices - only B has proper comma placement.",
      "reasoning": "The clause provides additional information about heritage but isn't essential to identify what heritage means. ACT rule: non-restrictive clauses (starting with 'which') require commas before and after. Choice A lacks the first comma, C lacks both commas, D incorrectly uses semicolon.",
      "confidence": "High"
    }
    
    **CRITICAL**:
    - Solve the problem FIRST, before analyzing student's mistake
    - Your derivedAnswer becomes the TRUE correct answer
    - If it differs from student's "correct answer" field, YOUR answer is right
    - Use your solution to inform the analysis
    
    ${section === Section.English ? `
    ═══════════════════════════════════════════════════════════════
    [📚 ACT ENGLISH EXPERT RULES - PERFECT SCORE SYSTEM]
    ═══════════════════════════════════════════════════════════════
    
    **ROLE**: You are an ACT English Test Designer and Logic Analyst.
    **MINDSET**: "Ruthless Editor" - Function over Flow, Logic over Beauty
    
    **PRIME DIRECTIVE**:
    - Ignore "flow" and "poetic beauty"
    - Focus on mechanical function in specific location
    - Reject subjectivity - use logical cohesion and structural necessity
    
    **30-RULE KNOWLEDGE BASE** (Apply these when solving):
    
    **I. CORE MINDSET**
    1. ACT is an editing test - choose efficiency, not style
    2. Meaning > Grammar - logic and structure decide when grammar is equal
    3. "Most Relevant" = "Does this sentence do the job this spot requires?"
    
    **II. PARAGRAPH STRUCTURE**
    4. Paragraph Unity - every sentence supports one central purpose
    5. Sentence Placement - function must match position (Introduce/Explain/Transition/Conclude)
    6. Transition Rule - transitions smooth the path, don't change destination
    
    **III. REFERENCE & PRONOUNS (CRITICAL)**
    7. Rule of Reference - pronouns refer to closest logical noun or immediately preceding idea
    8. "This + Noun" is clearer than bare "This"
    9. Topic Lock - don't change topics before sentences with strong reference words
    
    **IV. ADD/DELETE/REVISE TRAPS**
    10. Delete If - sentence repeats info, adds unnecessary background, or does no work
    11. Add Only If - serves clear purpose (clarify/support/fit)
    12. "All Are True" Trap - truth is irrelevant, function decides
    
    **V. LOGICAL FLOW & COHESION**
    13. Causality - effects cannot appear before causes
    14. General to Specific - examples come after ideas they support
    15. New Information Placement - don't introduce major new ideas mid-paragraph
    16. "As well as" Rule - don't prematurely summarize info coming in next sentence
    
    **VI. STYLE & TONE**
    17. Tone Consistency - match the passage (informative/narrative)
    18. Concrete > Abstract - prefer specific, observable details
    19. No Redundancy - if two choices mean same thing, pick shorter
    
    **VII. CONCISION & WORD CHOICE**
    20. Cut Words - "in order to" → "to", "due to the fact that" → "because"
    21. Precision - longer ≠ clearer
    
    **VIII. COMMON QUESTION TYPES**
    22. Intro - broad but accurate, match passage purpose
    23. Conclusion - echo main idea, no new facts
    24. Title - reflects overall purpose, not a detail
    
    **IX. STRATEGIC RULES**
    25. Context is King - read whole sentence and surrounding sentences
    26. Logic > Ears - what "sounds right" is unreliable
    27. Neutral > Dramatic - ACT rarely chooses extreme language
    28. One Right Answer - if two seem right, both are wrong
    
    **X. FINAL PRINCIPLES**
    29. Predictability - patterns repeat, recognize structure
    30. Control - correct answer is what editor approves without emotion
    
    **XI. CRITICAL OVERRIDES (ANTI-HALLUCINATION PROTOCOLS)**
    31. **The "Next Sentence" Vet**: You are FORBIDDEN from choosing an answer based solely on the previous sentence. You MUST verify that the chosen answer does not conflict with, repeat, or disconnect from the *following* sentence (S_next).
    32. **The "Boring" Preference**: If Choice A is "smart/philosophical" and Choice B is "boring/functional/administrative," and both are grammatically correct, Choice B is 90% likely to be the answer in 'Relevance' questions.
    33. **Visual/OCR Error Handling**: If the user provides an image, assume OCR might be imperfect. If a choice seems to have a typo (e.g., "thier" instead of "their"), treat it as a potential OCR error unless spelling is explicitly tested. Context is supreme.
    
    **EXECUTION ALGORITHM** (MANDATORY CHAIN OF THOUGHT - Use this for solvingProcess):
    
    **Before outputting the final answer, you must perform this internal analysis process:**
    
    1. **CLASSIFY THE QUESTION TYPE:**
       - Is it **Grammar/Usage**? (Commas, subject-verb, pronouns) → Apply Rules 20, 26.
       - Is it **Rhetorical Skill**? (Add/Delete, Intro/Conclusion, Placement) → Apply Rules 1, 4, 5, 11.
       - Is it **Cohesion/Logic**? (Transitions, "Most Relevant") → Apply Rules 6, 13, 14.
    
    2. **LOCATE THE "ANCHORS":**
       - Identify **S_prev** (Sentence Before) and **S_next** (Sentence After).
       - *CRITICAL:* If S_next contains a pronoun (this, that, these, those, such), the Answer MUST contain the specific antecedent (Rule 7, 9).
    
    3. **THE "DELETE" CHECK:**
       - If "OMIT/DELETE" is an option, ask: "Is this info absolutely necessary for the paragraph's core argument?" If no, DELETE is the default winner (Rule 10, 19).
    
    4. **THE "SPOILER" CHECK:**
       - Does the chosen answer explain something that S_next is about to introduce? If yes, it is REDUNDANT. Reject it (Rule 16).
    
    5. **FINAL VERIFICATION:**
       - Does the answer violate the "Tone Consistency" (Rule 17)?
       - Is it the shortest grammatically correct option (Rule 19)?
       - Apply Rule 31: Does it connect properly to S_next?
       - Apply Rule 32: Is the "boring/functional" option being overlooked?
    
    **STRUCTURED OUTPUT FORMAT:**
    In your solvingProcess, use this format:
    - **Question Type:** [Grammar / Rhetorical / Logic]
    - **Context Analysis:** S_prev: [summary], S_next: [summary or key reference words]
    - **Option Analysis:** Evaluate each choice against the rules
    - **Final Decision:** Correct answer with primary rule cited
    
    **OUTPUT REQUIREMENTS FOR ENGLISH**:
    - In solvingProcess: Cite which Rule # you applied (e.g., "Applied Rule #7: Reference")
    - In reasoning: Explain the structural/logical reason, not subjective preference
    - In derivedAnswer: The letter that passes the algorithm
    
    **EXAMPLE ENGLISH SOLUTION (Using New Format):**
    solvingProcess: "Step 1: CLASSIFY - This is a Cohesion/Logic question (sentence placement). Step 2: LOCATE ANCHORS - S_prev introduces museum's mission, S_next starts with 'It is this community involvement...' requiring antecedent. Step 3: DELETE CHECK - N/A. Step 4: SPOILER CHECK - Choice A mentions 'stories' which S4 will introduce later (spoiler violation). Step 5: VERIFY - Choice B provides concrete 'community' antecedent for S_next, is functional not philosophical (Rule 32). Applied Rule #7 (Reference) and Rule #31 (Next Sentence Vet). Answer: B"
    reasoning: "Rule #7 (Reference), Rule #31 (Next Sentence Vet), and Rule #32 (Boring Preference). The next sentence starts with 'It is this community involvement', requiring a concrete antecedent for 'community involvement'. Choice B provides the functional detail (downtown location, accessible to residents) which establishes community connection. Choice A is too abstract/philosophical and creates a spoiler by mentioning 'stories' that appear later in the passage."
    
    **FEW-SHOT EXAMPLE** (Learn from this):
    
    [Problem Context]: Sentence placement question. S_next starts with "It is this community involvement..."
    
    [Choices]:
    A. The museum shares stories that connect visitors to the cultural past.
    B. The museum is located in the heart of downtown, accessible to all residents.
    C. NO CHANGE
    D. DELETE the underlined portion.
    
    [Correct Analysis]:
    - Correct Answer: B
    - Core Rule Applied: Rule #7 (Reference) & Rule #15 (New Information Placement)
    - Logic Explanation: S_next begins with "It is this community involvement...", requiring S_prev to establish "community involvement" as the antecedent. Choice B describes accessibility and location within the community, creating a functional bridge. Choice A introduces abstract themes ("stories", "cultural past") which disconnects the logical reference in S_next and prematurely touches on "messages" introduced later in S4.
    
    **KEY TAKEAWAY**: Always check S_next for reference words (This, It, These, Such). The correct answer MUST provide the antecedent.
    ` : ''}
    
    ═══════════════════════════════════════════════════════════════
    
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
          
          **CRITICAL VALIDATION PROCESS**:
          Step 1: Identify the correct answer LETTER (e.g., "B" from answer key)
          Step 2: Find that specific choice in the answer options
          Step 3: Extract the COMPLETE TEXT of that choice (NOT choice A, NOT "NO CHANGE" by default)
          Step 4: CROSS-CHECK: Does the letter match the content you extracted?
          
          **Example**:
          - Answer key shows: "17. B" ← Correct answer is B
          - Answer choices:
            A. NO CHANGE
            B. heritage, which she believes her art embodies ← Extract THIS (because answer is B)
            C. heritage which she believes her art embodies
            D. heritage; which she believes her art embodies
          - correctAnswerContent = "heritage, which she believes her art embodies"
          
          **DO NOT**:
          ❌ Extract "A. NO CHANGE" when answer is B, C, or D
          ❌ Always extract the first choice by default
          ❌ Confuse the answer LETTER with answer CONTENT
          
          This helps students understand WHY this specific answer is correct.
    
    
    [🎓 EXPERT TEACHER MODE - ACT MASTERY RULES]
    You are the BEST ACT teacher in each subject. Teach like explaining to a smart student who needs SPECIFIC, ACTIONABLE rules.
    
    **Teaching Standards:**
    ❌ BAD: "Pay attention to verb tense"
    ✅ GOOD: "When you see 'since 2010' or 'for 5 years', use present perfect (has/have + past participle). When you see 'yesterday' or 'last week', use simple past."
    
    ❌ BAD: "Check pronoun agreement"
    ✅ GOOD: "When This/That starts a sentence, look at the PREVIOUS sentence. This/That = singular idea. These/Those = plural. If previous sentence has multiple ideas, This/That refers to the ENTIRE sentence."
    
    **Your Execution Rule MUST follow this format:**
    "When [specific trigger], immediately [specific action], because [specific reason]"
    
    ═══════════════════════════════════════════════════════════════
    ACT PATTERN RULES DATABASE - Use These in Your Execution Rule
    ═══════════════════════════════════════════════════════════════
    
    **ENGLISH - PUNCTUATION:**
    
    1. **Transition Words (However, Therefore, Moreover, etc.)**
       - When: You see transition words like "however", "therefore", "moreover", "furthermore"
       - Do: Check punctuation BEFORE the transition word
       - Rule: Must have STRONG punctuation (period or semicolon) before transition words
       - Wrong: "The cat slept, however, the dog ran" ❌
       - Right: "The cat slept. However, the dog ran." ✅
       - Right: "The cat slept; however, the dog ran." ✅
    
    2. **Comma Rules - Subject-Verb-Object**
       - When: You're deciding where to put commas
       - Do: NEVER put comma between subject-verb or verb-object
       - Rule: The core sentence (subject-verb-object) has NO commas
       - Wrong: "The cat, slept" ❌ (comma between subject-verb)
       - Wrong: "She ate, the food" ❌ (comma between verb-object)
       - Right: "The cat slept" ✅
    
    3. **Which vs That**
       - When: Choosing between "which" and "that"
       - Do: Ask "Is this info ESSENTIAL to identify what I'm talking about?"
       - Rule: "That" = essential (no commas). "Which" = extra info (use commas)
       - Example: "The book that I borrowed is good" (which book? the one I borrowed - essential)
       - Example: "The book, which is red, is good" (extra detail about the book - not essential)
    
    **ENGLISH - GRAMMAR:**
    
    4. **Pronoun Reference (This/That/These/Those)**
       - When: Sentence starts with "This/That/These/Those"
       - Do: Look at the PREVIOUS sentence to find what it refers to
       - Rule: This/That = singular or entire previous sentence. These/Those = plural items
       - Example: "The economy crashed. Banks failed. This caused panic." (This = the entire situation)
       - Example: "Scientists found new species. These discoveries..." (These = the species, plural)
    
    5. **Verb Tense with Time Markers**
       - When: You see time words like "since", "for", "ago", "yesterday", "currently"
       - Do: Match verb tense to the time marker
       - Rules:
         * "since 2010" / "for 5 years" → Present Perfect (has/have + past participle)
         * "yesterday" / "last week" / "ago" → Simple Past
         * "currently" / "now" / "these days" → Present Continuous (is/are + -ing)
       - Example: "She has lived here since 2010" ✅ (since = present perfect)
       - Example: "She lived here yesterday" ❌ (yesterday needs simple past, not present perfect)
    
    6. **Subject-Verb Agreement with Tricky Subjects**
       - When: Subject has "of" phrase or collective noun
       - Do: Find the REAL subject (ignore the "of" phrase)
       - Rule: "The [subject] of [something]" - verb agrees with [subject], not [something]
       - Example: "The box of cookies IS here" ✅ (subject = box, singular)
       - Example: "The boxes of cookies ARE here" ✅ (subject = boxes, plural)
       - Collective nouns (team, group, family) = usually singular in American English
    
    7. **Modifier Placement**
       - When: Sentence starts with a descriptive phrase (modifier)
       - Do: The FIRST NOUN after the comma must be what the modifier describes
       - Rule: Opening modifier describes the first noun after the comma
       - Wrong: "Running quickly, the finish line was crossed by John" ❌ (finish line wasn't running)
       - Right: "Running quickly, John crossed the finish line" ✅ (John was running)
    
    **ENGLISH - STYLE & CONCISENESS:**
    
    8. **Redundancy**
       - When: Two words mean the same thing
       - Do: Delete one of them
       - Examples:
         * "past history" → "history" (history is always past)
         * "advance planning" → "planning" (planning is always in advance)
         * "completely eliminate" → "eliminate" (eliminate means completely remove)
    
    9. **Wordiness**
       - When: Choosing between a short and long way to say something
       - Do: Choose the shortest clear option
       - Rule: ACT ALWAYS prefers concise over wordy (if meaning is the same)
       - Wordy: "due to the fact that" → Concise: "because"
       - Wordy: "in the event that" → Concise: "if"
       - Wordy: "at this point in time" → Concise: "now"
    
    **MATH - WORD PROBLEMS:**
    
    10. **Translating Words to Math**
        - When: Reading a word problem
        - Do: Translate key words to symbols
        - Rules:
          * "is" / "equals" / "was" → =
          * "of" (in context of fractions/percent) → × (multiply)
          * "per" / "each" → ÷ (divide)
          * "more than" / "sum" → +
          * "less than" / "difference" → −
        - Example: "What is 30% of 80?" → 0.30 × 80
    
    11. **Percent Change**
        - When: Asked for percent increase/decrease
        - Do: Use formula (New − Old) ÷ Old × 100
        - Rule: ALWAYS divide by the ORIGINAL (old) value
        - Example: Price went from $50 to $60. Percent increase = (60−50)÷50×100 = 20%
    
    12. **Geometry - Draw It**
        - When: Geometry problem with no diagram OR confusing diagram
        - Do: Draw your own diagram with labels
        - Rule: Visual representation prevents mistakes
        - Label everything: angles, sides, given information
    
    **READING:**
    
    13. **Main Idea Questions**
        - When: Asked for main idea or purpose
        - Do: Read first paragraph + last paragraph + topic sentences of middle paragraphs
        - Rule: Main idea appears in introduction and conclusion
        - Don't: Get distracted by interesting details in the middle
    
    14. **Inference Questions**
        - When: Asked "What can be inferred?" or "The author suggests..."
        - Do: Find DIRECT support in the text
        - Rule: Inference must be STRONGLY supported, not just possible
        - Wrong answer: Might be true in real life, but not supported by passage
        - Right answer: Directly follows from information in passage
    
    15. **Vocabulary in Context**
        - When: Asked what a word means in context
        - Do: Plug in the answer choices and see which makes sense
        - Rule: The word might have multiple meanings - choose the one that fits THIS context
        - Don't: Just pick the most common definition
    
    **SCIENCE:**
    
    16. **Graph Reading**
        - When: Looking at any graph or chart
        - Do: Read axis labels FIRST, then title, then look at data
        - Rule: Know what X-axis and Y-axis represent before interpreting
        - Common mistake: Confusing which variable is on which axis
    
    17. **Experiment Design - Control Group**
        - When: Asked about experiment setup
        - Do: Identify the control group (the one with NO changes)
        - Rule: Control group = baseline for comparison, receives no treatment
        - Example: Testing new medicine → control group gets placebo (no medicine)
    
    18. **Conflicting Viewpoints**
        - When: Two scientists disagree
        - Do: Make a table: Scientist 1 believes [X], Scientist 2 believes [Y]
        - Rule: Focus on the KEY difference, not minor details
        - Questions often ask: "What would Scientist 1 say about Scientist 2's claim?"
    
    ═══════════════════════════════════════════════════════════════
    EXECUTION RULE REQUIREMENTS
    ═══════════════════════════════════════════════════════════════
    
    Your Execution Rule MUST:
    1. Start with "When" (specific trigger the student will see)
    2. Include "immediately" or "always" (creates urgency)
    3. State specific action (not vague like "be careful")
    4. End with "because" (explains the reasoning)
    5. Be applicable in 3 seconds on test day
    6. Use one of the patterns above as a model
    
    **Example Execution Rules:**
    
    ✅ GOOD: "When you see 'however' connecting two parts, immediately check if there's a period or semicolon before it, because transition words require strong punctuation to avoid comma splices."
    
    ✅ GOOD: "When choosing between 'which' and 'that', immediately ask if the info is essential to identify the noun, because 'that' is for essential info (no commas) and 'which' is for extra info (with commas)."
    
    ✅ GOOD: "When you see 'since [year]' or 'for [time period]', immediately use present perfect tense (has/have + past participle), because these time markers indicate an action that started in the past and continues to the present."
    
    ❌ BAD: "Be more careful with punctuation" (too vague)
    ❌ BAD: "Remember comma rules" (not specific)
    ❌ BAD: "Think about verb tense" (no actionable trigger)
    
    ═══════════════════════════════════════════════════════════════
    KOREAN EXPLANATION REQUIREMENTS
    ═══════════════════════════════════════════════════════════════
    
    For the Korean explanation (explanationKorean), you MUST:
    1. Translate the Execution Rule with SAME specificity
    2. Keep the "When → Do → Because" structure in Korean
    3. Use clear, educational Korean that a student can understand
    4. Include the same examples
    
    **Format in Korean:**
    "[상황]을/를 보면, 즉시 [행동]하세요, 왜냐하면 [이유]이기 때문입니다."
    
    **Example:**
    English: "When you see 'however' connecting two parts, immediately check if there's a period or semicolon before it, because transition words require strong punctuation."
    
    Korean: "'however'가 두 부분을 연결하는 것을 보면, 즉시 그 앞에 마침표나 세미콜론이 있는지 확인하세요, 왜냐하면 전환어(transition words)는 강한 구두점이 필요하기 때문입니다. 쉼표만 있으면 comma splice 오류입니다."
    
    ═══════════════════════════════════════════════════════════════
    
    **Remember**: You are teaching a smart student who needs PRECISION, not basics. 
    Your execution rule should teach something a 34-scorer doesn't automatically do, but a 36-scorer does.
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
      },
      aiSolution: {
        type: Type.OBJECT,
        properties: {
          derivedAnswer: { type: Type.STRING },
          solvingProcess: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
        },
        required: ["derivedAnswer", "solvingProcess", "reasoning", "confidence"]
      }
    },
    required: ["surface", "diagnosis", "pattern", "impact", "tactical", "aiSolution"]
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
