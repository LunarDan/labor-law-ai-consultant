<template>
  <aside class="sidebar">
    <nav class="nav-menu">
      <router-link to="/" class="nav-item" active-class="active">
        <span class="nav-icon">🤖</span>
        <span class="nav-text">AI咨询</span>
      </router-link>
      <router-link to="/contract" class="nav-item" active-class="active">
        <span class="nav-icon">📄</span>
        <span class="nav-text">合同审查</span>
      </router-link>
      <router-link to="/knowledge" class="nav-item" active-class="active">
        <span class="nav-icon">📚</span>
        <span class="nav-text">知识库</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup lang="ts">
// 侧边栏导航组件
</script>

<style scoped lang="scss">
.sidebar {
  width: 200px;
  background: white;
  box-shadow: 2px 0 4px rgba(0,0,0,0.1);
  padding: 1rem;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 5px;
  color: #666;
  text-decoration: none;
  transition: all 0.3s;
  
  &:hover {
    background: #f0f0f0;
    color: #667eea;
  }
  
  &.active {
    background: #667eea;
    color: white;
  }
}

.nav-icon {
  font-size: 1.5rem;
}

.nav-text {
  font-size: 1rem;
}
</style>

