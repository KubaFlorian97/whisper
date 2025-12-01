import React, { useState } from "react";
import { registerUser } from "../api/apiAuth";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as cryptoService from "../services/cryptoService";
import { syncKeys } from "../api/userApi";

const RegisterPage: React.FC = () => {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    // Wysylka formularza
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email && !phoneNumber) {
            setError("Email or phone number required!");
            return;
        }

        try {
            const data = await registerUser({
                displayName,
                email: email || undefined,
                phoneNumber: phoneNumber || undefined,
                password
            });
            login(data);

            try {
                console.log("Generating E2EE keys...");
                const keyPair = await cryptoService.generateKeys();

                const publicKeyStr = await cryptoService.exportKey(keyPair.publicKey, 'public');
                const privateKeyStr = await cryptoService.exportKey(keyPair.privateKey, 'private');

                const encryptedPrivKey = await cryptoService.encryptPrivateKeyWithPassword(privateKeyStr, password);

                await syncKeys({
                    publicKey: publicKeyStr,
                    encryptedPrivateKey: encryptedPrivKey
                });

                cryptoService.saveKeysStringsToStorage(publicKeyStr, privateKeyStr);
                console.log("E2EE keys synchonized");
            } catch (keyErr) {
                console.log("Failed to generate keys: ", keyErr);
            }
        } catch (err) {
            setError("Failed to register user. Try again later.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
                    Whisper - Utwórz konto
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label 
                            htmlFor="displayName" 
                            className="mb-2 block font-medium text-gray-700"
                        >
                            Nazwa wyświetlana:
                        </label>
                        <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label 
                            htmlFor="email" 
                            className="mb-2 block font-medium text-gray-700"
                        >
                            Email (opcjonalnie):
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label 
                            htmlFor="phone" 
                            className="mb-2 block font-medium text-gray-700"
                        >
                            Numer telefonu (opcjonalnie):
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        Zarejestruj się
                    </button>
                </form>
                <p className="mt-6 text-center text-gray-600">
                    Masz już konto?{' '}
                    <Link to="/login" className="text-blue-500 hover:underline">
                        Zaloguj się
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;