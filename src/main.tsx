import React from 'react';
import { createRoot } from 'react-dom/client';
import { FirebaseProvider } from '@/contexts/firebase';
import { App } from './App';
import './styles/colors.css';
import './index.css';
import { CurrentUserProvider } from './contexts/current-user';
const node = document.getElementById('root');
if (!node) throw new Error('Root node not found!');

const root = createRoot(node);
root.render(
  <React.StrictMode>
    <FirebaseProvider>
      <CurrentUserProvider>
        <App />
      </CurrentUserProvider>
    </FirebaseProvider>
  </React.StrictMode>
);
