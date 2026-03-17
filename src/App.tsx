import { Component, ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import AIAssistant from "./components/AIAssistant";
import DemoRecorder from "./components/DemoRecorder";
import Home from "./pages/Home";
import DagaWitness from "./pages/DagaWitness";
import DagaSearch from "./pages/DagaSearch";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Auth from "./pages/Auth";
import EarlyWarning from "./pages/EarlyWarning";
import SharedReport from "./pages/SharedReport";
import NotFound from "./pages/NotFound";

class ErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = {}
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // eslint-disable-next-line no-console
    console.error("App error:", error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
          <div className="max-w-xl rounded-lg border border-red-500/40 bg-red-50 p-8">
            <h1 className="text-2xl font-bold text-red-700">Something went wrong</h1>
            <p className="mt-4 text-sm text-red-600">
              An unexpected error occurred while rendering the app. Check the browser
              console for details.
            </p>
            <pre className="mt-4 max-h-64 overflow-auto rounded bg-white p-4 text-xs text-red-700">
              {String(this.state.error)}
            </pre>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public shared report route - no navigation */}
            <Route path="/shared/:shareId" element={<SharedReport />} />
            
            {/* Main app routes with navigation */}
            <Route
              path="*"
              element={
                <div className="min-h-screen bg-background">
                  <Navigation />
                  <div className="pt-[73px]">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/dagawitness" element={<DagaWitness />} />
                      <Route path="/dagasearch" element={<DagaSearch />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/early-warning" element={<EarlyWarning />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                  <AIAssistant />
                  <DemoRecorder />
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
)

export default App;
