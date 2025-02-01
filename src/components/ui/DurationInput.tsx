import React, { useState, useRef } from 'react';

interface DurationInputProps {
    value: string;
    onChange: (value: string) => void;
}

export const DurationInput: React.FC<DurationInputProps> = ({ value, onChange }) => {
    const [localDuration, setLocalDuration] = useState(value);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const parseDuration = (duration: string) => {
        const [minutes, seconds] = duration.split(':').map((part) => parseInt(part, 10) || 0);
        return { minutes: minutes || 0, seconds: seconds || 0 };
    };

    const formatDuration = (minutes: number, seconds: number) => {
        const clampedSeconds = seconds < 0 ? 59 : seconds % 60;
        const totalMinutes = minutes + Math.floor(seconds / 60);
        return `${String(totalMinutes).padStart(2, '0')}:${String(clampedSeconds).padStart(2, '0')}`;
    };

    const handleAdjust = (delta: number) => {
        const { minutes, seconds } = parseDuration(localDuration);
        const newDuration = formatDuration(minutes, seconds + delta);
        setLocalDuration(newDuration);
    };

    const handleBlur = () => {
        // Emit value back to parent when done editing
        onChange(localDuration);
    };

    const startAdjusting = (delta: number) => {
        handleAdjust(delta);
        intervalRef.current = setInterval(() => {
            handleAdjust(delta);
        }, 100); // Adjust every 100ms while holding
    };

    const stopAdjusting = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                className="bg-gray-700 text-white px-2 py-1 rounded"
                onMouseDown={() => startAdjusting(-1)}
                onMouseUp={stopAdjusting}
                onMouseLeave={stopAdjusting}
                onTouchStart={() => startAdjusting(-1)}
                onTouchEnd={stopAdjusting}
            >
                -
            </button>
            <input
                type="text"
                value={localDuration}
                onChange={(e) => setLocalDuration(e.target.value)}
                onBlur={handleBlur}
                className="bg-gray-800 text-white px-2 py-1 rounded w-20 text-center"
            />
            <button
                type="button"
                className="bg-gray-700 text-white px-2 py-1 rounded"
                onMouseDown={() => startAdjusting(1)}
                onMouseUp={stopAdjusting}
                onMouseLeave={stopAdjusting}
                onTouchStart={() => startAdjusting(1)}
                onTouchEnd={stopAdjusting}
            >
                +
            </button>
        </div>
    );
};
