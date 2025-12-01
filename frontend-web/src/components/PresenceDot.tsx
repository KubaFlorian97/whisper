import React from "react";

interface PresenceDotProps {
    status: 'ONLINE' | 'OFFLINE';
}

const PresenceDot: React.FC<PresenceDotProps> = ({ status }) => {
    return (
        <span className={`w-3 h-3 rounded-full ml-2 flex-shrink-0 ${status === 'ONLINE' ? 'bg-green-500' : 'bg-gray-400'}`} />
    );
};

export default PresenceDot;