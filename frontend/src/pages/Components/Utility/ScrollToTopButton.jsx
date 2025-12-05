import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * A floating circular button that appears when the user scrolls down
 * and allows them to scroll back to the top.
 */
export default function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    // Show button when user scrolls down
    const toggleVisibility = () => {
        // Show button if user has scrolled down more than 300 pixels
        if (window.scrollY > 300) {
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
    }, []);

    // Scroll the user smoothly to the top of the page
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <div
            className={`
                fixed bottom-6 right-6 z-50 transition-all duration-500 ease-in-out transform
                ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90 pointer-events-none'}
            `}
        >
            <button
                onClick={scrollToTop}
                className="
                    group relative
                    flex items-center justify-center
                    w-10 h-10 sm:w-12 sm:h-12
                    overflow-hidden
                    bg-gradient-to-br from-orange-600 to-red-600
                    hover:from-orange-500 hover:to-red-500
                    text-white rounded-full shadow-xl shadow-orange-200/50
                    transform hover:scale-110 hover:-translate-y-1
                    transition-all duration-300 ease-out
                    focus:outline-none focus:ring-4 focus:ring-orange-300 focus:ring-opacity-50
                    backdrop-blur-sm border border-orange-400/20
                "
                aria-label="Scroll to top"
            >
                {/* Animated background shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

                {/* Icon */}
                <div className="relative z-10">
                    <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:-translate-y-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                </div>

                {/* Ripple effect on click */}
                <div className="absolute inset-0 rounded-full opacity-0 group-active:opacity-100 transition-opacity duration-150">
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                </div>
            </button>
        </div>
    );
}