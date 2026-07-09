/**
 * Configuración de Firebase para la sincronización (opcional). Sin estas
 * variables, la app funciona 100% local. Se ponen en `.env.local` (desarrollo)
 * y en las variables de entorno de Netlify (producción). Los valores de Firebase
 * son públicos por diseño (van en el cliente); la seguridad la dan las reglas de
 * Firestore y la clave de hogar.
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** ¿Está la sincronización configurada (hay credenciales de Firebase)? */
export const isSyncConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
);
