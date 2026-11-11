"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";

const LanguageContext = createContext("ru");
const SetLanguageContext = createContext(null);
const storageKey = "it-college-language";

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState("ru");

    useEffect(() => {
        try {
            if (localStorage.getItem(storageKey) === "kk") {
                document.documentElement.lang = "kk";
                setLanguage("kk");
            }
        } catch {}
    }, []);

    function changeLanguage(next) {
        document.documentElement.lang = next;
        setLanguage(next);
        try { localStorage.setItem(storageKey, next); } catch {}
    }

    return (
        <SetLanguageContext.Provider value={changeLanguage}>
            <LanguageContext.Provider value={language}>
                {children}
            </LanguageContext.Provider>
        </SetLanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}

export function SiteHeader() {
    const language = useLanguage();
    const changeLanguage = useContext(SetLanguageContext);
    const kk = language === "kk";

    return (
        <header>
            <img src="/images/logo.png" alt="IT-College" />
            <nav>
                <Link href="/#prof">{kk ? "Кәсіптік бағдар" : "Профориентирование"}</Link>
                <Link href="/#about">{kk ? "Біз туралы" : "О нас"}</Link>
                <Link href="/test" className="headerBtn">{kk ? "Тестті бастау" : "Начать тест"}</Link>
                <div className="languageSwitch" role="group" aria-label={kk ? "Сайт тілі" : "Язык сайта"}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <ellipse cx="12" cy="12" rx="4" ry="9" />
                        <path d="M3 12h18" />
                    </svg>
                    <button type="button" lang="kk" aria-label="Қазақша" aria-pressed={kk} onClick={() => changeLanguage("kk")}>ҚАЗ</button>
                    <button type="button" lang="ru" aria-label="Русский" aria-pressed={!kk} onClick={() => changeLanguage("ru")}>РУС</button>
                </div>
            </nav>
        </header>
    );
}
