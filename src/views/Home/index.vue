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

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 个人用户常见问题分类
const personalCategories = [
  {
    id: 'p1',
    label: '工资薪酬',
    children: [
      {
        id: 'p1-1',
        label: '公司拖欠工资怎么办？',
        content: '公司拖欠工资已经两个月了，我该如何维权？',
      },
      {
        id: 'p1-1',
        label: '公司拖欠工资怎么办？',
        content: '公司拖欠工资已经两个月了，我该如何维权？',
      },
      {
        id: 'p1-1',
        label: '公司拖欠工资怎么办？',
        content: '公司拖欠工资已经两个月了，我该如何维权？',
      },
      {
        id: 'p1-1',
        label: '公司拖欠工资怎么办？',
        content: '公司拖欠工资已经两个月了，我该如何维权？',
      },
    ],
  },
  {
    id: 'p2',
    label: '工作时间',
    children: [
      {
        id: 'p2-1',
        label: '996工作制合法吗？',
        content: '公司要求996工作制，这是否符合劳动法规定？',
      },
      {
        id: 'p2-1',
        label: '996工作制合法吗？',
        content: '公司要求996工作制，这是否符合劳动法规定？',
      },
      {
        id: 'p2-1',
        label: '996工作制合法吗？',
        content: '公司要求996工作制，这是否符合劳动法规定？',
      },
      {
        id: 'p2-1',
        label: '996工作制合法吗？',
        content: '公司要求996工作制，这是否符合劳动法规定？',
      },
    ],
  },
  {
    id: 'p3',
    label: '劳动合同',
    children: [
      {
        id: 'p3-1',
        label: '试用期相关问题',
        content: '试用期的期限有什么规定？试用期可以随意辞退吗？',
      },
      {
        id: 'p3-1',
        label: '试用期相关问题',
        content: '试用期的期限有什么规定？试用期可以随意辞退吗？',
      },
      {
        id: 'p3-1',
        label: '试用期相关问题',
        content: '试用期的期限有什么规定？试用期可以随意辞退吗？',
      },
      {
        id: 'p3-1',
        label: '试用期相关问题',
        content: '试用期的期限有什么规定？试用期可以随意辞退吗？',
      },
    ],
  },
  {
    id: 'p4',
    label: '解除终止',
    children: [
      {
        id: 'p4-1',
        label: '公司违法解除合同',
        content: '公司违法解除劳动合同，我能获得什么赔偿？',
      },
      {
        id: 'p4-1',
        label: '公司违法解除合同',
        content: '公司违法解除劳动合同，我能获得什么赔偿？',
      },
      {
        id: 'p4-1',
        label: '公司违法解除合同',
        content: '公司违法解除劳动合同，我能获得什么赔偿？',
      },
      {
        id: 'p4-1',
        label: '公司违法解除合同',
        content: '公司违法解除劳动合同，我能获得什么赔偿？',
      },
    ],
  },
  {
    id: 'p5',
    label: '社会保险',
    children: [
      { id: 'p5-1', label: '社保缴纳基数', content: '公司按最低标准缴纳社保是否违法？' },
      { id: 'p5-1', label: '社保缴纳基数', content: '公司按最低标准缴纳社保是否违法？' },
      { id: 'p5-1', label: '社保缴纳基数', content: '公司按最低标准缴纳社保是否违法？' },
      { id: 'p5-1', label: '社保缴纳基数', content: '公司按最低标准缴纳社保是否违法？' },
    ],
  },
  {
    id: 'p6',
    label: '特殊情形',
    children: [
      {
        id: 'p6-1',
        label: '工伤认定标准',
        content: '什么情况下可以认定为工伤？如何申请工伤认定？',
      },
      {
        id: 'p6-1',
        label: '工伤认定标准',
        content: '什么情况下可以认定为工伤？如何申请工伤认定？',
      },
      {
        id: 'p6-1',
        label: '工伤认定标准',
        content: '什么情况下可以认定为工伤？如何申请工伤认定？',
      },
      {
        id: 'p6-1',
        label: '工伤认定标准',
        content: '什么情况下可以认定为工伤？如何申请工伤认定？',
      },
    ],
  },
  {
    id: 'p7',
    label: '劳动争议处理',
    children: [
      { id: 'p7-1', label: '劳动仲裁流程', content: '如何申请劳动仲裁？需要准备哪些材料？' },
      { id: 'p7-1', label: '劳动仲裁流程', content: '如何申请劳动仲裁？需要准备哪些材料？' },
      { id: 'p7-1', label: '劳动仲裁流程', content: '如何申请劳动仲裁？需要准备哪些材料？' },
      { id: 'p7-1', label: '劳动仲裁流程', content: '如何申请劳动仲裁？需要准备哪些材料？' },
    ],
  },
]

