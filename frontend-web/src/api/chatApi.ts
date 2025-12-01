import api from "./index";
import type { Chat, Message, PresenceMap } from "../types/chat";

interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    last: boolean;
}

interface CreateChatRequest {
    type: 'PRIVATE' | 'GROUP';
    participantIds: number[];
    name?: string;
}

// Pobranie listy czatow
export const getUserChats = async (): Promise<Chat[]> => {
    const res = await api.get<Chat[]>("/api/chats");
    return res.data;
};

// Pobranie listy wiadomosci
export const getChatMessages = async (
    chatId: number,
    page = 0,
    size = 20
): Promise<Page<Message>> => {
    const res = await api.get<Page<Message>>(
        `/api/chats/${chatId}/messages`, 
        {
            params: { page, size } 
        }
    );
    return res.data;
};

// Status uzytkownika
export const getChatPresence = async (chatId: number): Promise<PresenceMap> => {
    const res = await api.get<PresenceMap>(`/api/chats/${chatId}/presence`);
    return res.data;
};

// Tworzenie nowego czatu
export const createChat = async (req: CreateChatRequest): Promise<Chat> => {
    const res = await api.post<Chat>('/api/chats', req);
    return res.data;
}