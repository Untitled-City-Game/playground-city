import AppRouter from '@/src/site/AppRouter';
import ErrorDialog from '@/src/site/errorHandling/ErrorDialog';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
let container = document.getElementById("app")!;
let root = createRoot(container)
root.render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorDialog}>
      <AppRouter />
    </ErrorBoundary>
  </StrictMode>
);
