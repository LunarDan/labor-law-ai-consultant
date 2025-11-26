<template>
  <div class="home-container">
    <!-- 左侧常见问题分类，仅在AI咨询时显示 -->
    <div v-if="showSidebar" class="left-sidebar">
      <CategoryMenu :categories="categories" @select-question="onSelectQuestion" />
    </div>

    <!-- 右侧主体区域 -->
    <div class="right-content">
      <!-- Tab导航 -->
      <el-tabs v-model="activeTab" class="tabs" @tab-change="onTabChange">
        <el-tab-pane label="AI咨询" name="ai" />
        <el-tab-pane label="合同审查" name="contract" />
        <el-tab-pane label="知识库" name="kb" />
      </el-tabs>

      <!-- 子路由渲染区 -->
      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <keep-alive include="AiConsult">
            <component
              :is="Component"
              :selected-question="selectedQuestion"
              @question-sent="clearSelectedQuestion"
            />
          </keep-alive>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
// @ts-ignore: Vue SFC with script setup should auto-export
import CategoryMenu from './components/CategoryMenu.vue'
import { getSecondaryQuestionTitles } from '@/api/chat'
import type { SecondaryQuestionTitle } from '@/types'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 个人用户和企业用户的常见问题分类（从API动态加载）

// 存储从API获取的分类数据
const apiCategories = ref<any[]>([])
const loading = ref(false)

// 将API返回的二维数组转换为菜单需要的格式
const transformApiData = (data: SecondaryQuestionTitle[][]): any[] => {
  if (!data || data.length === 0) return []

  // 按 primaryTag 分组
  const groupMap = new Map<string, SecondaryQuestionTitle[]>()

  data.forEach((group) => {
    group.forEach((item) => {
      const tag = item.primaryTag
      if (!groupMap.has(tag)) {
        groupMap.set(tag, [])
      }
      groupMap.get(tag)!.push(item)
    })
  })

  // 转换为菜单格式
  const result: any[] = []
  let index = 0
  groupMap.forEach((items, tag) => {
    result.push({
      id: `cat-${index++}`,
      label: tag,
      children: items.map((item, idx) => ({
        id: `${tag}-${idx}`,
        label: item.title,
        content: item.title, // 用标题作为问题内容
      })),
    })
  })

  return result
}

// 根据用户类型动态获取分类
const categories = computed(() => {
  // 使用API数据，如果API加载失败则返回空数组
  return apiCategories.value
})

// 从API加载分类数据
const loadCategories = async () => {
  try {
    loading.value = true
    const userType = authStore.userType === '2' ? 2 : 1
    const data = await getSecondaryQuestionTitles(userType)

    if (data && data.length > 0) {
      apiCategories.value = transformApiData(data)
    }
  } catch (error) {
    // 加载失败，常见问题列表将为空
  } finally {
    loading.value = false
  }
}

// 处理从知识库跳转到AI咨询的事件
const handleSwitchToAIConsult = (event: CustomEvent) => {
  const { question } = event.detail
  if (question) {
    // 切换到AI咨询Tab
    router.push('/home/ai')
    // 设置选中的问题
    selectedQuestion.value = question
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadCategories()
  // 监听从知识库切换到AI咨询的事件
  window.addEventListener('switchToAIConsult', handleSwitchToAIConsult as EventListener)

  // 检查是否刚登录成功，如果是则显示欢迎消息
  const justLoggedIn = localStorage.getItem('justLoggedIn')
  if (justLoggedIn === 'true') {
    // 清除标志
    localStorage.removeItem('justLoggedIn')
    // 显示登录成功消息，持续2秒
    ElMessage({
      message: '登录成功，欢迎回来！',
      type: 'success',
      duration: 2000,
      showClose: true,
    })
  }
})

// 当前选中的问题内容
const selectedQuestion = ref<string>('')

// 当前激活的Tab
const activeTab = computed({
  get: () => {
    const pathParts = route.path.split('/')
    return pathParts[pathParts.length - 1] || 'ai'
  },
  set: () => {},
})

// 是否显示侧边栏（只在AI咨询时显示）
const showSidebar = computed(() => activeTab.value === 'ai')

// Tab切换处理
function onTabChange(name: string) {
  router.push(`/home/${name}`)
}

// 处理选中常见问题
function onSelectQuestion(content: string) {
  selectedQuestion.value = content
}

// 清空已选问题（当用户发送后）
function clearSelectedQuestion() {
  selectedQuestion.value = ''
}

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('switchToAIConsult', handleSwitchToAIConsult as EventListener)
})
</script>

<style scoped lang="scss">
.home-container {
  display: flex;
  height: calc(100vh - 60px);
  background: #f5f7fa;
  overflow: hidden;
}

.left-sidebar {
  width: 280px;
  height: 100%;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  flex-shrink: 0;
  overflow: hidden;
}

.right-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .tabs {
    padding: 0 20px;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;

    :deep(.el-tabs__header) {
      margin: 0;
    }

    :deep(.el-tabs__nav) {
      width: 100%;
      display: flex;
    }

    :deep(.el-tabs__item) {
      flex: 1;
      text-align: center;
      justify-content: center;
      font-size: 15px;
      font-weight: 500;
    }

    :deep(.el-tabs__active-bar) {
      display: none;
    }

    :deep(.el-tabs__item.is-active) {
      color: #409eff;
      background-color: #ecf5ff;
      border-bottom: 3px solid #409eff;
    }
  }

  .content-wrapper {
    flex: 1;
    overflow: auto;
    padding: 16px 20px;
  }
}
</style>
