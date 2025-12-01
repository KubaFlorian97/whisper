import React from "react";
import type { Chat, PresenceMap } from "../types/chat";
import type { AuthResponse } from "../api/apiAuth";
import PresenceDot from "./PresenceDot";

interface ChatListProps {
    chats: Chat[];
    selectedChatId: number | null;
    onSelectChat: (chatId: number) => void;
    presenceMap: PresenceMap;
    currentUser: AuthResponse;
    onNewChatClick: () => void;
}

const ChatList: React.FC<ChatListProps> = ({ 
    chats,
    selectedChatId,
    onSelectChat,
    presenceMap,
    currentUser,
    onNewChatClick
}) => {
    const getChatDetails = (chat: Chat) => {
        let chatName = chat.name;
        let chatAvatar: string | undefined = undefined;
        let chatStatus: 'ONLINE' | 'OFFLINE' = 'OFFLINE';

        if (chat.type === 'PRIVATE') {
            const otherUser = chat.participants.find(
                p => p.userId !== currentUser.userId
            );

            if (otherUser) {
                chatName = otherUser.displayName;
                chatAvatar = otherUser.avatarUrl;
                if (presenceMap[otherUser.userId] === 'ONLINE') {
                    chatStatus = 'ONLINE';
                }
            }
        } else {
            chatName = chat.name;
        }

        return { chatName, chatStatus, chatAvatar };
    };

    return (
        <div className="border-r border-gray-200 h-screen overflow-y-auto flex flex-col">
            {/* NAGLOWEK Z PRZYCISKIEM */}
            <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-800">Twoje Czaty</h2>
                
                {/* PRZYCISK NOWEGO CZATU */}
                <button
                    onClick={onNewChatClick}
                    className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm"
                    title="Rozpocznij nowy czat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </button>
            </div>
            
            {/* INFO: PUSTA LISTA CZATOW */}
            {chats.length === 0 && (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                    <p className="mb-2">Nie masz jeszcze wiadomości.</p>
                    <button 
                        onClick={onNewChatClick}
                        className="text-blue-500 hover:underline text-sm"
                    >
                        Rozpocznij pierwszą rozmowę
                    </button>
                </div>
            )}
            
            {/* LISTA CZATOW */}
            <ul className="list-none p-0 m-0 flex-1">
                {chats.map(chat => {
                    const { chatName, chatStatus, chatAvatar } = getChatDetails(chat);
                    
                    return (
                        <li
                            key={chat.chatId}
                            onClick={() => onSelectChat(chat.chatId)}
                            className={`
                                p-4 cursor-pointer border-b border-gray-100
                                hover:bg-gray-100 transition-colors
                                ${chat.chatId === selectedChatId ? 'bg-blue-50' : 'bg-white'}
                            `}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                        {chatAvatar ? (
                                            <img src={chatAvatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                                                {chatName?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <strong className="text-gray-900 truncate max-w-[140px] block">
                                        {chatName}
                                    </strong>
                                </div>
                                {chat.type === 'PRIVATE' && <PresenceDot status={chatStatus} />}
                            </div>
                            <div className="flex justify-between items-center">
                                <small className="text-gray-500">
                                    {chat.type === 'GROUP' ? 'Grupa' : 'Prywatny'}
                                </small>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default ChatList;