import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MeetingsConfigProvider } from "@/contexts/MeetingsConfigContext";
import { UserMappingProvider } from "@/contexts/UserMappingContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Meetings from "./pages/Meetings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserMappingProvider>
      <MeetingsConfigProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col">
                  <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
                    <SidebarTrigger className="text-primary" />
                    <div className="flex-1" />
                  </header>
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/meetings" element={<Meetings />} />
                      <Route path="/admin" element={<Admin />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </BrowserRouter>
        </TooltipProvider>
      </MeetingsConfigProvider>
    </UserMappingProvider>
  </QueryClientProvider>
);

export default App;
