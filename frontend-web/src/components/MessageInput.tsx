import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Chat, WebSocketChatMessage } from '../types/chat';
import { uploadFile } from '../api/storageApi';
import { getStoredPublicKey, encryptMessage } from '../services/cryptoService';
import { getPublicKey, type PublicKeyResponse } from '../api/userApi';
import toast from 'react-hot-toast';

interface MessageInputProps {
    chatId: number;
    currentChat: Chat;
}

const MessageInput: React.FC<MessageInputProps> = ({ chatId, currentChat }) => {
    const [text, setText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    // Nagrywanie
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const { webSocket, user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Wysylanie wiadomosci
    const sendEncryptedMessage = async (
        content: string, 
        type: WebSocketChatMessage['messageType']
    ) => {
        if (!webSocket || webSocket.readyState !== WebSocket.OPEN || !user) return;
        
        setIsProcessing(true);
        try {
            const publicKeys: PublicKeyResponse[] = [];

            const myLocalKey = getStoredPublicKey();
            if (!myLocalKey) {
                toast.error("Brak kluczy szyfrujących! Wejdź w Profil i wygeneruj je.");
                return;
            }
            publicKeys.push({ userId: user.userId, publicKey: myLocalKey });

            const otherParticipants = currentChat.participants.filter(p => p.userId !== user.userId);
            const otherKeyPromises = otherParticipants.map(p => getPublicKey(p.userId));
            const otherKeys = await Promise.all(otherKeyPromises);
            publicKeys.push(...otherKeys);

            const encryptedPayload = await encryptMessage(content, publicKeys);

            const message: WebSocketChatMessage = {
                type: 'CHAT_MESSAGE',
                chatId: chatId,
                content: encryptedPayload,
                messageType: type 
            };
            
            webSocket.send(JSON.stringify(message));

        } catch (error) {
            console.error("Błąd szyfrowania lub wysyłania:", error);
            toast.error("Nie udało się wysłać wiadomości.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Nagrywanie glosu
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            
            // Czyszczenie buforu
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                // Sklejanie Audio
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `voice_message_${Date.now()}.webm`, { type: 'audio/webm' });

                stream.getTracks().forEach(track => track.stop());

                // Wysylanie pliku audio
                setIsProcessing(true);
                try {
                    const response = await uploadFile(audioFile);
                    await sendEncryptedMessage(response.fileUrl, 'VOICE');
                } catch (error) {
                    console.error("Błąd wysyłania nagrania:", error);
                    toast.error("Nie udało się wysłać nagrania.");
                } finally {
                    setIsProcessing(false);
                }
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);

        } catch (err) {
            console.error("Błąd dostępu do mikrofonu:", err);
            toast.error("Nie można uzyskać dostępu do mikrofonu.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // Wysylanie wiadomosci
    const handleSendText = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        sendEncryptedMessage(text, 'TEXT');
        setText('');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const response = await uploadFile(file);
            const messageType = response.fileType.startsWith('image/') ? 'IMAGE' : 'FILE';
            await sendEncryptedMessage(response.fileUrl, messageType);
        } catch (error) {
            console.error("Błąd przesyłania pliku:", error);
            toast.error("Nie udało się wysłać pliku.")
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const isWsReady = !webSocket || webSocket.readyState !== WebSocket.OPEN;

    return (
        <div className="border-t border-gray-200 bg-white p-4">
            {isRecording ? (
                // WIDOK NAGRYWANIA
                <div className="flex items-center justify-between bg-red-50 p-2 rounded-lg animate-pulse">
                    <div className="flex items-center gap-2 text-red-600 font-medium">
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce"></div>
                        Nagrywanie...
                    </div>
                    <button 
                        onClick={stopRecording}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                        title="Zatrzymaj i wyślij"
                    >
                        {/* IKONA WYSLIJ */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                    </button>
                </div>
            ) : (
                // STANDARDOWY WIDOK
                <form onSubmit={handleSendText} className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isWsReady || isProcessing}
                        className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100 disabled:opacity-50 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.323a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 0 1 0-1.06l7.693-7.693-1.689-1.69L6.22 12.738a2.25 2.25 0 0 0 0 3.182l1.06 1.06a2.25 2.25 0 0 0 3.182 0l7.693-7.693a.75.75 0 0 1 1.06 0l1.689 1.69Z" />
                        </svg>
                    </button>
                    
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={isProcessing ? "Przetwarzanie..." : "Napisz wiadomość..."}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 transition-colors"
                        disabled={isWsReady || isProcessing}
                    />
                    
                    {text.trim() ? (
                        // PRZYCISK WYSLIJ
                        <button 
                            type="submit" 
                            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                            disabled={isWsReady || isProcessing}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    ) : (
                        // PRZYCISK MIKROFONU
                        <button
                            type="button"
                            onClick={startRecording}
                            disabled={isWsReady || isProcessing}
                            className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 hover:text-red-500 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                            </svg>
                        </button>
                    )}
                </form>
            )}
        </div>
    );
};

export default MessageInput;