import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const node = document.getElementById('root');
if (!node) throw new Error('Root node not found!');

const root = createRoot(node);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
