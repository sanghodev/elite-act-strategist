import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface SwipeableCardProps {
    word: string;
    definition: string;
    example: string;
    onSwipeRight: () => void;  // Know it
    onSwipeLeft: () => void;   // Don't know
    onFlip?: () => void;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
    word,
    definition,
    example,
    onSwipeRight,
    onSwipeLeft,
    onFlip
}) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const startPosRef = useRef({ x: 0, y: 0 });

    const SWIPE_THRESHOLD = 100; // pixels to trigger swipe

    const handleDragStart = (clientX: number, clientY: number) => {
        setIsDragging(true);
        startPosRef.current = { x: clientX, y: clientY };
    };

    const handleDragMove = (clientX: number, clientY: number) => {
        if (!isDragging) return;

        const deltaX = clientX - startPosRef.current.x;
        const deltaY = clientY - startPosRef.current.y;
        setDragOffset({ x: deltaX, y: deltaY });
    };

    const handleDragEnd = () => {
        if (!isDragging) return;

        const { x } = dragOffset;

        if (Math.abs(x) > SWIPE_THRESHOLD) {
            if (x > 0) {
                // Swiped right - Know it
                animateSwipeOut('right');
                setTimeout(() => onSwipeRight(), 300);
            } else {
                // Swiped left - Don't know
                animateSwipeOut('left');
                setTimeout(() => onSwipeLeft(), 300);
            }
        } else {
            // Return to center
            setDragOffset({ x: 0, y: 0 });
        }

        setIsDragging(false);
    };

    const animateSwipeOut = (direction: 'left' | 'right') => {
        const distance = direction === 'right' ? 500 : -500;
        setDragOffset({ x: distance, y: 0 });
    };

    const handleFlip = () => {
        if (!isDragging) {
            setIsFlipped(!isFlipped);
            onFlip?.();
        }
    };

    // Mouse events
    const handleMouseDown = (e: React.MouseEvent) => {
        handleDragStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        handleDragMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
        handleDragEnd();
    };

    // Touch events
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        handleDragStart(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
        handleDragEnd();
    };

    const rotation = dragOffset.x * 0.1; // Subtle rotation based on drag
    const opacity = 1 - Math.abs(dragOffset.x) / 500;

    const swipeIndicatorOpacity = Math.min(Math.abs(dragOffset.x) / SWIPE_THRESHOLD, 1);
    const showRightIndicator = dragOffset.x > 20;
    const showLeftIndicator = dragOffset.x < -20;

    return (
        <div className="relative w-full max-w-md mx-auto h-[500px] perspective-1000">
            <div
                ref={cardRef}
                className={`absolute inset-0 cursor-grab active:cursor-grabbing ${isDragging ? '' : 'transition-all duration-300 ease-out'}`}
                style={{
                    transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
                    opacity: opacity
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={handleFlip}
            >
                {/* Card Container with 3D Flip */}
                <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

                    {/* Front Side - Word */}
                    <div className="absolute inset-0 backface-hidden glass rounded-[3rem] border-2 border-white/10 p-12 flex flex-col items-center justify-center">
                        <div className="text-center space-y-6">
                            <h1 className="text-7xl font-black text-white tracking-tight">{word}</h1>
                            <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">Tap to flip</p>
                        </div>

                        {/* Swipe Hints */}
                        <div className="absolute bottom-8 left-0 right-0 flex justify-between px-12">
                            <div className="flex items-center gap-2 text-act-red opacity-30">
                                <XCircle size={20} />
                                <span className="text-xs font-mono uppercase">Don't Know</span>
                            </div>
                            <div className="flex items-center gap-2 text-act-green opacity-30">
                                <span className="text-xs font-mono uppercase">Know It</span>
                                <CheckCircle2 size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Back Side - Definition */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 glass rounded-[3rem] border-2 border-act-accent/30 p-12 flex flex-col justify-center">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xs font-mono text-act-accent uppercase tracking-widest mb-3">Definition</h3>
                                <p className="text-2xl text-white/90 leading-relaxed">{definition}</p>
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">Example</h3>
                                <p className="text-lg text-gray-400 italic leading-relaxed">{example}</p>
                            </div>
                        </div>

                        {/* Flip back hint */}
                        <div className="absolute bottom-8 left-0 right-0 text-center">
                            <p className="text-xs font-mono text-gray-600 uppercase tracking-widest flex items-center justify-center gap-2">
                                <RotateCcw size={14} /> Tap to flip back
                            </p>
                        </div>
                    </div>
                </div>

                {/* Swipe Indicators */}
                {showLeftIndicator && (
                    <div
                        className="absolute inset-0 rounded-[3rem] bg-act-red/20 border-4 border-act-red flex items-center justify-center pointer-events-none"
                        style={{ opacity: swipeIndicatorOpacity }}
                    >
                        <div className="text-center">
                            <XCircle size={80} className="text-act-red mx-auto mb-4" />
                            <p className="text-2xl font-black text-act-red uppercase tracking-wider">Don't Know</p>
                        </div>
                    </div>
                )}

                {showRightIndicator && (
                    <div
                        className="absolute inset-0 rounded-[3rem] bg-act-green/20 border-4 border-act-green flex items-center justify-center pointer-events-none"
                        style={{ opacity: swipeIndicatorOpacity }}
                    >
                        <div className="text-center">
                            <CheckCircle2 size={80} className="text-act-green mx-auto mb-4" />
                            <p className="text-2xl font-black text-act-green uppercase tracking-wider">Know It!</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop Buttons (shown when not dragging) */}
            {!isDragging && (
                <div className="absolute -bottom-24 left-0 right-0 flex justify-center gap-6 md:flex hidden">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSwipeLeft();
                        }}
                        className="h-16 w-16 rounded-full bg-act-red/20 border-2 border-act-red text-act-red hover:bg-act-red hover:text-white transition-all flex items-center justify-center shadow-lg hover:scale-110"
                    >
                        <XCircle size={28} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSwipeRight();
                        }}
                        className="h-16 w-16 rounded-full bg-act-green/20 border-2 border-act-green text-act-green hover:bg-act-green hover:text-black transition-all flex items-center justify-center shadow-lg hover:scale-110"
                    >
                        <CheckCircle2 size={28} />
                    </button>
                </div>
            )}
        </div>
    );
};
