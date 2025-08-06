import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // Optionally log error to an external service here
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-base-200">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Something went wrong.</h1>
          <pre className="mb-4 text-sm text-gray-500 max-w-xl overflow-x-auto">
            {this.state.error && this.state.error.toString()}
            {this.state.errorInfo && <div>{this.state.errorInfo.componentStack}</div>}
          </pre>
          <button className="btn btn-primary" onClick={this.handleReload}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary; 