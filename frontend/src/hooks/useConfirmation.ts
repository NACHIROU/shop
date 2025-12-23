import { useState, useCallback } from 'react';

interface ConfirmationOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'default';
    onConfirm?: () => Promise<void> | void;
}

export function useConfirmation() {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmationOptions>({
        title: '',
        message: '',
    });

    const confirm = useCallback((opts: ConfirmationOptions) => {
        setOptions(opts);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleConfirm = useCallback(async () => {
        if (options.onConfirm) {
            await options.onConfirm();
        }
        close();
    }, [options, close]);

    return {
        isOpen,
        options,
        confirm,
        close,
        handleConfirm,
    };
}
