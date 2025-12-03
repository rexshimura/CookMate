import React, { useState, useEffect } from 'react';

/**
 * A floating button that appears when scrolling up from the bottom and scrolls the user to the bottom of the page.
 */
export default function ScrollToBottomButton() {
    const [isVisible, setIsVisible] = useState(false);
    const [prevScrollY, setPrevScrollY] = useState(0);
    const [scrollDirection, setScrollDirection] = useState('up');

    // Show button when user scrolls up from the bottom
    const toggleVisibility = () => {
        const currentScrollY = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        // Determine scroll direction
        if (currentScrollY > prevScrollY) {
            setScrollDirection('down');
        } else {
            setScrollDirection('up');
        }
        setPrevScrollY(currentScrollY);

        // Show button when:
        // 1. User is scrolled down significantly (at least 500px from top)
        // 2. User is scrolling up (not at the very bottom)
        // 3. Not at the very bottom of the page
        if (currentScrollY > 500 && scrollDirection === 'up' && currentScrollY < documentHeight - 100) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    // Set up a scroll event listener when the component mounts
    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);

        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, [prevScrollY, scrollDirection]);

    // Scroll the user smoothly to the bottom of the page
    const scrollToBottom = () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth',
        });
    };

    return (
        <div
            className={`
                fixed bottom-6 right-6 z-50 transition-all duration-500 ease-in-out transform
                ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}
            `}
        >
            <button
                onClick={scrollToBottom}
                className="
                    group relative overflow-hidden
                    bg-gradient-to-br from-blue-600 to-blue-700 
                    hover:from-blue-500 hover:to-blue-600 
                    text-white p-4 rounded-2xl shadow-xl 
                    transform hover:scale-105 hover:-translate-y-1 
                    transition-all duration-300 ease-out
                    focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50
                    backdrop-blur-sm border border-blue-400/20
                "
                aria-label="Scroll to bottom"
            >
                {/* Animated background shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                
                {/* Button content */}
                <div className="relative z-10 flex items-center space-x-2">
                    <svg 
                        className="w-5 h-5 transition-transform group-hover:translate-y-0.5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span className="text-sm font-medium hidden sm:block">Bottom</span>
                </div>

                {/* Ripple effect on click */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-100 transition-opacity duration-150">
                    <div className="absolute inset-0 bg-white/20 rounded-2xl animate-ping"></div>
                </div>
            </button>

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Scroll to bottom
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
        </div>
    );
}