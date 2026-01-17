import React, { useState, useRef } from 'react';
import { Section, AnalysisData } from '../types';
import { Camera, Upload, Send, X, AlertCircle, Image as ImageIcon, Crosshair, Loader2 } from 'lucide-react';
import { analyzeProblem } from '../services/geminiService';

/**
 * Process uploaded image for optimal OCR quality
 * - Upscales to higher resolution (max 2048px)
 * - Applies contrast enhancement for text clarity
 * - Exports with high quality compression (0.95)
 */
const processImageForOCR = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Create canvas with higher resolution
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate optimal dimensions (max 2048px width, maintain aspect ratio)
        const MAX_WIDTH = 2048;
        const MAX_HEIGHT = 2048;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }

        if (height > MAX_HEIGHT) {
          width = (width * MAX_HEIGHT) / height;
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Enhance contrast for better text recognition
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Simple contrast enhancement (factor 1.2)
        const factor = 1.2;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));     // R
          data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)); // G
          data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)); // B
        }

        ctx.putImageData(imageData, 0, 0);

        // Export as high-quality JPEG (0.95 quality)
        const processedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        resolve(processedDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

interface ProblemInputProps {
  onAnalysisComplete: (data: AnalysisData, userAnswer: string, correctAnswer: string) => void;
  history: any[];
}

export const ProblemInput: React.FC<ProblemInputProps> = ({ onAnalysisComplete, history }) => {
  const [section, setSection] = useState<Section>(Section.English);
  const [contextText, setContextText] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [errorContext, setErrorContext] = useState('');
  const [questionNumber, setQuestionNumber] = useState(''); // 문제 번호
  const [images, setImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process images with quality enhancement for better OCR
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    for (const file of fileArray) {
      try {
        // Process image for optimal OCR quality
        const processedImage = await processImageForOCR(file);
        setImages(prev => [...prev, processedImage]);
      } catch (error) {
        console.error('Image processing failed, using original:', error);
        // Fallback to original image if processing fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!contextText && images.length === 0) {
      alert("Please provide problem text or an image.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await analyzeProblem(
        contextText,
        userAnswer,
        correctAnswer,
        errorContext,
        images,
        section,
        history,
        questionNumber || undefined // 문제 번호 전달
      );
      onAnalysisComplete(result, userAnswer, correctAnswer);
    } catch (error) {
      console.error(error);
      alert("Intelligence Link Failed. Check API Key or Network.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
            <Crosshair className="text-act-red" size={32} /> COMBAT ANALYSIS
          </h2>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em]">Sector Engagement & Pattern Recognition</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          {[Section.English, Section.Math].map(s => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`px-6 py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition-all ${section === s ? 'bg-act-red text-white shadow-lg shadow-act-red/20' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {s}
            </button>
          ))}
          {[Section.Reading, Section.Science].map(s => (
            <button
              key={s}
              disabled
              className="px-6 py-2 rounded-xl text-[10px] font-mono font-bold uppercase text-gray-700 opacity-30 cursor-not-allowed relative group"
              title="Not yet optimized for 36-level analysis"
            >
              {s}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-yellow-500/90 text-black text-[8px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                ⚠️ Coming Soon
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Media Capture */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-3xl p-6 aspect-square flex flex-col items-center justify-center border-dashed border-2 border-white/10 group hover:border-act-red/40 transition-all relative overflow-hidden">
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 w-full h-full">
                {images.map((img, i) => (
                  <div key={i} className="relative group/img rounded-lg overflow-hidden border border-white/10">
                    <img src={img} className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-md opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {images.length < 4 && (
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center border border-dashed border-white/10 rounded-lg hover:bg-white/5">
                    <Upload size={20} className="text-gray-600" />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4" onClick={() => fileInputRef.current?.click()}>
                <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Camera size={32} className="text-gray-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-white">Capture Intel</p>
                  <p className="text-[10px] font-mono text-gray-600 uppercase">JPG/PNG Intelligence Only</p>
                </div>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} multiple accept="image/*" capture="environment" className="hidden" />
          </div>

          <div className="glass p-5 rounded-2xl border-l-4 border-yellow-500 flex gap-4">
            <AlertCircle className="text-yellow-500 shrink-0" size={18} />
            <p className="text-[10px] font-mono text-gray-500 leading-relaxed uppercase">AI will automatically detect underlined snippets and grammatical nodes for precision targeting.</p>
          </div>
        </div>

        {/* Right: Textual Data */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-8 rounded-3xl space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Problem Context / Transcript</label>
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="Paste the sentence or describe the problem layout..."
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm focus:border-act-red outline-none min-h-[120px] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Your Input</label>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Selection A"
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-act-red outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Tactical Key (Correct)</label>
                <input
                  type="text"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="Selection C"
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-act-green outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Question Number (If Multiple in Image)</label>
              <input
                type="text"
                value={questionNumber}
                onChange={(e) => setQuestionNumber(e.target.value)}
                placeholder="e.g., 17, 23, 45..."
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-act-accent outline-none"
              />
              <p className="text-[9px] text-gray-600 italic">이미지에 여러 문제가 있으면 분석할 문제 번호를 입력하세요</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Error Context (What happened?)</label>
              <input
                type="text"
                value={errorContext}
                onChange={(e) => setErrorContext(e.target.value)}
                placeholder="Misread the transition word, rushed the last 5 mins..."
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-act-red outline-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isAnalyzing}
              className="w-full bg-act-red text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-xl shadow-act-red/20 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span className="uppercase font-mono tracking-widest text-xs">Processing Intel...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span className="uppercase font-mono tracking-widest text-xs">Submit for Strategic Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
