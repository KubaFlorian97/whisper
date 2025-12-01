import React, { useState } from "react";
import { loginUser } from "../api/apiAuth";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as cryptoService from "../services/cryptoService";
import { getMyKeys, syncKeys } from "../api/userApi";

const LoginPage: React.FC = () => {
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    // Wysylka formularza
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const data = await loginUser({ loginIdentifier, password });
            login(data);

            try {
                console.log("Trying to restore E2EE keys");
                const cloudKeys = await getMyKeys();

                if (cloudKeys) {
                    const decryptedPrivKey = await cryptoService.decryptPrivateKeyWithPassword(
                        cloudKeys.encryptedPrivateKey,
                        password
                    );
                    cryptoService.saveKeysStringsToStorage(cloudKeys.publicKey, decryptedPrivKey);
                    console.log("E2EE keys restored.");
                } else {
                    console.log("Missing E2EE keys. Generating new keys...");
                    const keyPair = await cryptoService.generateKeys();
                    const publicKeyStr = await cryptoService.exportKey(keyPair.publicKey, 'public');
                    const privateKeyStr = await cryptoService.exportKey(keyPair.privateKey, 'private');
                    const encryptedPrivKey = await cryptoService.encryptPrivateKeyWithPassword(privateKeyStr, password);

                    await syncKeys({ publicKey: publicKeyStr, encryptedPrivateKey: encryptedPrivKey });
                    cryptoService.saveKeysStringsToStorage(publicKeyStr, privateKeyStr);
                }
            } catch (keyErr) {
                console.log("Failed to restore or generate E2EE keys");
            }
        } catch (err) {
            setError('Incorrect login or password');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
                    Whisper - Zaloguj się
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label 
                            htmlFor="login" 
                            className="mb-2 block font-medium text-gray-700"
                        >
                            Email lub numer telefonu:
                        </label>
                        <input
                            id="login"
                            type="text"
                            value={loginIdentifier}
                            onChange={(e) => setLoginIdentifier(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label 
                            htmlFor="password" 
                            className="mb-2 block font-medium text-gray-700"
                        >
                            Hasło:
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    
                    {error && (
                        <p className="mb-4 text-center text-sm text-red-500">
                            {error}
                        </p>
                    )}
                    
                    <button 
                        type="submit" 
                        className="w-full rounded-lg bg-blue-500 p-3 font-semibold text-white transition-colors hover:bg-blue-600"
                    >
                        Zaloguj się
                    </button>
                </form>
                <p className="mt-6 text-center text-gray-600">
                    Nie masz konta?{' '}
                    <Link to="/register" className="text-blue-500 hover:underline">
                        Zarejestruj się
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;