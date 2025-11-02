<template>
  <div class="login-before-container">
    <el-card class="selection-box" shadow="hover">
      <template #header>
        <div class="card-header">
          <h1 class="title">请选择您要登录的身份</h1>
        </div>
      </template>

      <div class="button-row">
        <el-button type="primary" size="large" class="user-type-btn" @click="selectUserType('1')">
          <el-icon :size="20" style="margin-right: 8px">
            <component :is="UserIcon" />
          </el-icon>
          个人用户
        </el-button>

        <el-button
          type="primary"
          size="large"
          plain
          class="user-type-btn"
          @click="selectUserType('2')"
        >
          <el-icon :size="20" style="margin-right: 8px">
            <component :is="OfficeBuildingIcon" />
          </el-icon>
          企业账号
        </el-button>
      </div>
    </el-card>

    <footer class="login-footer">
      <div class="container">
        <p>
          <a href="javascript:;">关于我们</a>
          <a href="javascript:;">帮助中心</a>
          <a href="javascript:;">商务合作</a>
          <a href="javascript:;">搜索推荐</a>
          <a href="javascript:;">友情链接</a>
        </p>
        <p>CopyRight &copy;AI劳动法</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import { useRouter } from 'vue-router'
import type { UserType } from '@/types'
import { User, OfficeBuilding } from '@element-plus/icons-vue'

const router = useRouter()

//优化图标性能
const UserIcon = markRaw(User)
const OfficeBuildingIcon = markRaw(OfficeBuilding)

const selectUserType = (type: UserType) => {
  // 跳转到登录页，并传递用户类型参数
  router.push({
    path: '/login',
    query: { type },
  })
}
</script>

<style scoped lang="scss">
.login-before-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: calc(100vh - 60px);
  padding: 2rem 1rem;
  background: url('@/assets/images/login-bg.png') no-repeat center center;
  background-size: cover;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 30, 60, 0.3);
    z-index: 0;
  }
}

.selection-box {
  width: 100%;
  max-width: 480px;
  margin: auto;
  position: relative;
  z-index: 1;

  :deep(.el-card__header) {
    padding: 2rem 2rem 1rem;
    border-bottom: none;
  }

  :deep(.el-card__body) {
    padding: 1rem 2rem 2.5rem;
  }
}

.card-header {
  text-align: center;
}

.title {
  margin: 0;
  color: #333;
  font-size: 1.4rem;
  font-weight: 500;
}

.button-row {
  display: flex;
  gap: 16px;
  width: 100%;
}

.user-type-btn {
  flex: 1;
  height: 56px;
  font-size: 1.05rem;
  font-weight: 500;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  }
}

.login-footer {
  margin-top: auto;
  padding: 30px 0 50px;
  background: transparent;
  position: relative;
  z-index: 1;

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  p {
    text-align: center;
    color: rgba(255, 255, 255, 0.9);
    padding-top: 20px;
    font-size: 0.9rem;

    a {
      line-height: 1;
      padding: 0 12px;
      color: rgba(255, 255, 255, 0.85);
      display: inline-block;
      text-decoration: none;
      transition: all 0.3s ease;

      ~ a {
        border-left: 1px solid rgba(255, 255, 255, 0.4);
      }

      &:hover {
        color: white;
        text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
      }
    }
  }
}
</style>
