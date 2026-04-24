import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// ✅ Initialiser le thème AVANT le démarrage
if (typeof document !== 'undefined' && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  const theme = localStorage.getItem('smartcity_theme') || 'dark';
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    document.body.classList.add('dark');
    document.body.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.body.classList.remove('dark');
    document.body.classList.add('light');
  }
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
