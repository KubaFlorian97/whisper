import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { AuthResponse } from '../api/apiAuth';
import type { Chat, Message, WebSocketMarkAsRead } from '../types/chat';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { decryptMessage } from '../services/cryptoService';

// Deszyfrowanie treści
const DecryptedText: React.FC<{ encryptedContent: string; myUserId: number }> = ({ encryptedContent, myUserId }) => {
    const [decrypted, setDecrypted] = useState('... 🔒 ...');
    const [error, setError] = useState(false);

    useEffect(() => {
        const doDecrypt = async () => {
            try {
                JSON.parse(encryptedContent); 
                const plainText = await decryptMessage(encryptedContent, myUserId);
                setDecrypted(plainText);
            } catch (err) {
                setError(true);
                if (err instanceof SyntaxError) {
                     setDecrypted(encryptedContent);
                } else {
                     setDecrypted('❌ Błąd deszyfrowania');
                }
            }
        };
        doDecrypt();
    }, [encryptedContent, myUserId]);
    
    return <p className={`break-words ${error ? 'text-red-400 text-xs' : ''}`}>{decrypted}</p>;
};

// Tresc pojedynczej wiadomosci
const MessageContent: React.FC<{ message: Message; myUserId: number }> = ({ message, myUserId }) => {
    const [decryptedUrl, setDecryptedUrl] = useState('');
    const [isUrlDecrypted, setIsUrlDecrypted] = useState(false);

    // Deszyfrowanie URL dla mediow
    useEffect(() => {
        if (message.type !== 'TEXT' && message.type !== 'SYSTEM') {
            const decryptUrl = async () => {
                try {
                    const url = await decryptMessage(message.content, myUserId);
                    setDecryptedUrl(url);
                } catch (e) {
                    setDecryptedUrl('');
                } finally {
                    setIsUrlDecrypted(true);
                }
            };
            decryptUrl();
        }
    }, [message.content, message.type, myUserId]);

    switch (message.type) {
        case 'TEXT':
            return <DecryptedText encryptedContent={message.content} myUserId={myUserId} />;
            
        case 'IMAGE':
            if (!isUrlDecrypted) return <p className="text-xs text-gray-400 animate-pulse">... 🔒 ...</p>;
            return (
                <img 
                    src={decryptedUrl} 
                    alt="Obraz" 
                    className="max-w-xs rounded-lg mt-2 cursor-pointer hover:opacity-90 border border-gray-200" 
                    onClick={() => window.open(decryptedUrl, '_blank')} 
                />
            );

        case 'VIDEO':
            if (!isUrlDecrypted) return <p className="text-xs text-gray-400 animate-pulse">... 🔒 ...</p>;
            return (
                <video controls className="max-w-xs rounded-lg mt-2 border border-gray-200 bg-black">
                    <source src={decryptedUrl} />
                    Twoja przeglądarka nie wspiera wideo.
                </video>
            );

        case 'VOICE':
            if (!isUrlDecrypted) return <p className="text-xs text-gray-400 animate-pulse">... 🔒 ...</p>;
            return (
                <div className="mt-2 w-[220px]">
                    <audio controls className="w-full h-8">
                        <source src={decryptedUrl} type="audio/webm" />
                        <source src={decryptedUrl} type="audio/mp3" />
                        Twoja przeglądarka nie wspiera audio.
                    </audio>
                </div>
            );

        case 'FILE':
        default:
            if (!isUrlDecrypted) return <p className="text-xs text-gray-400 animate-pulse">... 🔒 ...</p>;
            const fileName = decryptedUrl.split('/').pop() || 'Plik';
            return (
                <a 
                    href={decryptedUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 text-blue-600 underline text-sm break-all mt-1 p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    {fileName}
                </a>
            );
    }
};

// Interface wiadomosci
interface MessageItemProps {
    message: Message;
    isMe: boolean;
    participantsCount: number;
    onView: (messageId: number) => void;
    myUserId: number;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isMe, participantsCount, onView, myUserId }) => {
    const ref = useRef<HTMLDivElement>(null);

    // Obserwator nowych wiadomosci
    const entry = useIntersectionObserver(ref, { threshold: 0.5 });
    const isVisible = !!entry?.isIntersecting;

    useEffect(() => {
        if (isVisible && !isMe) {
            onView(message.messageId);
        }
    }, [isVisible, isMe, message.messageId, onView]);

    const getReadStatusIcon = () => {
        if (!isMe) return null;
        
        const readersCount = (message.readBy || []).length;
        const allOthersCount = participantsCount - 1;

        // Status odczytania
        if (readersCount >= allOthersCount && allOthersCount > 0) {
            return <span className="text-blue-500 text-[10px] ml-1 tracking-tighter font-bold">✔✔</span>;
        }
        if (readersCount > 0) {
            return <span className="text-gray-500 text-[10px] ml-1 tracking-tighter font-bold">✔✔</span>;
        }
        return <span className="text-gray-400 text-[10px] ml-1 font-bold">✔</span>;
    };

    return (
        <div 
            ref={ref} 
            className={`flex my-2 ${isMe ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`
                py-2 px-4 rounded-2xl max-w-[75%] shadow-sm relative min-w-[80px]
                ${isMe ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}
            `}>
                {!isMe && (
                    <strong className="block text-xs mb-1 text-blue-600 font-semibold">
                        {message.senderDisplayName}
                    </strong>
                )}
                
                <MessageContent message={message} myUserId={myUserId} />
                
                <div className={`text-[10px] text-right mt-1 flex items-center justify-end ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {getReadStatusIcon()}
                </div>
            </div>
        </div>
    );
};

// Interface kontenera wiadomosci
interface MessageAreaProps {
    messages: Message[];
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    currentUser: AuthResponse;
    currentChat: Chat;
    webSocket: WebSocket | null;
}

const MessageArea: React.FC<MessageAreaProps> = ({ 
    messages, 
    isLoading,
    isLoadingMore, 
    hasMore, 
    onLoadMore,
    currentUser, 
    currentChat, 
    webSocket 
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const topLoaderRef = useRef<HTMLDivElement>(null);
    
    // Obserwator doladowywania wiadomosci
    const topEntry = useIntersectionObserver(topLoaderRef, { threshold: 0.1 });
    const isTopVisible = !!topEntry?.isIntersecting;

    const [prevScrollHeight, setPrevScrollHeight] = useState(0);
    const sentReadReceipts = useRef(new Set<number>());

    // Doladowywanie starszych wiadomosci
    useEffect(() => {
        if (isTopVisible && hasMore && !isLoadingMore && !isLoading) {
            if (containerRef.current) {
                setPrevScrollHeight(containerRef.current.scrollHeight);
            }
            onLoadMore();
        }
    }, [isTopVisible, hasMore, isLoadingMore, isLoading, onLoadMore]);

    // Pozycja scrolla
    useLayoutEffect(() => {
        if (containerRef.current && prevScrollHeight > 0 && messages.length > 0) {
            const newScrollHeight = containerRef.current.scrollHeight;
            const heightDifference = newScrollHeight - prevScrollHeight;
            
            containerRef.current.scrollTop = heightDifference;
            setPrevScrollHeight(0);
        }
    }, [messages, prevScrollHeight]);

    useEffect(() => {
        if (prevScrollHeight === 0 && messagesEndRef.current) {
             messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
    }, [messages, prevScrollHeight]);

    // Potwierdzenia odczytu
    const handleMessageView = (messageId: number) => {
        if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;
        if (sentReadReceipts.current.has(messageId)) return;

        const message = messages.find(m => m.messageId === messageId);
        if (message && message.readBy && !message.readBy.includes(currentUser.userId)) {
            
            const readMessage: WebSocketMarkAsRead = {
                type: 'MARK_AS_READ',
                messageId: messageId,
            };
            webSocket.send(JSON.stringify(readMessage));
            sentReadReceipts.current.add(messageId);
        }
    };

    if (isLoading) {
        return <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-100">Ładowanie historii...</div>;
    }

    return (
        <div 
            ref={containerRef}
            className="flex-1 overflow-y-auto p-4 bg-gray-100 flex flex-col"
        >
            {/* GORNY LOADER */}
            <div ref={topLoaderRef} className="h-6 w-full flex justify-center items-center my-2 flex-shrink-0">
                {isLoadingMore && <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>}
            </div>

            {messages.map(msg => (
                msg.type === 'SYSTEM' ? (
                    <div key={msg.messageId} className="text-center text-xs text-gray-500 italic my-3 bg-gray-200 py-1 px-3 rounded-full self-center">
                        {msg.content}
                    </div>
                ) : (
                    <MessageItem
                        key={msg.messageId}
                        message={msg}
                        isMe={msg.senderId === currentUser.userId}
                        participantsCount={currentChat.participants.length}
                        onView={handleMessageView}
                        myUserId={currentUser.userId}
                    />
                )
            ))}
            
            {/* KOTWICA PRZEWIJANIA NA DOL */}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageArea;