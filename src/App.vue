<template>
  <div id="app">
    <Header v-if="!isAuthPage" />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/views/Layout/Header.vue'

const route = useRoute()

// 判断是否为认证类页面（登录/忘记密码）
const isAuthPage = computed(() => route.meta.authPage === true)
</script>

<style>
/* 全局样式在 main.scss 中定义 */
</style>
