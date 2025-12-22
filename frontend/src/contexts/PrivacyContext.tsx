import React, { createContext, useContext, useState, useEffect } from 'react';

interface PrivacyContextType {
    isPrivate: boolean;
    togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPrivate, setIsPrivate] = useState<boolean>(() => {
        const saved = localStorage.getItem('privacy_mode');
        return saved !== null ? JSON.parse(saved) : true; // Default to private
    });

    const togglePrivacy = () => {
        setIsPrivate((prev) => !prev);
    };

    useEffect(() => {
        localStorage.setItem('privacy_mode', JSON.stringify(isPrivate));
    }, [isPrivate]);

    return (
        <PrivacyContext.Provider value={{ isPrivate, togglePrivacy }}>
            {children}
        </PrivacyContext.Provider>
    );
};

export const usePrivacy = () => {
    const context = useContext(PrivacyContext);
    if (context === undefined) {
        throw new Error('usePrivacy must be used within a PrivacyProvider');
    }
    return context;
};
