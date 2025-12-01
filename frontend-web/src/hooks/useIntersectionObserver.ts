import { useState, useEffect, type RefObject } from "react";

export const useIntersectionObserver = (
    elementRef: RefObject<Element | null>,
    options: IntersectionObserverInit
): IntersectionObserverEntry | null => {
    const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

    useEffect(() => {
        const node = elementRef?.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setEntry(entry);
            },
            options
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [elementRef, options]);
    
    return entry;
};