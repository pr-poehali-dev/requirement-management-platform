
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/requirements/:id" element={<Index />} />
          <Route path="/technologies/:id" element={<Index />} />
          <Route path="/solutions/:id" element={<Index />} />
          <Route path="/architectures/:id" element={<Index />} />
          <Route path="/domains/:id" element={<Index />} />
          <Route path="/techdomains/:id" element={<Index />} />
          <Route path="/catalog/technology/:id" element={<Index />} />
          <Route path="/catalog/solution/:id" element={<Index />} />
          <Route path="/catalog/architecture/:id" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;