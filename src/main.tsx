import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter, createRootRoute } from '@tanstack/react-router';
import { Route as IndexRoute } from './routes/index';

// Crear una ruta raíz simple que renderice el componente de index.tsx
const rootRoute = createRootRoute();

// Crear la jerarquía de rutas manual
const routeTree = rootRoute.addChildren([IndexRoute]);

// Crear el enrutador
const router = createRouter({ routeTree });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
