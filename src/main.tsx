import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/colors.css';
import './index.css';
import { FirebaseProvider } from '@/contexts/firebase';


const node = document.getElementById('root');
if (!node) throw new Error('Root node not found!');

const root = createRoot(node);
root.render(
  <React.StrictMode>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </React.StrictMode>
);
