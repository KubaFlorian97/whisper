export interface Message {
    messageId: number;
    senderId: number;
    senderDisplayName: string;
    chatId: number;
    content: string;
    type: 'TEXT' | 'IMAGE' | 'VIDEO' | "VOICE" | 'FILE' | 'SYSTEM';
    timestamp: string;
    readBy: number[];
}

export interface Participant {
    userId: number;
    displayName: string;
    avatarUrl: string;
}

export interface Chat {
    chatId: number;
    name: string;
    type: 'PRIVATE' | 'GROUP';
    participants: Participant[]
}

export interface WebSocketChatMessage {
    type: 'CHAT_MESSAGE';
    chatId: number;
    content: string,
    messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'VOICE' | 'FILE';
}

export interface PresenceMessage {
    type: 'PRESENCE_UPDATE';
    userId: number;
    status: 'ONLINE' | 'OFFLINE';
}

export interface WebSocketMarkAsRead {
    type: 'MARK_AS_READ';
    messageId: number;
};

export interface ReadReceiptMessage {
    type: 'READ_RECEIPT';
    messageId: number;
    userId: number;
}

export type PresenceMap = Record<number, 'ONLINE' | 'OFFLINE'>;

export type ServerWebSocketMessage = Message | PresenceMessage | ReadReceiptMessage;