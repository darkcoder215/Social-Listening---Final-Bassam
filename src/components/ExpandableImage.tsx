import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ExpandableImageProps {
  src?: string | null;
  alt: string;
  fallback: string;
  className?: string;
}

export function ExpandableImage({ src, alt, fallback, className = "h-24 w-24" }: ExpandableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!src) {
    return (
      <Avatar className={className}>
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Avatar className={`${className} cursor-pointer hover:opacity-80 transition-opacity`}>
          <AvatarImage src={src} alt={alt} />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <div className="flex items-center justify-center">
          <img 
            src={src} 
            alt={alt}
            className="max-h-[80vh] max-w-full object-contain rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
