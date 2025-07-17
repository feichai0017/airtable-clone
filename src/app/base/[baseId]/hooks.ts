import { useState, useEffect, useRef } from "react";

// Hook for delayed loading state to prevent flashing
export function useDelayedLoading(isLoading: boolean, delay: number = 500) {
    const [showLoading, setShowLoading] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isLoading) {
            timeoutRef.current = setTimeout(() => {
                setShowLoading(true);
            }, delay);
        } else {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            setShowLoading(false);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isLoading, delay]);

    return showLoading;
}

// Hook for handling clicks outside of elements
export function useOutsideClick(callback: () => void, refs: React.RefObject<Element>[]) {
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const isOutside = refs.every(ref =>
                ref.current && !ref.current.contains(event.target as Node)
            );

            if (isOutside) {
                callback();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [callback, refs]);
}

// Hook for debounced value
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// Hook for keyboard navigation
export function useKeyboardNavigation(
    onArrowUp: () => void,
    onArrowDown: () => void,
    onArrowLeft: () => void,
    onArrowRight: () => void,
    onEnter: () => void,
    onEscape: () => void
) {
    useEffect(() => {
        function handleKeyPress(event: KeyboardEvent) {
            switch (event.key) {
                case "ArrowUp":
                    event.preventDefault();
                    onArrowUp();
                    break;
                case "ArrowDown":
                    event.preventDefault();
                    onArrowDown();
                    break;
                case "ArrowLeft":
                    event.preventDefault();
                    onArrowLeft();
                    break;
                case "ArrowRight":
                    event.preventDefault();
                    onArrowRight();
                    break;
                case "Enter":
                    event.preventDefault();
                    onEnter();
                    break;
                case "Escape":
                    event.preventDefault();
                    onEscape();
                    break;
            }
        }

        document.addEventListener("keydown", handleKeyPress);
        return () => {
            document.removeEventListener("keydown", handleKeyPress);
        };
    }, [onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onEscape]);
} 