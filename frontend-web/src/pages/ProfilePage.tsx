import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { uploadFile } from '../api/storageApi';
import { updateProfile, changePassword, getMyKeys, syncKeys } from '../api/userApi';
import * as cryptoService from '../services/cryptoService';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
    const { user, login } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Stan formularza edycji
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [isEditing, setIsEditing] = useState(false);
    
    // Stan bezpieczenstwa
    const [hasKeys, setHasKeys] = useState(cryptoService.keysExistInStorage());
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [isChangingPass, setIsChangingPass] = useState(false);

    // Aktualizacja awatara
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const toastId = toast.loading("Przesyłanie awatara...");

        try {
            const res = await uploadFile(file);
            await updateProfile({ avatarUrl: res.fileUrl });
            if (user) login({ ...user, ...{ avatarUrl: res.fileUrl } } as any);
            toast.success("Awatar zaktualizowany!", { id: toastId });
        } catch (e) {
            toast.error("Błąd aktualizacji awatara", { id: toastId });
        }
    };

    // Aktualizacja danych
    const handleProfileUpdate = async () => {
        if (!displayName.trim()) return toast.error("Nazwa nie może być pusta");
        
        try {
            await updateProfile({ displayName });
            if (user) login({ ...user, displayName } as any);
            setIsEditing(false);
            toast.success("Profil zaktualizowany");
        } catch (e) {
            toast.error("Błąd aktualizacji profilu");
        }
    };

    // Generowanie kluczy
    const handleGenerateKeys = async () => {
        const password = prompt("Podaj swoje hasło, aby zabezpieczyć nowe klucze E2EE:");
        if (!password) return;

        const toastId = toast.loading("Generowanie i synchronizacja kluczy...");

        try {
            const keyPair = await cryptoService.generateKeys();
            const pubKeyStr = await cryptoService.exportKey(keyPair.publicKey, 'public');
            const privKeyStr = await cryptoService.exportKey(keyPair.privateKey, 'private');
            
            const encryptedPrivKey = await cryptoService.encryptPrivateKeyWithPassword(privKeyStr, password);
            
            await syncKeys({
                publicKey: pubKeyStr,
                encryptedPrivateKey: encryptedPrivKey
            });
            
            // Zapisz kluczy do localStorage
            cryptoService.saveKeysStringsToStorage(pubKeyStr, privKeyStr);
            setHasKeys(true);
            toast.success("Klucze wygenerowane i zabezpieczone!", { id: toastId });
        } catch (e) {
            console.error(e);
            toast.error("Błąd generowania kluczy", { id: toastId });
        }
    };

    // Zmiana hasla i re-encrypcja klucza
    const handleChangePassword = async () => {
        if (!oldPass || !newPass) return toast.error("Wypełnij oba pola hasła");
        
        const toastId = toast.loading("Szyfrowanie kluczy...");

        try {
            const cloudKeys = await getMyKeys();
            if (!cloudKeys) {
                toast.error("Brak kluczy E2EE na serwerze. Wygeneruj je najpierw.", { id: toastId });
                return;
            }

            const privateKeyStr = await cryptoService.decryptPrivateKeyWithPassword(
                cloudKeys.encryptedPrivateKey,
                oldPass
            );
            const newEncryptedKey = await cryptoService.encryptPrivateKeyWithPassword(
                privateKeyStr,
                newPass
            );

            // Zmiana hasla
            await changePassword({
                oldPassword: oldPass,
                newPassword: newPass,
                encryptedPrivateKey: newEncryptedKey
            });

            toast.success("Hasło i klucze zaktualizowane pomyślnie!", { id: toastId });
            setOldPass('');
            setNewPass('');
            setIsChangingPass(false);

        } catch (e) {
            console.error(e);
            toast.error("Błąd zmiany hasła. Sprawdź stare hasło.", { id: toastId });
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex justify-center">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6 md:p-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Ustawienia Profilu</h1>
                    <Link to="/" className="text-blue-500 hover:underline">Wróć do czatu</Link>
                </div>

                {/* DANE UZYTKOWNIKA */}
                <div className="flex flex-col md:flex-row gap-8 mb-10 border-b pb-10">
                    <div className="flex flex-col items-center">
                        <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-4 relative group shadow-inner">
                            {(user as any).avatarUrl ? (
                                <img src={(user as any).avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400 font-bold">
                                    {user.displayName[0].toUpperCase()}
                                </div>
                            )}
                            
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-medium"
                            >
                                Zmień
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} />
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nazwa wyświetlana</label>
                            {isEditing ? (
                                <div className="flex gap-2 mt-1">
                                    <input 
                                        type="text" 
                                        value={displayName} 
                                        onChange={e => setDisplayName(e.target.value)}
                                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <button onClick={handleProfileUpdate} className="bg-green-500 text-white px-4 rounded hover:bg-green-600">OK</button>
                                    <button onClick={() => setIsEditing(false)} className="bg-gray-300 px-4 rounded hover:bg-gray-400">Anuluj</button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center mt-1 p-2 bg-gray-50 rounded border border-transparent hover:border-gray-300 cursor-pointer transition-colors" onClick={() => setIsEditing(true)}>
                                    <span className="font-medium text-lg">{user.displayName}</span>
                                    <span className="text-xs text-blue-500">Edytuj</span>
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">User ID</label>
                            <div className="mt-1 p-2 bg-gray-100 rounded text-gray-500 text-sm cursor-not-allowed font-mono">
                                {user.userId}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BEZPIECZEŃSTWO */}
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Bezpieczeństwo</h2>
                    
                    {!hasKeys ? (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
                            <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                                ⚠️ Brak kluczy E2EE
                            </h3>
                            <p className="text-sm text-yellow-700 mb-3 mt-1">
                                Twoje urządzenie nie posiada kluczy szyfrujących. Nie będziesz mógł odczytywać wiadomości.
                            </p>
                            <button 
                                onClick={handleGenerateKeys}
                                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors font-medium"
                            >
                                Wygeneruj i zabezpiecz klucze
                            </button>
                        </div>
                    ) : (
                        !isChangingPass ? (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-green-50 p-4 rounded-lg border border-green-200 mb-4 gap-4">
                                <span className="text-green-800 font-medium flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                    </svg>
                                    E2EE Aktywne
                                </span>
                                <button 
                                    onClick={() => setIsChangingPass(true)}
                                    className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors text-sm font-medium"
                                >
                                    Zmień hasło
                                </button>
                            </div>
                        ) : (
                           <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 max-w-md">
                               <h3 className="font-bold text-gray-800 mb-4">Zmiana hasła</h3>
                               <p className="text-xs text-gray-500 mb-4">Twoje stare hasło jest potrzebne do przerszyfrowania kluczy E2EE. Bez niego utracisz dostęp do historii.</p>
                               
                               <div className="space-y-3">
                                   <input 
                                       type="password" 
                                       placeholder="Stare hasło" 
                                       value={oldPass}
                                       onChange={e => setOldPass(e.target.value)}
                                       className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                   />
                                   <input 
                                       type="password" 
                                       placeholder="Nowe hasło" 
                                       value={newPass}
                                       onChange={e => setNewPass(e.target.value)}
                                       className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                   />
                                   <div className="flex gap-3 pt-2">
                                       <button onClick={handleChangePassword} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium">Zatwierdź</button>
                                       <button onClick={() => setIsChangingPass(false)} className="text-gray-600 px-4 py-2 hover:bg-gray-200 rounded">Anuluj</button>
                                   </div>
                               </div>
                           </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;