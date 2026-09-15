import React, { Component, type ErrorInfo, type ReactNode } from "react";

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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px 24px", maxWidth: 640, margin: "0 auto", color: "#f8f9fa" }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Something went wrong</h2>
          <p style={{ color: "#adb5bd", marginBottom: 16 }}>
            {this.state.error?.message || "An unexpected error occurred while rendering this page."}
          </p>
          <button
            type="button"
            style={{
              padding: "8px 16px",
              background: "#952004",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: 600
            }}
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
