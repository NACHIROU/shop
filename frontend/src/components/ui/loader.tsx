import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: number;
}

export function Loader({ className, size = 24, ...props }: LoaderProps) {
    return (
        <div
            className={cn("flex items-center justify-center w-full py-8 text-muted-foreground", className)}
            {...props}
        >
            <Loader2 className="animate-spin" size={size} />
        </div>
    );
}

export function PageLoader() {
    return (
        <div className="flex items-center justify-center w-full h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );
}
