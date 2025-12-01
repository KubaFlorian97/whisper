# **🤫 Whisper - Secure E2EE Messenger**
Whisper to komunikator internetowy typu SPA (Single Page Application) skupiający się na prywatności i bezpieczeństwie. Aplikacja wykorzystuje pełne szyfrowanie End-to-End (E2EE), co oznacza, że wiadomości są szyfrowane na urządzeniu nadawcy i odszyfrowywane dopiero u odbiorcy – serwer nigdy nie ma dostępu do treści rozmów.

Projekt realizowany jest w architekturze Mono-Repo.

# ✨ Kluczowe Funkcjonalności 

- **🔐 Szyfrowanie E2EE:** Hybrydowe szyfrowanie RSA-2048 + AES-GCM. Prywatne klucze są przechowywane lokalnie i zabezpieczone hasłem użytkownika.
- **💬 Czat w czasie rzeczywistym:** Komunikacja oparta o WebSocket.
- **📂 Wysyłanie plików:** Obsługa obrazów, wideo i wiadomości głosowych (przechowywane w Supabase Storage).
- **👥 Czaty grupowe i prywatne:** Tworzenie grup, zarządzanie uczestnikami.
- **🟢 Statusy obecności:** Widoczność statusu Online/Offline rozmówców.
- **👁️ Potwierdzenia odczytu:** Statusy wysłania i odczytania wiadomości (✔✔).
- **📜 Infinite Scroll:** Wydajne ładowanie historii wiadomości.
- **📱 Responsywność (RWD):** Interfejs dostosowany do urządzeń mobilnych i desktopowych.

# 🛠️ Tech Stack #

## Backend (/backend)

- **Język:** Java 21
- **Framework:** Spring Boot 3.x
- **Baza danych:** PostgreSQL (hostowana na Supabase)
- **ORM:** Spring Data JPA (Hibernate)
- **Security:** Spring Security + JWT (JSON Web Tokens)
- **Komunikacja:** WebSocket (z dedykowanym łańcuchem Security)
- **Storage:** Integracja z Supabase Storage (S3 compatible)
- **Push Notifications:** Firebase Cloud Messaging (FCM) Admin SDK

## Frontend Web (/frontend-web)

- **Framework:** React 18
- **Język:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios (z interceptorami JWT)
- **Routing:** React Router DOM (z chronionymi trasami)
- **UI Components:** Własne komponenty + React Hot Toast
- **Kryptografia:** Web Crypto API (natywne API przeglądarki)

## ⚙️ Wymagania i Konfiguracja

Aby uruchomić projekt lokalnie, potrzebujesz:

- **Java JDK 21**
- **Node.js** (v18 lub nowszy)
- **Konto na Supabase** (Baza danych + Storage)
- **Projekt na Firebase** (dla kluczy FCM)

**Instalacja**

1. Sklonuj repozytorium lub pobierz i rozpakuj na dysku
2. Konfiguracja Backend:
    - Uzupełnij plik backend/src/main/resources/application.properties danymi dostępowymi do bazy Supabase (Transaction Pooler - port 6543 lub Direct - port 5432).
    - Dodaj klucz firebase-service-account.json do folderu resources.
    - Uruchom aplikację (np. przez IntelliJ lub ./gradlew bootRun).
3. Konfiguracja Frontend:
    - Przejdź do katalogu: cd frontend-web
    - Zainstaluj zależności: npm install
    - Uruchom serwer deweloperski: npm run dev

## 🚀 Status Projektu

Obecnie ukończona jest w pełni funkcjonalna wersja Webowa. Planowana jest implementacja natywnej aplikacji mobilnej (Android/iOS) wykorzystującej ten sam backend.
