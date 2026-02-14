# TRIAJE

SPA académica para triaje enfermero con motor determinista (SET orientativo) y IA opcional (Gemini + OpenAI). Funciona 100% en frontend y guarda datos en `localStorage`.

## Requisitos
- Node.js 18+

## Desarrollo local
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Tests
```bash
npm run test
```

## Despliegue en GitHub Pages
El workflow de GitHub Actions ya está preparado. Solo necesitas:
1. Habilitar GitHub Pages en el repositorio (Source: GitHub Actions).
2. Asegurar que el nombre del repo coincide con el `base` de Vite.

El `base` se configura automáticamente en producción usando la variable `GITHUB_REPO` del workflow.

## IA opcional
- La API key se introduce en la pantalla de Configuración y se guarda en `localStorage`.
- La app funciona sin IA; la prioridad siempre se calcula de forma determinista.

## Aviso
Uso académico. No sustituye protocolos oficiales ni el juicio clínico.
