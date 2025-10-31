<template>
  <div id="app">
    <Header />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import Header from '@/views/Layout/Header.vue'
</script>

<style>
/* 全局样式在 main.scss 中定义 */
</style>
