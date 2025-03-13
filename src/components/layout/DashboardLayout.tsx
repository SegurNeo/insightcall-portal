
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import PageContainer from "./PageContainer";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <Header sidebarCollapsed={sidebarCollapsed} />
      <PageContainer sidebarCollapsed={sidebarCollapsed}>
        {children}
      </PageContainer>
    </div>
  );
};

export default DashboardLayout;
