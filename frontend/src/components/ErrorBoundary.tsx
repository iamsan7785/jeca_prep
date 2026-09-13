import { AlertCircle, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Component } from "react";
import { Button } from "./ui";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("Error caught by boundary:", error);
    // Could send to error tracking service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <AlertCircle size={48} />
            <h1>Something went wrong</h1>
            <p>We encountered an unexpected error. Please try refreshing the page.</p>
            {this.state.error && (
              <details style={{ marginTop: "16px", textAlign: "left", color: "#64748b", fontSize: "12px" }}>
                <summary style={{ cursor: "pointer", fontWeight: "bold", marginBottom: "8px" }}>
                  Error details
                </summary>
                <pre style={{ background: "#f1f5f9", padding: "8px", borderRadius: "4px", overflow: "auto" }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              <RotateCcw size={16} /> Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
