import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Hủy timeout nếu value thay đổi (user đang gõ)
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); 

    return debouncedValue;
}

export default useDebounce;