import React from 'react';
import { createRoot } from 'react-dom/client';
import { FirebaseProvider } from '@/contexts/firebase';
import { App } from './App';
import '@/styles/palette.css';
import '@/styles/colors.css';
import '@/styles/utils.css';
import './index.css';
import { CurrentUserProvider } from '@/contexts/current-user';
import ErrorBoundary from '@/components/organisms/ErrorBoundary';
const node = document.getElementById('root');
if (!node) throw new Error('Root node not found!');

const root = createRoot(node);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <FirebaseProvider>
        <CurrentUserProvider>
          <App />
        </CurrentUserProvider>
      </FirebaseProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
