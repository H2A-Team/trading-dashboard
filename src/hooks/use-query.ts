import { useEffect, useState } from "react";

export type TUseQuery = { isMatching: boolean };

export function useQuery(query: string): TUseQuery {
    const [isMatching, setIsMatching] = useState(window.matchMedia(query).matches);

    useEffect(() => {
        const onChange = (e: MediaQueryListEvent) => setIsMatching(e.matches);
        const mediaQueryList = window.matchMedia(query);
        mediaQueryList.addEventListener("change", onChange);
        return () => {
            mediaQueryList.removeEventListener("change", onChange);
        };
    }, [query, window]);

    return { isMatching };
}