// 企业用户常见问题分类
const enterpriseCategories = [
  {
    id: 'e1',
    label: '招聘录用',
    children: [
      { id: 'e1-1', label: '招聘广告注意事项', content: '发布招聘信息时有哪些法律禁区需要避免？' },
      { id: 'e1-1', label: '招聘广告注意事项', content: '发布招聘信息时有哪些法律禁区需要避免？' },
      { id: 'e1-1', label: '招聘广告注意事项', content: '发布招聘信息时有哪些法律禁区需要避免？' },
      { id: 'e1-1', label: '招聘广告注意事项', content: '发布招聘信息时有哪些法律禁区需要避免？' },
    ],
  },
  {
    id: 'e2',
    label: '劳动合同管理',
    children: [
      { id: 'e2-1', label: '试用期约定规范', content: '试用期期限和工资标准有哪些法律规定？' },
      { id: 'e2-1', label: '试用期约定规范', content: '试用期期限和工资标准有哪些法律规定？' },
      { id: 'e2-1', label: '试用期约定规范', content: '试用期期限和工资标准有哪些法律规定？' },
      { id: 'e2-1', label: '试用期约定规范', content: '试用期期限和工资标准有哪些法律规定？' },
    ],
  },
  {
    id: 'e3',
    label: '薪酬福利管理',
    children: [
      { id: 'e3-1', label: '工资结构设计', content: '如何设计合理的工资结构以降低用工成本？' },
      { id: 'e3-1', label: '工资结构设计', content: '如何设计合理的工资结构以降低用工成本？' },
      { id: 'e3-1', label: '工资结构设计', content: '如何设计合理的工资结构以降低用工成本？' },
      { id: 'e3-1', label: '工资结构设计', content: '如何设计合理的工资结构以降低用工成本？' },
    ],
  },
  {
    id: 'e4',
    label: '工时休假管理',
    children: [
      { id: 'e4-1', label: '加班管理制度', content: '如何合法合规地安排员工加班？' },
      { id: 'e4-1', label: '加班管理制度', content: '如何合法合规地安排员工加班？' },
      { id: 'e4-1', label: '加班管理制度', content: '如何合法合规地安排员工加班？' },
      { id: 'e4-1', label: '加班管理制度', content: '如何合法合规地安排员工加班？' },
    ],
  },
  {
    id: 'e5',
    label: '解除终止管理',
    children: [
      { id: 'e5-1', label: '合法解除情形', content: '企业在哪些情况下可以合法解除劳动合同？' },
      { id: 'e5-1', label: '合法解除情形', content: '企业在哪些情况下可以合法解除劳动合同？' },
      { id: 'e5-1', label: '合法解除情形', content: '企业在哪些情况下可以合法解除劳动合同？' },
      { id: 'e5-1', label: '合法解除情形', content: '企业在哪些情况下可以合法解除劳动合同？' },
    ],
  },
  {
    id: 'e6',
    label: '社会保险管理',
    children: [
      { id: 'e6-1', label: '社保缴纳义务', content: '企业必须为哪些员工缴纳社保？基数如何确定？' },
      { id: 'e6-1', label: '社保缴纳义务', content: '企业必须为哪些员工缴纳社保？基数如何确定？' },
      { id: 'e6-1', label: '社保缴纳义务', content: '企业必须为哪些员工缴纳社保？基数如何确定？' },
      { id: 'e6-1', label: '社保缴纳义务', content: '企业必须为哪些员工缴纳社保？基数如何确定？' },
    ],
  },
  {
    id: 'e7',
    label: '特殊情形',
    children: [
      { id: 'e7-1', label: '三期员工管理', content: '孕期、产期、哺乳期女职工管理注意事项？' },
      { id: 'e7-1', label: '三期员工管理', content: '孕期、产期、哺乳期女职工管理注意事项？' },
      { id: 'e7-1', label: '三期员工管理', content: '孕期、产期、哺乳期女职工管理注意事项？' },
      { id: 'e7-1', label: '三期员工管理', content: '孕期、产期、哺乳期女职工管理注意事项？' },
    ],
  },
  {
    id: 'e8',
    label: '劳动争议预防',
    children: [
      { id: 'e8-1', label: '规章制度制定', content: '企业规章制度如何制定才具有法律效力？' },
      { id: 'e8-1', label: '规章制度制定', content: '企业规章制度如何制定才具有法律效力？' },
      { id: 'e8-1', label: '规章制度制定', content: '企业规章制度如何制定才具有法律效力？' },
      { id: 'e8-1', label: '规章制度制定', content: '企业规章制度如何制定才具有法律效力？' },
    ],
  },
]

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
  // 优先使用API数据
  if (apiCategories.value.length > 0) {
    return apiCategories.value
  }
  // 降级使用硬编码数据
  return authStore.userType === '2' ? enterpriseCategories : personalCategories
})

// 从API加载分类数据
const loadCategories = async () => {
  try {
    loading.value = true
    const userType = authStore.userType === '2' ? 2 : 1
    const data = await getSecondaryQuestionTitles(userType)

    if (data && data.length > 0) {
      apiCategories.value = transformApiData(data)
      console.log('✅ 成功加载API分类数据，分类数量:', apiCategories.value.length)
    } else {
      console.log('⚠️ API返回空数据，使用本地默认数据')
    }
  } catch (error) {
    console.error('❌ 加载分类数据失败:', error)
    // 失败时静默降级，使用硬编码数据
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
