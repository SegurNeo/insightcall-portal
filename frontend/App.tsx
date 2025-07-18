import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import CallsPage from "./pages/CallsPage";
import CallsPageMigrated from "./pages/CallsPageMigrated";
import TranscriptionsPage from "./pages/TranscriptionsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SearchPage from "./pages/SearchPage";
import ActionsPage from "./pages/ActionsPage";
import PhonesPage from "./pages/PhonesPage";
import SettingsPage from "./pages/SettingsPage";
import InvoicingPage from "./pages/InvoicingPage";
import LabPage from "./pages/LabPage";
import TicketsPage from "./pages/TicketsPage";
import { MigrationTest } from "./components/debug/MigrationTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/calls" element={<CallsPageMigrated />} />
          <Route path="/calls-legacy" element={<CallsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/transcriptions" element={<TranscriptionsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/actions" element={<ActionsPage />} />
          <Route path="/phones" element={<PhonesPage />} />
          <Route path="/lab" element={<LabPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/invoicing" element={<InvoicingPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/test-migration" element={<MigrationTest />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
