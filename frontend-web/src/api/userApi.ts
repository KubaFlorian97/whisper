import api from "./index";

export interface UserSearchResponse {
    userId: number;
    displayName: string;
    avatarUrl?: string;
}

interface PublicKeyUploadRequest {
    publicKey: string;
}

export interface PublicKeyResponse {
    userId: number;
    publicKey: string;
}

export interface KeySyncRequestResponse {
    publicKey: string;
    encryptedPrivateKey: string;
}

interface UpdateProfileRequest {
    displayName?: string;
    email?: string;
    phoneNumber?: string;
    avatarUrl?: string;
}

interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
    encryptedPrivateKey: string;
}

// Lista uzytkownikow
export const searchUsers = async (query: string): Promise<UserSearchResponse[]> => {
    const res = await api.get<UserSearchResponse[]>('/api/users/search', {
        params: { query }
    });
    return res.data;
};

// Zapis klucza publicznego do bazy
export const uploadPublicKey = async (publicKey: string): Promise<void> => {
    const reqData: PublicKeyUploadRequest = { publicKey };
    await api.put('/api/users/me/public-key', reqData);
};

// Pobranie klucza publicznego
export const getPublicKey = async (userId: number): Promise<PublicKeyResponse> => {
    try {
        const res = await api.get<PublicKeyResponse>(`/api/users/${userId}/public-key`);
        return res.data;
    } catch (err) {
        console.error(`Failed to get user public key for ${userId}`, err);
        throw new Error('User does not have public key');
    }
};

// Synchronizacja kluczy E2EE
export const syncKeys = async (keys: KeySyncRequestResponse): Promise<void> => {
    await api.post('/api/users/me/keys', keys);
};

// Pobranie kluczy E2EE
export const getMyKeys = async (): Promise<KeySyncRequestResponse | null> => {
    try {
        const res = await api.get<KeySyncRequestResponse>('/api/users/me/keys');
        if (!res.data.publicKey || !res.data.encryptedPrivateKey) {
            return null;
        }
        return res.data;
    } catch (e) {
        return null;
    }
};

// Update profilu
export const updateProfile = async (data: UpdateProfileRequest): Promise<void> => {
    await api.put('/api/users/me', data);
}

// Zmiana hasla
export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    await api.post('/api/users/me/password', data);
}