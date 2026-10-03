import React from "react";
import "./ErrorBoundary.css";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Rendering error: ", error, errorInfo);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="error-boundary">
        <main className="error-boundary__main" role="alert">
          <h1>Unexpected Error</h1>
          <p>Something went wrong.</p>
          <p>ScheduleSnap encountered an unexpected error.</p>
          <p>Please try refreshing the page or <a href="mailto:schedulesnap@googlegroups.com">contact support</a> if the problem persists.</p>
          <button onClick={() => window.location.assign("/")}>Return to Home Page</button>
        </main>
      </div>
    );
  }
}

export default ErrorBoundary;
