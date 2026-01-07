import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Camera, X } from 'lucide-react';
import { toast } from 'sonner';

interface BarcodeScannerProps {
    onScan: (value: string) => void;
    label?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, label = 'Scanner' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [scanner, setScanner] = useState<Html5Qrcode | null>(null);

    const startScanner = async () => {
        try {
            const html5QrCode = new Html5Qrcode('reader');
            setScanner(html5QrCode);

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 100 },
                aspectRatio: 1.0,
            };

            await html5QrCode.start(
                { facingMode: 'environment' }, // Back camera
                config,
                (decodedText) => {
                    onScan(decodedText);
                    stopScanner(html5QrCode);
                    setIsOpen(false);
                    toast.success('Code scanné !');
                },
                (errorMessage) => {
                    // Ignore frequent errors during scanning
                }
            );
        } catch (err) {
            console.error('Failed to start scanner:', err);
            toast.error('Erreur lors du démarrage de la caméra');
            setIsOpen(false);
        }
    };

    const stopScanner = async (activeScanner: Html5Qrcode | null = scanner) => {
        if (activeScanner && activeScanner.isScanning) {
            try {
                await activeScanner.stop();
                activeScanner.clear();
            } catch (err) {
                console.error('Failed to stop scanner:', err);
            }
        }
    };

    useEffect(() => {
        if (isOpen) {
            // Small delay to ensure the element is in the DOM
            const timer = setTimeout(() => {
                startScanner();
            }, 300);
            return () => {
                clearTimeout(timer);
                stopScanner();
            };
        }
        return () => stopScanner();
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" type="button" className="h-10 w-10 flex-shrink-0">
                    <Camera className="w-5 h-5 text-muted-foreground" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{label}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center space-y-4 py-4">
                    <div
                        id="reader"
                        className="w-full bg-black rounded-lg overflow-hidden border border-border"
                        style={{ minHeight: '250px' }}
                    ></div>
                    <p className="text-sm text-muted-foreground text-center">
                        Placez le code-barres de l'IMEI dans le cadre pour le scanner.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        className="w-full"
                    >
                        Annuler
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
