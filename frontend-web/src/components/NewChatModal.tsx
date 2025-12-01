import React, { useState, useEffect } from 'react';
import { searchUsers, type UserSearchResponse } from '../api/userApi';
import { createChat } from '../api/chatApi';
import type { Chat } from '../types/chat';
import { useAuth } from '../context/AuthContext';

interface NewChatModalProps {
    onClose: () => void;
    onChatCreated: (newChat: Chat) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onChatCreated }) => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResponse[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserSearchResponse[]>([]);
    const [groupName, setGroupName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Opoznienie do wyszukiwania uzytkownikow
    useEffect(() => {
        const timerId = setTimeout(async () => {
            if (searchQuery.length < 3) {
                setSearchResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const results = await searchUsers(searchQuery);
                // Filtrowanie wynikow
                const filtered = results.filter(u => 
                    u.userId !== user?.userId
                );
                setSearchResults(filtered);
            } catch (err) {
                console.error("Błąd wyszukiwania:", err);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timerId);
    }, [searchQuery, user?.userId]);

    const toggleUser = (userToAdd: UserSearchResponse) => {
        if (selectedUsers.find(u => u.userId === userToAdd.userId)) {
            setSelectedUsers(prev => prev.filter(u => u.userId !== userToAdd.userId));
        } else {
            setSelectedUsers(prev => [...prev, userToAdd]);
            setSearchQuery('');
            setSearchResults([]); 
        }
    };

    // Tworzenie czatu
    const handleCreateChat = async () => {
        if (selectedUsers.length === 0) return;

        const isGroup = selectedUsers.length > 1;
        if (isGroup && !groupName.trim()) {
            setError('Podaj nazwę grupy.');
            return;
        }

        setError('');
        try {
            const newChat = await createChat({
                type: isGroup ? 'GROUP' : 'PRIVATE',
                participantIds: selectedUsers.map(u => u.userId),
                name: isGroup ? groupName : undefined
            });

            onChatCreated(newChat);
            onClose();
        } catch (err) {
            console.error("Błąd tworzenia czatu:", err);
            setError('Nie udało się utworzyć czatu.');
        }
    };

    const isGroupMode = selectedUsers.length > 1;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md flex flex-col bg-white rounded-xl shadow-2xl max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* NAGLOWEK */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Nowy Czat</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-5 flex-1 overflow-y-auto">
                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {selectedUsers.map(u => (
                                <div key={u.userId} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                    <span>{u.displayName}</span>
                                    <button 
                                        onClick={() => toggleUser(u)}
                                        className="hover:text-blue-600"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* INPUT NAZWY GRUPY */}
                    {isGroupMode && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa grupy</label>
                            <input
                                type="text"
                                placeholder="Np. Projekt Whisper"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                    )}

                    {/* WYSZUKIWARKA */}
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 absolute left-3 top-3 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Szukaj osób..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* LISTA WYNIKOW */}
                    <div className="mt-4 space-y-1">
                        {isLoading && <p className="text-center text-gray-500 text-sm py-2">Szukanie...</p>}
                        
                        {!isLoading && searchQuery.length >= 3 && searchResults.length === 0 && (
                            <p className="text-center text-gray-500 text-sm py-2">Nie znaleziono użytkowników.</p>
                        )}

                        {searchResults.map(result => {
                            const isSelected = selectedUsers.some(u => u.userId === result.userId);
                            return (
                                <div 
                                    key={result.userId}
                                    onClick={() => toggleUser(result)}
                                    className={`
                                        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                                        ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                                    `}
                                >
                                    {/* AWATAR */}
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                        {result.avatarUrl ? (
                                            <img src={result.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                                                {result.displayName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{result.displayName}</p>
                                    </div>

                                    {isSelected && (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-600">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* STOPKA */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end items-center gap-3">
                    {error && <span className="text-red-500 text-sm mr-auto">{error}</span>}
                    
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    >
                        Anuluj
                    </button>
                    
                    <button
                        onClick={handleCreateChat}
                        disabled={selectedUsers.length === 0}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                    >
                        {isGroupMode ? 'Utwórz grupę' : 'Rozpocznij czat'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewChatModal;