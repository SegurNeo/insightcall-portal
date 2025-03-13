
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  sidebarCollapsed: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  className,
  sidebarCollapsed
}) => {
  return (
    <main className={cn(
      "pt-16 min-h-screen page-transition transition-all duration-300",
      sidebarCollapsed ? "ml-[70px]" : "ml-[240px]",
      className
    )}>
      <div className="container py-6 px-4 md:px-6 max-w-[1800px]">
        {children}
      </div>
    </main>
  );
};

export default PageContainer;
