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
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import CategoryMenu from './components/CategoryMenu.vue'

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
        id: 'p1-2',
        label: '加班费如何计算？',
        content: '周末加班和平时加班的加班费计算标准是什么？',
      },
      { id: 'p1-3', label: '年终奖发放规定', content: '公司年终奖的发放有哪些法律规定？' },
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
      { id: 'p2-2', label: '调休和补休规定', content: '加班后的调休和补休有什么区别？' },
      { id: 'p2-3', label: '法定节假日加班', content: '法定节假日加班的工资应该如何支付？' },
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
      { id: 'p3-2', label: '合同续签注意事项', content: '劳动合同到期续签时需要注意哪些问题？' },
      {
        id: 'p3-3',
        label: '未签订劳动合同',
        content: '入职超过一个月公司未签订劳动合同，我有什么权利？',
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
      { id: 'p4-2', label: '主动离职流程', content: '我想主动离职，需要提前多久通知公司？' },
      { id: 'p4-3', label: '经济补偿金计算', content: '被公司辞退后，经济补偿金应该如何计算？' },
    ],
  },
  {
    id: 'p5',
    label: '社会保险',
    children: [
      { id: 'p5-1', label: '社保缴纳基数', content: '公司按最低标准缴纳社保是否违法？' },
      { id: 'p5-2', label: '公积金提取条件', content: '住房公积金有哪些提取条件和流程？' },
      { id: 'p5-3', label: '社保断缴影响', content: '社保断缴会有什么影响？如何补缴？' },
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
      { id: 'p6-2', label: '女职工权益保护', content: '孕期、产期、哺乳期女职工有哪些特殊保护？' },
      { id: 'p6-3', label: '职业病防护', content: '怀疑自己得了职业病，应该如何处理？' },
    ],
  },
  {
    id: 'p7',
    label: '劳动争议处理',
    children: [
      { id: 'p7-1', label: '劳动仲裁流程', content: '如何申请劳动仲裁？需要准备哪些材料？' },
      { id: 'p7-2', label: '证据收集方法', content: '劳动争议中常见的证据类型有哪些？如何收集？' },
      { id: 'p7-3', label: '诉讼时效规定', content: '劳动争议的仲裁时效是多久？过期了怎么办？' },
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
      { id: 'e1-2', label: '背景调查合规性', content: '企业对候选人进行背景调查需要注意什么？' },
      { id: 'e1-3', label: '录用通知书效力', content: '录用通知书发出后企业可以反悔吗？' },
    ],
  },
  {
    id: 'e2',
    label: '劳动合同管理',
    children: [
      { id: 'e2-1', label: '试用期约定规范', content: '试用期期限和工资标准有哪些法律规定？' },
      {
        id: 'e2-2',
        label: '合同条款设计',
        content: '劳动合同中哪些条款是必备的？如何设计合理条款？',
      },
      { id: 'e2-3', label: '无固定期限合同', content: '什么情况下必须签订无固定期限劳动合同？' },
    ],
  },
  {
    id: 'e3',
    label: '薪酬福利管理',
    children: [
      { id: 'e3-1', label: '工资结构设计', content: '如何设计合理的工资结构以降低用工成本？' },
      { id: 'e3-2', label: '绩效考核合规', content: '绩效考核制度设计需要注意哪些法律问题？' },
      { id: 'e3-3', label: '年终奖发放', content: '年终奖发放有哪些法律规定和风险点？' },
    ],
  },
  {
    id: 'e4',
    label: '工时休假管理',
    children: [
      { id: 'e4-1', label: '加班管理制度', content: '如何合法合规地安排员工加班？' },
      { id: 'e4-2', label: '年休假安排', content: '员工年休假应该如何计算和安排？' },
      { id: 'e4-3', label: '综合工时制申请', content: '什么企业可以申请综合工时制？如何申请？' },
    ],
  },
  {
    id: 'e5',
    label: '解除终止管理',
    children: [
      { id: 'e5-1', label: '合法解除情形', content: '企业在哪些情况下可以合法解除劳动合同？' },
      { id: 'e5-2', label: '经济补偿金支付', content: '哪些情况需要支付经济补偿金？如何计算？' },
      { id: 'e5-3', label: '裁员程序规范', content: '企业进行经济性裁员需要履行哪些程序？' },
    ],
  },
  {
    id: 'e6',
    label: '社会保险管理',
    children: [
      { id: 'e6-1', label: '社保缴纳义务', content: '企业必须为哪些员工缴纳社保？基数如何确定？' },
      { id: 'e6-2', label: '工伤保险处理', content: '员工发生工伤后，企业应该如何处理？' },
      { id: 'e6-3', label: '社保补缴风险', content: '社保未按时足额缴纳会面临什么法律风险？' },
    ],
  },
  {
    id: 'e7',
    label: '特殊情形',
    children: [
      { id: 'e7-1', label: '三期员工管理', content: '孕期、产期、哺乳期女职工管理注意事项？' },
      { id: 'e7-2', label: '竞业限制约定', content: '竞业限制协议应该如何约定才有效？' },
      { id: 'e7-3', label: '保密协议签订', content: '保密协议和竞业限制有什么区别？如何签订？' },
    ],
  },
  {
    id: 'e8',
    label: '劳动争议预防',
    children: [
      { id: 'e8-1', label: '规章制度制定', content: '企业规章制度如何制定才具有法律效力？' },
      { id: 'e8-2', label: '证据管理体系', content: '企业应该建立怎样的劳动用工证据管理体系？' },
      { id: 'e8-3', label: '合规风险自查', content: '企业劳动用工合规自查应该关注哪些方面？' },
    ],
  },
]

// 根据用户类型动态获取分类
const categories = computed(() => {
  // userType: '1' 个人用户, '2' 企业账号
  return authStore.userType === '2' ? enterpriseCategories : personalCategories
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
