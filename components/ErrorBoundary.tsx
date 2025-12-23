
import React, { Component, ErrorInfo, ReactNode } from "react";
import { ExclamationTriangleIcon } from "./Icons";

// Define Props interface for the ErrorBoundary.
interface Props {
  children?: ReactNode;
}

// Define State interface for the ErrorBoundary.
interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary class component to catch rendering errors in its child tree.
 */
// Fix: Use direct Component import and class property initialization to resolve TypeScript inheritance errors (Property 'state', 'setState', 'props' not found).
class ErrorBoundary extends Component<Props, State> {
  // Initialize state directly as a property to ensure TypeScript correctly identifies it as part of the component instance.
  public state: State = {
    hasError: false,
    error: null,
  };

  // Standard React Error Boundary static method to update state when an error occurs.
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Log error details using ErrorInfo type for debugging purposes.
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  // Reset state to allow the UI to recover from the error state.
  private handleRetry = () => {
    // Fix: Direct Component inheritance ensures setState is correctly typed and accessible on 'this'.
    this.setState({ hasError: false, error: null });
  };

  public render() {
    // Fix: Access state and props via direct inheritance from Component.
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-surface rounded-lg border border-white/10">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Algo deu errado nesta tela.</h2>
          <p className="text-text-secondary mb-6 max-w-md">
            Ocorreu um erro inesperado ao carregar este componente. Isso pode ser devido a uma configuração de API ausente ou erro de conexão.
          </p>
          <div className="bg-black/30 p-4 rounded-md text-left mb-6 w-full max-w-lg overflow-auto">
             <p className="text-red-400 font-mono text-xs">{this.state.error?.toString()}</p>
          </div>
          <button
            onClick={this.handleRetry}
            className="bg-primary text-white px-6 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    // Return children from props when no error state is active.
    return this.props.children;
  }
}

export default ErrorBoundary;
