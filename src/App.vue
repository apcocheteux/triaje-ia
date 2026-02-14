<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand">
        <div class="brand-mark">
          <img :src="ueHeaderLogo" alt="Universidad Europea" class="brand-mark-logo" />
        </div>
        <div>
          <div class="brand-title">
            TR<span class="brand-title-accent">IA</span>JE
          </div>
          <div class="brand-subtitle">Asistente académico de triaje enfermero</div>
        </div>
      </div>
      <nav class="nav">
        <RouterLink to="/" class="nav-link">Inicio</RouterLink>
        <RouterLink to="/cola" class="nav-link">Cola</RouterLink>
        <RouterLink to="/paciente/nuevo" class="nav-link">Nuevo</RouterLink>
        <RouterLink to="/exportacion" class="nav-link">Exportación</RouterLink>
        <RouterLink to="/configuracion" class="nav-link">Configuración</RouterLink>
        <RouterLink to="/fuentes" class="nav-link">Fuentes</RouterLink>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <footer class="app-footer">
      <span>Uso académico. No sustituye el juicio clínico ni protocolos del centro.</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import ueHeaderLogo from './assets/ue-logo-new.svg'
</script>
