import { defineConfig } from 'vitest/config';

// Define la configuración de Vite/Vitest para este subproyecto, centrándose en 
// la resolución de dependencias hoisted para el entorno de pruebas.
export default defineConfig({
  test: {
    // 1. Configuración de inclusión de tests
    include: ['tests/*.test.ts', 'tests/server.test.ts'], 
    
    // 2. Ejecutar en entorno Node puro
    environment: 'node', 
    
    // 3. Resolución de dependencias (CRUCIAL para monorepos)
    server: {
      deps: {
        inline: [
          '@modelcontextprotocol/sdk'
        ]
      }
    }
  },
  // AÑADIDO: Alias para forzar la resolución de la ruta del SDK, que está Hoisted.
  resolve: {
    alias: {
      // CORRECCIÓN: Apuntamos directamente a la carpeta 'dist/' dentro del módulo subido.
      '@modelcontextprotocol/sdk': '../../node_modules/@modelcontextprotocol/sdk'
    }
  }
});
