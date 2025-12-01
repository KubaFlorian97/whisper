import React from 'react';
import type { Chat, PresenceMap } from '../types/chat';
import type { AuthResponse } from '../api/apiAuth';
import PresenceDot from './PresenceDot';

interface ChatHeaderProps {
    chat: Chat;
    currentUser: AuthResponse;
    presenceMap: PresenceMap;
    onBack: () => void; // <-- NOWY PROP: Funkcja powrotu do listy
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ chat, currentUser, presenceMap, onBack }) => {
    
    let chatName = chat.name;
    let isOnline = false;
    let subtitle = '';
    let chatAvatar = '';

    if (chat.type === 'PRIVATE') {
        const otherUser = chat.participants.find(p => p.userId !== currentUser.userId);
        
        if (otherUser) {
            chatName = otherUser.displayName;
            chatAvatar = otherUser.avatarUrl;
            isOnline = presenceMap[otherUser.userId] === 'ONLINE';
            subtitle = isOnline ? 'Dostępny' : 'Niedostępny';
        }
    } else {
        chatName = chat.name;
        subtitle = `${chat.participants.length} uczestników`;
    }

    return (
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
            <div className="flex items-center overflow-hidden">
                
                {/* --- PRZYCISK WSTECZ W WIDOKU MOBILNYM */}
                <button 
                    onClick={onBack}
                    className="mr-2 md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                </button>

                {/* AWATAR */}
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mr-3">
                    {chatAvatar ? (
                        <img src={chatAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                            {chatName?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                
                {/* KROPKA STATUSU */}
                <div className="min-w-0">
                    <div className="flex items-center">
                        <h2 className="text-lg font-semibold text-gray-900 mr-2 truncate">
                            {chatName}
                        </h2>
                        {chat.type === 'PRIVATE' && <PresenceDot status={isOnline ? 'ONLINE' : 'OFFLINE'} />}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                        {subtitle}
                    </p>
                </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;