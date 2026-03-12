import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Create from "@/pages/Create";
import CheatSheetDetail from "@/pages/CheatSheetDetail";
import Login from "@/pages/Login";

import { useState } from "react";
import { ChatBot } from "@/components/ChatBot";

function Router({ onAskAI }: { onAskAI: () => void }) {
  return (
    <Switch>
      <Route path="/" component={() => <Home onAskAI={onAskAI} />} />
      <Route path="/login" component={Login} />
      <Route path="/create" component={Create} />
      <Route path="/cheatsheet/:id">
        {(params) => <CheatSheetDetail onAskAI={onAskAI} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router onAskAI={() => setIsChatOpen(true)} />
        <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
