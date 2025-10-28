<template>
  <div class="home-container">
    <Header />
    <div class="main-content">
      <Sidebar />
      <div class="content-area">
        <!-- AI咨询、合同审查、知识库 -->
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/Layout/Header.vue'
import Sidebar from '@/components/Layout/Sidebar.vue'
</script>

<style scoped lang="scss">
.home-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  display: flex;
  flex: 1;
}

.content-area {
  flex: 1;
  padding: 2rem;
}
</style>