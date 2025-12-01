import type { PublicKeyResponse } from "../api/userApi";

const PUBLIC_KEY_STORE = 'whisper_public_key';
const PRIVATE_KEY_STORE = 'whisper_private_key';

// Fukcje pomocnicze w szyfrowaniu/deszyfrowaniu
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

// Generowanie kluczy
export async function generateKeys(): Promise<CryptoKeyPair> {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
    );
    return keyPair;
}

export async function exportKey(key: CryptoKey, type: 'public' | 'private'): Promise<string> {
    const format = type === 'public' ? 'spki' : 'pkcs8';
    const exported = await window.crypto.subtle.exportKey(format, key);
    return arrayBufferToBase64(exported);
}

// Zapis kluczy do localStorage
export async function saveKeysToStorage(keyPair: CryptoKeyPair): Promise<void> {
    const publicKeyString = await exportKey(keyPair.publicKey, 'public');
    const privateKeyString = await exportKey(keyPair.privateKey, 'private');

    localStorage.setItem(PUBLIC_KEY_STORE, publicKeyString);
    localStorage.setItem(PRIVATE_KEY_STORE, privateKeyString);
}

export function keysExistInStorage(): boolean {
    return !!localStorage.getItem(PRIVATE_KEY_STORE);
}

export function getStoredPublicKey(): string | null {
    return localStorage.getItem(PUBLIC_KEY_STORE);
}

async function importKey(keyString: string, type: 'public' | 'private'): Promise<CryptoKey> {
    const format = type == 'public' ? 'spki' : 'pkcs8';
    const algorithm = { name: 'RSA-OAEP', hash: 'SHA-256' };
    const keyUsages: KeyUsage[] = type == 'public' ? ['encrypt'] : ['decrypt'];

    const keyBuffer = base64ToArrayBuffer(keyString);

    return await window.crypto.subtle.importKey(
        format,
        keyBuffer,
        algorithm,
        true,
        keyUsages
    );
}

// Pobranie klucza
export async function getStoredPrivateKey(): Promise<CryptoKey> {
    const privateKeyString = localStorage.getItem(PRIVATE_KEY_STORE);
    if (!privateKeyString) {
        throw new Error('Private key does not exist in local storage');
    }
    return importKey(privateKeyString, 'private');
}

// Szyfrowanie wiadomosci
export async function encryptMessage(text: string, recipients: PublicKeyResponse[]): Promise<string> {
    const sessionKey = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    const initVector = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(text);
    const cipherText = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: initVector },
        sessionKey,
        encodedText
    );

    const encryptedKeysMap: Record<number, string> = {};
    for (const recipient of recipients) {
        const publicKey = await importKey(recipient.publicKey, 'public');
        const exportedSessionKey = await window.crypto.subtle.exportKey('raw', sessionKey);
        const encryptedSessionKey = await window.crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            publicKey,
            exportedSessionKey
        );
        encryptedKeysMap[recipient.userId] = arrayBufferToBase64(encryptedSessionKey);
    }

    const payload = {
        ciphertext: arrayBufferToBase64(cipherText),
        iv: arrayBufferToBase64(initVector.buffer),
        keys: encryptedKeysMap
    };
    return JSON.stringify(payload);
}

// Deszyfrowanie wiadomosci
export async function decryptMessage(payloadString: string, myUserId: number): Promise<string> {
    try {
        const payload = JSON.parse(payloadString);
        const { ciphertext, iv, keys } = payload;

        let encryptedSessionKeyBase64 = keys[myUserId];

        if (!encryptedSessionKeyBase64) {
            encryptedSessionKeyBase64 = keys[String(myUserId)];
        }

        if (!encryptedSessionKeyBase64) {
            console.error(`Brak klucza sesji dla UserID: ${myUserId}. Dostępne klucze dla ID:`, Object.keys(keys));
            throw new Error(`Nie znaleziono klucza dla użytkownika ${myUserId}`);
        }

        const encryptedSessionKey = base64ToArrayBuffer(encryptedSessionKeyBase64);
        const privateKey = await getStoredPrivateKey();

        const decryptedSessionKeyBuffer = await window.crypto.subtle.decrypt(
            { name: 'RSA-OAEP' },
            privateKey,
            encryptedSessionKey
        );

        const sessionKey = await window.crypto.subtle.importKey(
            'raw',
            decryptedSessionKeyBuffer,
            { name: 'AES-GCM' },
            true,
            ['decrypt']
        );

        const decryptedTextBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: base64ToArrayBuffer(iv) },
            sessionKey,
            base64ToArrayBuffer(ciphertext)
        );

        return new TextDecoder().decode(decryptedTextBuffer);

    } catch (error) {
        console.error("Błąd deszyfrowania (E2EE):", error);
        throw error;
    }
}

// Sekcja szyfrowania klucza haslem uzytkownika
async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const textEncoder = new TextEncoder();
    const passwordBuffer = textEncoder.encode(password);

    const baseKey = await window.crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: 100000,
            hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

export async function encryptPrivateKeyWithPassword(privateKey: string, password: string): Promise<string> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const key = await deriveKeyFromPassword(password, salt);

    const encoder = new TextEncoder();
    const data = encoder.encode(privateKey);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
    );

    const combined = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);

    return arrayBufferToBase64(combined.buffer);
}

export async function decryptPrivateKeyWithPassword(encryptedPackageBase64: string, password: string): Promise<string> {
    const combined = new Uint8Array(base64ToArrayBuffer(encryptedPackageBase64));

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    const key = await deriveKeyFromPassword(password, salt);

    try {
        const decryptBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            ciphertext
        );
        return new TextDecoder().decode(decryptBuffer);
    } catch (e) {
        throw new Error("Wrong password or keys");
    }
}

export function saveKeysStringsToStorage(publicKey: string, privateKey: string) {
    localStorage.setItem(PUBLIC_KEY_STORE, publicKey);
    localStorage.setItem(PRIVATE_KEY_STORE, privateKey);
}