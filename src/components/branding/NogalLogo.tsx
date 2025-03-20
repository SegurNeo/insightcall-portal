
import { cn } from "@/lib/utils";

interface NogalLogoProps {
  className?: string;
}

const NogalLogo: React.FC<NogalLogoProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-6 w-6 text-primary", className)}
    >
      <path d="M12 2c.9 0 1.8.2 2.6.7 1.8 1.1 2.4 3.5 1.4 5.3l-4.8 7.9c-.3.4-.2 1 .3 1.3.3.2.7.2 1 0l2-1.7a1 1 0 0 1 1.5.2 1 1 0 0 1-.1 1.3l-8.5 8c-2.1.8-4.4.4-6-1.2-2.1-2-2.1-5.5 0-7.5l5.5-5.3c.9-.9 2.2-1.4 3.5-1.2 1.3.2 2.4 1 3 2.1.3.5 0 1.1-.5 1.3-.5.2-1.1 0-1.3-.5-.7-1.2-2.2-1.5-3.4-.7-.3.2-.5.4-.7.7L7 14.2c-1.2 1.1-1.2 3 0 4.2 1.2 1.1 3 1.1 4.2 0l4.8-8c.7-1.1.3-2.6-.8-3.3-1.1-.7-2.6-.3-3.3.8L7 16.9c-.4.7-.1 1.6.6 2s1.6.1 2-.6l4.7-7.8c1.8-3 .9-6.8-2-8.6-3-1.8-6.8-.9-8.6 2l-3.7 6c-.4.7-.2 1.6.5 2 .7.4 1.6.2 2-.5l3.5-5.8c.4-.7 1.3-.9 2-.5.7.4.9 1.3.5 2l-3.5 5.8c-1.3 2.1-4 2.8-6.1 1.5-2.1-1.3-2.8-4-1.5-6.1l3.7-6C3.3 3.5 7.5 2 11.1 3.6c.3.1.6.2.9.4z"/>
    </svg>
  );
};

export default NogalLogo;
