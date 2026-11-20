import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App, AppProviders } from './App';

createRoot(document.getElementById('root')!).render(
    <AppProviders>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppProviders>,
);
