import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserChats, getChatMessages, getChatPresence } from "../api/chatApi";
import type { Chat, Message, PresenceMap, PresenceMessage, ReadReceiptMessage, ServerWebSocketMessage } from "../types/chat";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";

import ChatList from "../components/ChatList";
import MessageArea from "../components/MessageArea";
import MessageInput from "../components/MessageInput";
import NewChatModal from "../components/NewChatModal";
import ChatHeader from "../components/ChatHeader";

const ChatPage: React.FC = () => {
    const { user, webSocket, logout } = useAuth();
    
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    
    // Stany ladowania
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [presenceMap, setPresenceMap] = useState<PresenceMap>({});
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    
    const currentChat = chats.find(chat => chat.chatId === selectedChatId);

    // Prosba o uprawnienia dla powiadomien systemowych
    useEffect(() => {
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }, []);

    // Pobieranie listy czatow
    const fetchChats = useCallback(async () => {
        if (!user) return;

        try {
            const userChats = await getUserChats();
            setChats(userChats);
            if (window.innerWidth >= 768 && userChats.length > 0 && selectedChatId === null) {
                setSelectedChatId(userChats[0].chatId);
            }
        } catch (err) {
            console.error("Failed to fetch chats", err);
            if (isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
                logout();
            }
        }
    }, [user, logout, selectedChatId]);

    useEffect(() => {
        fetchChats();
    }, [fetchChats]);
    
    // Wybor czatu
    useEffect(() => {
        if (!selectedChatId) return;
        
        const initChat = async () => {
            setIsLoadingMessages(true);
            setMessages([]);
            setPage(0);
            setHasMore(true);

            try {
                const [messagePage, presence] = await Promise.all([
                    getChatMessages(selectedChatId, 0),
                    getChatPresence(selectedChatId)
                ]);
                
                setMessages(messagePage.content.reverse());
                setHasMore(!messagePage.last);
                setPresenceMap(presence);
            } catch (err) {
                console.error("Failed to download chats data", err);
                toast.error("Nie udało się pobrać wiadomości");
                if (isAxiosError(err) && err.response?.status === 401) {
                    logout();
                }
            } finally {
                setIsLoadingMessages(false);
            }
        };
        initChat();
    }, [selectedChatId]);

    // Infinite Scroll
    const handleLoadMore = async () => {
        if (!selectedChatId || isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        const nextPage = page + 1;

        try {
            const messagePage = await getChatMessages(selectedChatId, nextPage);
            
            if (messagePage.content.length > 0) {
                setMessages(prev => [...messagePage.content.reverse(), ...prev]);
                setPage(nextPage);
                setHasMore(!messagePage.last);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            toast.error("Błąd ładowania historii");
        } finally {
            setIsLoadingMore(false);
        }
    };

    // WebSocket Handler
    useEffect(() => {
        if (!webSocket) return;

        const handleWebSocketMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data) as ServerWebSocketMessage;
                
                // Nowa wiadomosc
                if (data && 'messageId' in data && data.type !== 'READ_RECEIPT') {
                    const newMsg = data as Message;
                    if (!newMsg.readBy) newMsg.readBy = [];

                    // Dodaj wiadomosc w czasie rzeczywistym
                    if (Number(newMsg.chatId) === Number(selectedChatId)) {
                        setMessages(prevMessages => [...prevMessages, newMsg]);
                    } else {
                        if (newMsg.senderId !== user?.userId) {
                            toast((t) => (
                                <div onClick={() => { setSelectedChatId(newMsg.chatId); toast.dismiss(t.id); }} className="cursor-pointer">
                                    <p className="font-bold text-sm">{newMsg.senderDisplayName}</p>
                                    <p className="text-xs truncate text-gray-500">
                                        {newMsg.type === 'TEXT' ? newMsg.content.substring(0, 30) + '...' : `Przesłano: ${newMsg.type}`}
                                    </p>
                                </div>
                            ), { icon: '💬', duration: 4000 });

                            // Powiadomienie systemowe
                            if (document.visibilityState === 'hidden') {
                                new Notification(newMsg.senderDisplayName, {
                                    body: newMsg.type === 'TEXT' ? newMsg.content : 'Przesłano załącznik',
                                });
                            }
                        }
                        fetchChats();
                    }
                } 
                // Status
                else if (data && data.type === 'PRESENCE_UPDATE') {
                    const presenceMsg = data as PresenceMessage;
                    setPresenceMap(prevMap => ({
                        ...prevMap,
                        [presenceMsg.userId]: presenceMsg.status
                    }));
                } 
                // Potwierdzenie odczytu
                else if (data && data.type === 'READ_RECEIPT') {
                    const receipt = data as ReadReceiptMessage;
                    setMessages(prevMsg => prevMsg.map(msg =>
                        msg.messageId === receipt.messageId
                        ? {
                            ...msg,
                            readBy: Array.from(new Set([...(msg.readBy || []), receipt.userId]))
                        }
                        : msg
                    ));
                }
            } catch (err) {
                console.error("WebSocket parsing error", err);
            }
        };

        webSocket.addEventListener('message', handleWebSocketMessage);
        return () => {
            webSocket.removeEventListener('message', handleWebSocketMessage);
        };
    }, [webSocket, selectedChatId, fetchChats, user?.userId]);

    const handleChatCreated = (newChat: Chat) => {
        setChats(prevChats => [newChat, ...prevChats]);
        setSelectedChatId(newChat.chatId);
        toast.success("Czat utworzony!");
    }

    if (!user) return null;

    return (
        <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">
            {/* LISTA CZATOW */}
            <div className={`
                w-full md:w-[300px] flex-shrink-0 bg-white flex-col border-r border-gray-200
                ${selectedChatId ? 'hidden md:flex' : 'flex'}
            `}>
                <ChatList
                    chats={chats}
                    selectedChatId={selectedChatId}
                    onSelectChat={setSelectedChatId}
                    presenceMap={presenceMap}
                    currentUser={user}
                    onNewChatClick={() => setIsNewChatModalOpen(true)}
                />
                
                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 md:hidden">
                    <Link to="/profile" className="text-sm font-medium text-gray-600">Mój Profil</Link>
                    <button onClick={logout} className="text-sm font-medium text-red-500">Wyloguj</button>
                </div>
            </div>
            
            {/* PANEL CZATU */}
            <div className={`
                flex-1 flex-col min-w-0 bg-gray-100 relative
                ${!selectedChatId ? 'hidden md:flex' : 'flex'}
            `}>
                {selectedChatId && currentChat ? (
                    <>
                        <ChatHeader 
                            chat={currentChat}
                            currentUser={user}
                            presenceMap={presenceMap}
                            onBack={() => setSelectedChatId(null)}
                        />
                        
                        <MessageArea
                            messages={messages}
                            isLoading={isLoadingMessages}
                            isLoadingMore={isLoadingMore}
                            hasMore={hasMore}
                            onLoadMore={handleLoadMore}
                            currentUser={user}
                            currentChat={currentChat}
                            webSocket={webSocket}
                        />
                        <MessageInput
                            chatId={selectedChatId}
                            currentChat={currentChat}
                        />
                    </>
                ) : (
                    <div className="flex-1 grid place-items-center text-gray-400">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold mb-2">Wybierz czat</h2>
                            <p>Wybierz rozmowę z listy, aby zacząć pisać.</p>
                        </div>
                    </div>
                )}

                {/* PRZYCISKI DESKTOPOWE */}
                <div className="hidden md:flex absolute top-4 right-4 gap-2 z-10">
                    <Link 
                        to="/profile"
                        className="px-4 py-2 bg-white/80 backdrop-blur text-gray-800 rounded-lg hover:bg-white shadow-sm transition-all font-medium text-sm border border-gray-200"
                    >
                        Profil
                    </Link>
                    <button 
                        onClick={logout} 
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium text-sm shadow-sm"
                    >
                        Wyloguj
                    </button>
                </div>
            </div>
            
            {isNewChatModalOpen && (
                <NewChatModal
                    onClose={() => setIsNewChatModalOpen(false)}
                    onChatCreated={handleChatCreated}
                />
            )}
        </div>
    );
};

export default ChatPage;