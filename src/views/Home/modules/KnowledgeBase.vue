<template>
  <div class="knowledge-base">
    <!-- 主体内容 -->
    <div class="content-wrapper">
      <!-- 左侧导航栏 -->
      <div class="sidebar">
        <div class="nav-section">
          <div class="nav-title">导航</div>

          <!-- 法律法规 -->
          <div class="nav-category">
            <div
              class="category-header"
              :class="{ active: currentCategory === 'laws' }"
              @click="selectCategory('laws')"
            >
              <span>法律法规</span>
              <el-icon class="toggle-icon">
                <component :is="currentCategory === 'laws' ? ArrowUpIcon : ArrowDownIcon" />
              </el-icon>
            </div>
            <div v-if="currentCategory === 'laws'" class="sub-categories">
              <!-- 一级分类：国家法律、行政法规等 -->
              <div
                v-for="primaryCat in lawPrimaryCategories"
                :key="primaryCat.id"
                class="primary-category"
              >
                <div class="primary-category-header" @click="togglePrimaryCategory(primaryCat.id)">
                  <el-icon class="expand-icon">
                    <component :is="primaryCat.expanded ? MinusIcon : PlusIcon" />
                  </el-icon>
                  <span class="primary-category-title">{{ primaryCat.name }}</span>
                </div>
                <!-- 二级标题：具体法律法规 -->
                <div v-if="primaryCat.expanded" class="secondary-categories">
                  <div
                    v-for="law in primaryCat.laws"
                    :key="law.id"
                    class="law-item"
                    :class="{ selected: selectedLawIds.includes(law.id) }"
                  >
                    <el-icon class="law-toggle-icon" @click.stop="toggleLawDisplay(law.id)">
                      <component :is="selectedLawIds.includes(law.id) ? MinusIcon : PlusIcon" />
                    </el-icon>
                    <span class="law-name" @click="toggleLawDisplay(law.id)">
                      {{ law.name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 常见场景 -->
          <div class="nav-category">
            <div
              class="category-header"
              :class="{ active: currentCategory === 'scenarios' }"
              @click="selectCategory('scenarios')"
            >
              <span>常见场景</span>
              <el-icon class="toggle-icon">
                <component :is="currentCategory === 'scenarios' ? ArrowUpIcon : ArrowDownIcon" />
              </el-icon>
            </div>
            <div v-if="currentCategory === 'scenarios'" class="sub-categories">
              <div
                v-for="scenario in scenarioSubCategories"
                :key="scenario.id"
                class="sub-category-item"
                :class="{ active: currentSubCategory === scenario.id }"
                @click="selectScenario(scenario)"
              >
                <span class="scenario-label">{{ scenario.label }}</span>
              </div>
            </div>
          </div>

          <!-- 热点专题 -->
          <div class="nav-category">
            <div
              class="category-header"
              :class="{ active: currentCategory === 'topics' }"
              @click="selectCategory('topics')"
            >
              <span>热点专题</span>
              <el-icon class="toggle-icon">
                <component :is="currentCategory === 'topics' ? ArrowUpIcon : ArrowDownIcon" />
              </el-icon>
            </div>
            <div v-if="currentCategory === 'topics'" class="sub-categories">
              <div
                v-for="topic in topicSubCategories"
                :key="topic.id"
                class="sub-category-item hot-topic-item"
                :class="{ active: currentSubCategory === topic.id }"
                @click="selectTopic(topic)"
              >
                <span class="topic-label">{{ topic.label }}</span>
                <el-icon class="hot-icon"><component :is="StarFilledIcon" /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="main-content">
        <!-- 顶部搜索栏 -->
        <div class="header">
          <div class="search-container">
            <div class="search-wrapper">
              <el-input
                v-model="searchKeyword"
                placeholder="请输入关键词"
                size="large"
                class="search-input"
                @keyup.enter="handleSearch"
                @focus="showSearchHistory = true"
                @blur="handleSearchBlur"
              >
                <template #prefix>
                  <el-icon><component :is="SearchIcon" /></el-icon>
                </template>
              </el-input>
              <!-- 历史搜索下拉框 -->
              <div
                v-if="showSearchHistory && searchHistoryList.length > 0"
                class="search-history-dropdown"
              >
                <div class="history-header">
                  <el-icon><component :is="ClockIcon" /></el-icon>
                  <span>历史搜索</span>
                </div>
                <div class="history-list">
                  <div v-for="(item, index) in searchHistoryList" :key="index" class="history-item">
                    <span class="history-text" @click="selectHistoryItem(item)">{{ item }}</span>
                    <el-icon class="delete-icon" @click.stop="confirmDeleteHistory(item)">
                      <component :is="DeleteIcon" />
                    </el-icon>
                  </div>
                </div>
              </div>
            </div>
            <el-button
              type="primary"
              size="large"
              class="search-btn"
              :disabled="!searchKeyword.trim()"
              @click="handleSearch"
            >
              搜索
            </el-button>
          </div>
          <div class="header-actions">
            <el-button size="large" @click="showFavorites">
              <el-icon><component :is="StarIcon" /></el-icon>
              我的收藏
              <span
                v-if="favoriteCount > 0"
                style="color: #909399; font-size: 12px; margin-left: 4px"
              >
                ({{ favoriteCount }})
              </span>
            </el-button>
          </div>
        </div>

        <!-- 推荐文本 -->
        <div v-if="recommendationText" class="recommendation-text">
          {{ recommendationText }}
        </div>

        <!-- 搜索结果统计 -->
        <div v-if="searchKeyword && articles.length > 0" class="search-result-info">
          找到 <span class="result-count">{{ articles.length }}</span> 条相关法条
        </div>

        <!-- 法条列表 -->
        <div v-if="!loading && articles.length > 0" class="articles-wrapper">
          <!-- 当前显示的条款编号 -->
          <div class="article-indicator">
            第 {{ currentArticleNumber }} 条
            <el-button v-if="showBackButton" type="primary" link @click="backToPrevious">
              <el-icon><component :is="BackIcon" /></el-icon>
              返回
            </el-button>
          </div>

          <el-scrollbar ref="scrollbarRef" class="articles-container" @scroll="handleScroll">
            <div
              v-for="(article, index) in articles"
              :id="'article-' + article.id"
              :key="article.id"
              :ref="(el) => setArticleRef(el, index)"
              class="article-item"
            >
              <!-- 法条标题 -->
              <div class="article-header">
                <h3 class="article-title">{{ article.lawName }} {{ article.articleNumber }}</h3>
                <div class="article-actions">
                  <el-button
                    :type="article.isFavorite ? 'warning' : 'default'"
                    text
                    @click="toggleFavoriteArticle(article)"
                  >
                    <el-icon :color="article.isFavorite ? '#F7BA2A' : '#909399'">
                      <component :is="StarFilledIcon" />
                    </el-icon>
                    收藏
                  </el-button>
                  <el-button type="default" text @click="copyArticle(article)">
                    <el-icon><component :is="CopyIcon" /></el-icon>
                    复制
                  </el-button>
                </div>
              </div>

              <!-- 原文 -->
              <div class="article-section">
                <h4 class="section-title">【原文】</h4>
                <div class="section-content">{{ article.content }}</div>
              </div>

              <!-- 释义（仅当有内容时显示） -->
              <div
                v-if="article.interpretation && article.interpretation.trim()"
                class="article-section"
              >
                <h4 class="section-title">【释义】</h4>
                <div class="section-content">{{ article.interpretation }}</div>
              </div>

              <!-- 关联法条 -->
              <div
                v-if="article.relatedArticles && article.relatedArticles.length > 0"
                class="article-section"
              >
                <h4 class="section-title">【关联法条】</h4>
                <div class="related-articles">
                  <div
                    v-for="related in article.relatedArticles"
                    :key="related.id"
                    class="related-article"
                    @click="jumpToArticle(related.id)"
                  >
                    {{ related.lawName }} {{ related.articleNumber }}：{{ related.title }}
                  </div>
                </div>
              </div>

              <!-- 相关案例 -->
              <div
                v-if="article.relatedCases && article.relatedCases.length > 0"
                class="article-section"
              >
                <h4 class="section-title">【相关案例】</h4>
                <div class="related-cases">
                  <a
                    v-for="(caseItem, caseIndex) in article.relatedCases"
                    :key="caseIndex"
                    :href="caseItem.url"
                    target="_blank"
                    class="related-case"
                  >
                    {{ caseItem.title }}
                  </a>
                </div>
              </div>

              <!-- 相关问题 -->
              <div
                v-if="article.relatedQuestions && article.relatedQuestions.length > 0"
                class="article-section"
              >
                <h4 class="section-title">【相关问题】</h4>
                <div class="related-questions">
                  <div
                    v-for="(question, qIndex) in article.relatedQuestions"
                    :key="qIndex"
                    class="related-question"
                    @click="askAI(question)"
                  >
                    {{ question }}
                  </div>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </div>

        <!-- 加载中 -->
        <div v-if="loading" class="loading-state">
          <el-icon :size="60" class="is-loading">
            <component :is="LoadingIcon" />
          </el-icon>
          <div class="loading-text">加载中...</div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && articles.length === 0" class="empty-state">
          <el-icon :size="60" class="empty-icon">
            <component :is="DocumentIcon" />
          </el-icon>
          <div class="empty-title">暂无数据</div>
          <div class="empty-subtitle">请选择分类或搜索关键词</div>
        </div>
      </div>
    </div>

    <!-- 我的收藏弹窗 -->
    <el-dialog
      v-model="favoritesDialogVisible"
      title="我的收藏"
      width="900px"
      :close-on-click-modal="false"
      class="favorites-dialog"
    >
      <el-scrollbar height="600px">
        <div v-if="favoriteArticles.length === 0" class="empty-favorites">
          <el-icon :size="60" color="#c0c4cc">
            <component :is="StarIcon" />
          </el-icon>
          <div class="empty-text">暂无收藏</div>
        </div>
        <div v-else class="favorites-list">
          <div
            v-for="article in favoriteArticles"
            :key="article.id"
            class="favorite-item"
            @click="loadArticleFromFavorite(article)"
          >
            <div class="favorite-title">{{ article.lawName }} {{ article.articleNumber }}</div>
            <div class="favorite-content">{{ article.title }}</div>
            <el-button
              type="danger"
              text
              class="remove-favorite"
              @click.stop="toggleFavoriteArticle(article)"
            >
              <el-icon><component :is="DeleteIcon" /></el-icon>
              移除
            </el-button>
          </div>
        </div>
      </el-scrollbar>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, markRaw } from 'vue'
import {
  Search,
  Star,
  StarFilled,
  Document,
  Loading,
  CopyDocument,
  ArrowLeft,
  Delete,
  Plus,
  Minus,
  Clock,
  ArrowUp,
  ArrowDown,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  queryKnowledge,
  addFavorite,
  removeFavorite,
  getFavoriteList,
  getFavoriteCount,
  checkFavorite,
  getNationalLaws,
  getLocalLaws,
  getHotTopics,
  getCommonCases,
  getUserHistory,
  deleteUserHistory,
  type KnowledgeQueryRequest,
  type KnowledgeQueryResponseData,
  type KnowledgeRegulationItem,
  type UserFavoriteRegulation,
} from '@/api/knowledge'

// 使用 markRaw 优化图标
const SearchIcon = markRaw(Search)
const StarIcon = markRaw(Star)
const StarFilledIcon = markRaw(StarFilled)
const DocumentIcon = markRaw(Document)
const LoadingIcon = markRaw(Loading)
const CopyIcon = markRaw(CopyDocument)
const BackIcon = markRaw(ArrowLeft)
const DeleteIcon = markRaw(Delete)
const PlusIcon = markRaw(Plus)
const MinusIcon = markRaw(Minus)
const ClockIcon = markRaw(Clock)
const ArrowUpIcon = markRaw(ArrowUp)
const ArrowDownIcon = markRaw(ArrowDown)

// 定义类型
interface LawArticle {
  id: string
  regulationId?: number // 法律条款ID（用于收藏接口）
  lawName: string
  articleNumber: string
  title: string
  content: string
  interpretation: string
  relatedArticles: RelatedArticle[]
  relatedCases?: RelatedCase[]
  relatedQuestions: string[]
  category: string
  isFavorite?: boolean
}

interface RelatedArticle {
  id: string
  lawName: string
  articleNumber: string
  title: string
}

interface RelatedCase {
  title: string
  url: string
}

// 法律分类接口
interface LawItem {
  id: string
  name: string
  lawKey: string // 对应模拟数据中的lawName
  lawId?: number // 法律ID（从API获取）
  categoryType?: number // 分类类型
  regulations?: Array<{
    regulationId: number
    issueYear: string
    articleNumber: number
    originalText: string
  }> // 该法律下的所有条款
}

interface PrimaryCategory {
  id: string
  name: string
  expanded: boolean
  laws: LawItem[]
  categoryType?: number // 分类类型（1=国家法律）
}

// 数据
const searchKeyword = ref<string>('')
const currentCategory = ref<string>('laws')
const currentSubCategory = ref<string>('')
const articles = ref<LawArticle[]>([])
const loading = ref<boolean>(false)
const recommendationText = ref<string>('')
const currentArticleNumber = ref<string>('1')
const showBackButton = ref<boolean>(false)
const previousPosition = ref<{ articleId: string; scrollTop: number } | null>(null)
const scrollbarRef = ref()
const articleRefs = ref<HTMLElement[]>([])
const favoritesDialogVisible = ref<boolean>(false)
const favoriteArticles = ref<LawArticle[]>([])
const favoriteCount = ref<number>(0) // 收藏数量

// 搜索历史相关
const showSearchHistory = ref<boolean>(false)
const searchHistoryList = ref<string[]>([])
const searchResultCount = ref<number>(0)

// 法律法规的多级分类数据
const lawPrimaryCategories = ref<PrimaryCategory[]>([
  {
    id: 'national-law',
    name: '国家法律',
    expanded: false,
    laws: [
      {
        id: 'labor-law',
        name: '中华人民共和国劳动法',
        lawKey: '《中华人民共和国劳动法》',
      },
      {
        id: 'labor-contract-law',
        name: '中华人民共和国劳动合同法',
        lawKey: '《中华人民共和国劳动合同法》',
      },
      {
        id: 'social-insurance-law',
        name: '中华人民共和国社会保险法',
        lawKey: '《中华人民共和国社会保险法》',
      },
    ],
  },
  {
    id: 'administrative-regulation',
    name: '行政法规',
    expanded: false,
    laws: [
      {
        id: 'paid-leave-regulation',
        name: '职工带薪年休假条例',
        lawKey: '《职工带薪年休假条例》',
      },
      {
        id: 'work-injury-insurance',
        name: '工伤保险条例',
        lawKey: '《工伤保险条例》',
      },
    ],
  },
])

// 已选择显示的法律ID列表
const selectedLawIds = ref<string[]>([])

// 常见场景分类接口
interface ScenarioItem {
  id: string
  label: string
  relatedArticleIds: string[] // 关联的法条ID列表
}

// 常见场景（从API动态获取）
const scenarioSubCategories = ref<ScenarioItem[]>([
  // 默认数据，作为降级方案
  { id: 'scenario-1', label: '工资薪酬', relatedArticleIds: [] },
  { id: 'scenario-2', label: '工作时间', relatedArticleIds: [] },
  { id: 'scenario-3', label: '劳动合同', relatedArticleIds: [] },
  { id: 'scenario-4', label: '解除终止', relatedArticleIds: [] },
  { id: 'scenario-5', label: '社会保险', relatedArticleIds: [] },
  { id: 'scenario-6', label: '特殊情形', relatedArticleIds: [] },
  { id: 'scenario-7', label: '劳动争议处理', relatedArticleIds: [] },
])

// 热点专题（从API动态获取）
const topicSubCategories = ref<ScenarioItem[]>([
  // 默认数据，作为降级方案
  { id: 'topic-1', label: '996工作制争议', relatedArticleIds: ['1', '3', '4'] },
  { id: 'topic-2', label: '加班费计算与支付', relatedArticleIds: ['1', '2'] },
  { id: 'topic-3', label: '经济补偿金标准', relatedArticleIds: ['1', '2', '3'] },
  { id: 'topic-4', label: '竞业限制与补偿', relatedArticleIds: ['1', '4'] },
  { id: 'topic-5', label: '试用期权益保护', relatedArticleIds: ['1', '2', '4'] },
  { id: 'topic-6', label: '社保缴纳基数问题', relatedArticleIds: ['2', '4'] },
  { id: 'topic-7', label: '劳动合同解除赔偿', relatedArticleIds: ['1', '2', '3', '4'] },
  { id: 'topic-8', label: '年休假权益保障', relatedArticleIds: ['1', '3'] },
])

// 设置法条引用
function setArticleRef(el: any, index: number) {
  if (el) {
    articleRefs.value[index] = el
  }
}

/**
 * 将新API返回的数组数据转换为前端展示格式
 * 注意：响应拦截器已提取 data 字段，所以responseData直接是数组
 */
function convertNewApiDataToArticles(responseData: KnowledgeQueryResponseData): LawArticle[] {
  if (!responseData || !Array.isArray(responseData) || responseData.length === 0) {
    return []
  }

  return responseData.map((item: KnowledgeRegulationItem, index: number) => {
    // 将API返回的相关案例转换为前端格式
    const relatedCases =
      item.relevantCases?.map((caseItem) => ({
        title: caseItem.caseContent,
        url: caseItem.caseLink || '#',
      })) || []

    // 相关问题
    const relatedQuestions = item.relevantQuestions || []

    // 移除法律名称后的日期后缀，如"_20241206"
    const cleanLawName = item.lawName.replace(/_\d{8}$/, '')

    return {
      id: `article-${item.articleNumber}-${index}`,
      regulationId: undefined, // 新API暂不返回regulationId
      lawName: cleanLawName,
      articleNumber: `第${item.articleNumber}条`,
      title: `${cleanLawName} 第${item.articleNumber}条`,
      content: item.regulationContent,
      interpretation: item.aiTranslateContent,
      relatedArticles: [], // 新API暂不返回关联法条
      relatedCases: relatedCases,
      relatedQuestions: relatedQuestions,
      category: 'api', // 标记为来自API的数据
      isFavorite: false,
    }
  })
}

// 检查并更新文章的收藏状态
async function updateArticlesFavoriteStatus(articleList: LawArticle[]) {
  // 批量检查收藏状态
  for (const article of articleList) {
    if (article.regulationId) {
      try {
        const isFavorited = await checkFavorite(article.regulationId)
        article.isFavorite = isFavorited
      } catch (error) {
        console.error('检查收藏状态失败:', error)
      }
    }
  }
}

// 从 localStorage 加载收藏状态
function loadFavoritesFromStorage() {
  // 不再从localStorage加载收藏状态，改用API
  try {
    // 收藏状态现在通过API管理
  } catch (error) {
    console.error('加载收藏状态失败:', error)
  }
}

// 从API加载搜索历史
async function loadSearchHistory() {
  try {
    console.log('🔍 加载用户搜索历史...')
    const history = await getUserHistory()

    console.log('✅ 用户搜索历史加载成功:', history)

    if (history && Array.isArray(history) && history.length > 0) {
      searchHistoryList.value = history
      console.log('📝 搜索历史已更新:', searchHistoryList.value)
    } else {
      console.log('ℹ️ 暂无搜索历史')
      searchHistoryList.value = []
    }
  } catch (error) {
    console.error('❌ 加载搜索历史失败:', error)
    searchHistoryList.value = []
  }
}

// 添加搜索记录（前端暂时先更新本地状态，等搜索后API会自动记录）
function addSearchHistory(keyword: string) {
  // 去除重复项
  const index = searchHistoryList.value.indexOf(keyword)
  if (index > -1) {
    searchHistoryList.value.splice(index, 1)
  }

  // 添加到最前面
  searchHistoryList.value.unshift(keyword)

  // 最多保留10条（本地显示）
  if (searchHistoryList.value.length > 10) {
    searchHistoryList.value = searchHistoryList.value.slice(0, 10)
  }
}

// 选择历史搜索项
function selectHistoryItem(keyword: string) {
  searchKeyword.value = keyword
  showSearchHistory.value = false
  handleSearch()
}

// 搜索框失焦处理
function handleSearchBlur() {
  // 延迟隐藏，以便点击事件能够触发
  setTimeout(() => {
    showSearchHistory.value = false
  }, 200)
}

// 确认删除历史记录
async function confirmDeleteHistory(keyword: string) {
  try {
    await ElMessageBox.confirm('删除后不可恢复', '确认删除该历史搜索记录？', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })

    // 调用API删除记录
    try {
      await deleteUserHistory(keyword)

      // 删除成功后，更新前端显示
      const index = searchHistoryList.value.indexOf(keyword)
      if (index > -1) {
        searchHistoryList.value.splice(index, 1)
      }

      ElMessage.success('删除成功')
    } catch (error: any) {
      console.error('删除历史记录失败:', error)
      ElMessage.error(error.message || '删除失败，请稍后重试')
    }
  } catch {
    // 用户取消删除
  }
}

// 根据推荐的法条自动展开对应的导航
function autoExpandNavigationByArticles(recommendedArticles: LawArticle[]) {
  if (recommendedArticles.length === 0) return

  // 获取推荐法条的法律名称
  const lawNames = [...new Set(recommendedArticles.map((article) => article.lawName))]

  // 找到对应的法律并展开其一级分类
  lawPrimaryCategories.value.forEach((primaryCat) => {
    primaryCat.laws.forEach((law) => {
      if (lawNames.includes(law.lawKey)) {
        // 展开该一级分类
        primaryCat.expanded = true
        // 自动选中该法律
        if (!selectedLawIds.value.includes(law.id)) {
          selectedLawIds.value.push(law.id)
        }
      }
    })
  })
}

// 初始化加载推荐法条
async function loadRecommendations() {
  // 从本地存储获取最后一个咨询问题
  const lastQuestion = localStorage.getItem('lastConsultQuestion')

  // 使用历史问题或默认问题
  const queryQuestion = lastQuestion || '工伤认定'

  if (lastQuestion) {
    recommendationText.value = `根据您的问题"${lastQuestion}"为您推荐`
  } else {
    recommendationText.value = '为您推荐相关法律条文'
  }

  try {
    console.log('🔍 知识库加载推荐，问题:', queryQuestion)

    // 调用API查询相关法条
    const requestData: KnowledgeQueryRequest = {
      question: queryQuestion,
    }

    const response = await queryKnowledge(requestData)

    console.log('✅ API响应:', response)
    console.log('📊 响应数据类型:', typeof response, '是否为数组:', Array.isArray(response))

    // 注意：响应拦截器已经提取了 data 字段，response 直接就是数组
    if (response && Array.isArray(response) && response.length > 0) {
      // 转换API数据为法条数组
      const apiArticles = convertNewApiDataToArticles(response)

      console.log('📝 转换后的法条数量:', apiArticles.length)
      console.log('📝 转换后的法条数据:', apiArticles)

      if (apiArticles.length > 0) {
        articles.value = apiArticles

        // 更新收藏状态
        await updateArticlesFavoriteStatus(articles.value)

        // 根据推荐的法条自动展开导航
        autoExpandNavigationByArticles(apiArticles)
      } else {
        console.warn('⚠️ 转换后的法条数据为空')
        articles.value = []
      }
    } else {
      console.warn('⚠️ API响应失败或数据格式不正确:', response)
      articles.value = []
    }
  } catch (error) {
    console.error('❌ 加载推荐失败:', error)
    articles.value = []
  }

  // 初始化当前法条编号
  if (articles.value.length > 0) {
    const firstArticleNum = articles.value[0].articleNumber.match(/\d+/)
    if (firstArticleNum) {
      currentArticleNumber.value = firstArticleNum[0]
    }
  }
}

// 初始化
// 加载国家法规数据
async function loadNationalLaws() {
  try {
    console.log('🔍 加载国家法规数据...')
    const response = await getNationalLaws(1, 100) // 加载前100条

    if (response && response.content && response.content.length > 0) {
      console.log('✅ 国家法规数据加载成功:', response.content)
      console.log('📊 数据数量:', response.content.length)

      // 将API数据转换为导航栏格式
      // 每个法律作为一个导航项，点击后显示该法律下的所有条款
      const nationalLaws = response.content
        .filter((lawCategory) => lawCategory.categoryType === 1)
        .map((lawCategory) => ({
          id: `national-law-${lawCategory.lawId}`,
          name: lawCategory.lawName,
          lawKey: lawCategory.lawName,
          lawId: lawCategory.lawId,
          categoryType: lawCategory.categoryType,
          regulations: lawCategory.regulations, // 保存法规数据供后续使用
        }))

      console.log('📝 国家法律数量:', nationalLaws.length)

      return nationalLaws
    } else {
      console.warn('⚠️ 国家法规数据为空')
      return []
    }
  } catch (error) {
    console.error('❌ 加载国家法规失败:', error)
    return []
  }
}

// 加载地方法规数据
async function loadLocalLaws() {
  try {
    console.log('🔍 加载地方法规数据...')
    const response = await getLocalLaws(1, 100) // 加载前100条

    if (response && response.content && response.content.length > 0) {
      console.log('✅ 地方法规数据加载成功:', response.content)
      console.log('📊 数据数量:', response.content.length)

      // 将API数据转换为导航栏格式
      const localLaws = response.content
        .filter((lawCategory) => lawCategory.categoryType === 0)
        .map((lawCategory) => ({
          id: `local-law-${lawCategory.lawId}`,
          name: lawCategory.lawName,
          lawKey: lawCategory.lawName,
          lawId: lawCategory.lawId,
          categoryType: lawCategory.categoryType,
          regulations: lawCategory.regulations,
        }))

      console.log('📝 地方法规数量:', localLaws.length)

      return localLaws
    } else {
      console.warn('⚠️ 地方法规数据为空')
      return []
    }
  } catch (error) {
    console.error('❌ 加载地方法规失败:', error)
    return []
  }
}

// 加载所有法规数据
async function loadAllLaws() {
  const [nationalLaws, localLaws] = await Promise.all([loadNationalLaws(), loadLocalLaws()])

  const categorizedLaws: PrimaryCategory[] = []

  // 添加国家法律
  if (nationalLaws.length > 0) {
    categorizedLaws.push({
      id: 'national-law',
      name: '国家法律',
      expanded: false,
      laws: nationalLaws,
    })
  }

  // 添加地方法规
  if (localLaws.length > 0) {
    categorizedLaws.push({
      id: 'local-law',
      name: '地方法规',
      expanded: false,
      laws: localLaws,
    })
  }

  // 如果没有数据，使用默认数据
  if (categorizedLaws.length === 0) {
    console.warn('⚠️ 所有法规数据为空，使用默认数据')
    // 保持原有的硬编码数据
  } else {
    lawPrimaryCategories.value = categorizedLaws
    console.log('✅ 法规导航栏已更新:', lawPrimaryCategories.value)
  }
}

// 加载常见场景列表
async function loadCommonCases() {
  try {
    console.log('🔍 加载常见场景列表...')
    const cases = await getCommonCases()

    console.log('✅ 常见场景列表加载成功:', cases)

    if (cases && Array.isArray(cases) && cases.length > 0) {
      // 将字符串数组转换为 ScenarioItem 格式
      scenarioSubCategories.value = cases.map((caseItem, index) => ({
        id: `scenario-${index + 1}`,
        label: caseItem,
        relatedArticleIds: [], // API返回的是场景名称，不包含关联法条ID，所以留空
      }))

      console.log('📝 常见场景列表已更新:', scenarioSubCategories.value)
    } else {
      console.warn('⚠️ 常见场景列表为空，使用默认数据')
    }
  } catch (error) {
    console.error('❌ 加载常见场景列表失败:', error)
    // 保持默认数据
  }
}

// 加载热点专栏主题
async function loadHotTopics() {
  try {
    console.log('🔍 加载热点专栏主题...')
    const topics = await getHotTopics()

    console.log('✅ 热点专栏主题加载成功:', topics)

    if (topics && Array.isArray(topics) && topics.length > 0) {
      // 将字符串数组转换为 ScenarioItem 格式
      topicSubCategories.value = topics.map((topic, index) => ({
        id: `topic-${index + 1}`,
        label: topic,
        relatedArticleIds: [], // API返回的是专题名称，不包含关联法条ID，所以留空
      }))

      console.log('📝 热点专栏主题已更新:', topicSubCategories.value)
    } else {
      console.warn('⚠️ 热点专栏主题为空，使用默认数据')
    }
  } catch (error) {
    console.error('❌ 加载热点专栏主题失败:', error)
    // 保持默认数据
  }
}

onMounted(async () => {
  // 加载收藏状态
  loadFavoritesFromStorage()

  // 加载搜索历史
  loadSearchHistory()

  // 加载收藏数量
  loadFavoriteCount()

  // 加载所有法规（国家法律 + 地方法规）
  loadAllLaws()

  // 加载常见场景列表
  loadCommonCases()

  // 加载热点专栏主题
  loadHotTopics()

  loading.value = true

  try {
    await loadRecommendations()
  } catch (error) {
    console.error('初始化失败:', error)
  } finally {
    loading.value = false
  }
})

// 切换一级分类的展开/收起状态
function togglePrimaryCategory(categoryId: string) {
  const category = lawPrimaryCategories.value.find((cat) => cat.id === categoryId)
  if (category) {
    category.expanded = !category.expanded
  }
}

// 切换法律的显示/隐藏
function toggleLawDisplay(lawId: string) {
  const index = selectedLawIds.value.indexOf(lawId)

  if (index > -1) {
    // 已选中，移除
    selectedLawIds.value.splice(index, 1)
  } else {
    // 未选中，添加
    selectedLawIds.value.push(lawId)
  }

  // 更新右侧显示
  loadArticlesBySelectedLaws()
}

// 根据选中的法律加载法条
async function loadArticlesBySelectedLaws() {
  if (selectedLawIds.value.length === 0) {
    articles.value = []
    recommendationText.value = ''
    return
  }

  loading.value = true
  searchKeyword.value = '' // 清空搜索关键词
  showBackButton.value = false

  try {
    // 获取选中的法律及其条款数据
    const selectedLawsData: Array<{
      lawName: string
      regulations: Array<{
        regulationId: number
        issueYear: string
        articleNumber: number
        originalText: string
      }>
    }> = []

    lawPrimaryCategories.value.forEach((primaryCat) => {
      primaryCat.laws.forEach((law) => {
        if (selectedLawIds.value.includes(law.id) && law.regulations) {
          selectedLawsData.push({
            lawName: law.lawKey,
            regulations: law.regulations,
          })
        }
      })
    })

    console.log('📝 选中的法律数据:', selectedLawsData)

    // 将regulations转换为LawArticle格式
    const convertedArticles: LawArticle[] = []
    selectedLawsData.forEach((lawData) => {
      lawData.regulations.forEach((regulation, index) => {
        convertedArticles.push({
          id: `regulation-${regulation.regulationId}-${index}`,
          regulationId: regulation.regulationId,
          lawName: lawData.lawName,
          articleNumber: `第${regulation.articleNumber}条`,
          title: `${lawData.lawName} 第${regulation.articleNumber}条`,
          content: regulation.originalText,
          interpretation: '', // 国家法规列表不包含释义
          relatedArticles: [],
          relatedCases: [],
          relatedQuestions: [],
          category: 'national-law',
          isFavorite: false,
        })
      })
    })

    console.log('📝 转换后的法条数量:', convertedArticles.length)

    articles.value = convertedArticles
    recommendationText.value = ''

    // 更新当前法条编号
    if (articles.value.length > 0) {
      const firstArticleNum = articles.value[0].articleNumber.match(/\d+/)
      if (firstArticleNum) {
        currentArticleNumber.value = firstArticleNum[0]
      }
    }

    // 滚动到顶部
    await nextTick()
    scrollbarRef.value?.setScrollTop(0)
  } catch (error) {
    console.error('❌ 加载法条失败:', error)
    ElMessage.error('加载法条失败')
  } finally {
    loading.value = false
  }
}

// 选择分类（支持再次点击收起）
function selectCategory(category: string) {
  // 如果点击的是当前已展开的分类，则收起
  if (currentCategory.value === category) {
    currentCategory.value = ''
    currentSubCategory.value = ''
    showBackButton.value = false
    searchKeyword.value = '' // 清空搜索关键词

    // 清空选中的法律和右侧内容
    if (category === 'laws') {
      selectedLawIds.value = []
    }
    if (articles.value.length > 0) {
      articles.value = []
      recommendationText.value = ''
    }
    return
  }

  // 展开新的分类
  currentCategory.value = category
  currentSubCategory.value = ''
  showBackButton.value = false
  searchKeyword.value = '' // 清空搜索关键词

  // 如果切换到法律法规，保持已选中的法律状态
  if (category === 'laws') {
    // 如果有已选中的法律，保持显示
    if (selectedLawIds.value.length > 0) {
      loadArticlesBySelectedLaws()
    }
  } else {
    // 切换到常见场景或热点专题，清空选中的法律
    selectedLawIds.value = []
    // 清空右侧内容，等待用户选择具体场景或专题
    if (articles.value.length > 0) {
      articles.value = []
      recommendationText.value = ''
    }
  }
}

// 选择常见场景
function selectScenario(scenario: ScenarioItem) {
  currentSubCategory.value = scenario.id
  showBackButton.value = false
  searchKeyword.value = '' // 清空搜索关键词
  selectedLawIds.value = [] // 清空选中的法律

  // 使用常见场景名称进行知识库搜索
  searchByScenarioName(scenario.label)
}

// 根据常见场景名称搜索相关法条
async function searchByScenarioName(scenarioName: string) {
  loading.value = true
  recommendationText.value = `常见场景：${scenarioName}`

  try {
    console.log('🔍 搜索常见场景:', scenarioName)

    const requestData: KnowledgeQueryRequest = {
      question: scenarioName,
    }

    const response = await queryKnowledge(requestData)

    console.log('✅ 常见场景搜索结果:', response)

    if (response && Array.isArray(response) && response.length > 0) {
      const apiArticles = convertNewApiDataToArticles(response)

      articles.value = apiArticles

      // 更新收藏状态
      await updateArticlesFavoriteStatus(articles.value)

      // 更新当前法条编号
      if (articles.value.length > 0) {
        const firstArticleNum = articles.value[0].articleNumber.match(/\d+/)
        if (firstArticleNum) {
          currentArticleNumber.value = firstArticleNum[0]
        }
      }

      // 滚动到顶部
      await nextTick()
      scrollbarRef.value?.setScrollTop(0)
    } else {
      ElMessage.info('未找到相关法条')
      articles.value = []
    }
  } catch (error: any) {
    console.error('❌ 常见场景搜索失败:', error)
    ElMessage.error(error.message || '搜索失败')
    articles.value = []
  } finally {
    loading.value = false
  }
}

// 选择热点专题
function selectTopic(topic: ScenarioItem) {
  currentSubCategory.value = topic.id
  showBackButton.value = false
  searchKeyword.value = '' // 清空搜索关键词
  selectedLawIds.value = [] // 清空选中的法律

  // 使用热点专题名称进行知识库搜索
  searchByTopicName(topic.label)
}

// 根据热点专题名称搜索相关法条
async function searchByTopicName(topicName: string) {
  loading.value = true
  recommendationText.value = `热点专题：${topicName}`

  try {
    console.log('🔍 搜索热点专题:', topicName)

    const requestData: KnowledgeQueryRequest = {
      question: topicName,
    }

    const response = await queryKnowledge(requestData)

    console.log('✅ 热点专题搜索结果:', response)

    if (response && Array.isArray(response) && response.length > 0) {
      const apiArticles = convertNewApiDataToArticles(response)

      articles.value = apiArticles

      // 更新收藏状态
      await updateArticlesFavoriteStatus(articles.value)

      // 更新当前法条编号
      if (articles.value.length > 0) {
        const firstArticleNum = articles.value[0].articleNumber.match(/\d+/)
        if (firstArticleNum) {
          currentArticleNumber.value = firstArticleNum[0]
        }
      }

      // 滚动到顶部
      await nextTick()
      scrollbarRef.value?.setScrollTop(0)
    } else {
      ElMessage.info('未找到相关法条')
      articles.value = []
    }
  } catch (error: any) {
    console.error('❌ 热点专题搜索失败:', error)
    ElMessage.error(error.message || '搜索失败')
    articles.value = []
  } finally {
    loading.value = false
  }
}

// 检查是否为精确定位搜索（如"劳动法44条"）- 备用函数，API降级时使用
// function isPreciseSearch(keyword: string): { lawName: string; articleNum: string } | null {
//   // 匹配"劳动法44条"、"劳动合同法第47条"等格式
//   const patterns = [
//     /(.+?法).*?(\d+)条?/,
//     /(.+?条例).*?(\d+)条?/,
//   ]

//   for (const pattern of patterns) {
//     const match = keyword.match(pattern)
//     if (match) {
//       return {
//         lawName: match[1],
//         articleNum: match[2],
//       }
//     }
//   }

//   return null
// }

// 模糊匹配相关词（用于扩展搜索）- 备用函数，API降级时使用
// function getRelatedKeywords(keyword: string): string[] {
//   const relatedMap: Record<string, string[]> = {
//     '加班费': ['加班工资', '加班报酬', '加班补偿', '超时工作'],
//     '工资': ['薪资', '薪酬', '报酬', '劳动报酬'],
//     '解除': ['终止', '辞退', '开除', '离职'],
//     '补偿': ['赔偿', '补偿金', '赔偿金', '经济补偿'],
//     '合同': ['协议', '契约'],
//     '社保': ['社会保险', '五险', '医保', '养老保险'],
//   }

//   const keywords = [keyword]

//   // 查找相关词
//   for (const [key, related] of Object.entries(relatedMap)) {
//     if (keyword.includes(key)) {
//       keywords.push(...related)
//     }
//     // 反向匹配
//     if (related.some(word => keyword.includes(word))) {
//       keywords.push(key, ...related)
//     }
//   }

//   return [...new Set(keywords)]
// }

// 搜索
async function handleSearch() {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  const keyword = searchKeyword.value.trim()

  // 添加到搜索历史
  addSearchHistory(keyword)

  // 隐藏搜索历史下拉框
  showSearchHistory.value = false

  loading.value = true
  recommendationText.value = ''
  showBackButton.value = false

  try {
    console.log('🔍 搜索关键词:', keyword)

    // 调用真实API
    const requestData: KnowledgeQueryRequest = {
      question: keyword,
    }

    const response = await queryKnowledge(requestData)

    console.log('✅ 搜索API响应:', response)
    console.log('📊 响应数据类型:', typeof response, '是否为数组:', Array.isArray(response))

    // 注意：响应拦截器已经提取了 data 字段，response 直接就是数组
    if (response && Array.isArray(response) && response.length > 0) {
      // 转换API数据为法条数组
      const apiArticles = convertNewApiDataToArticles(response)

      console.log('📝 搜索结果法条数量:', apiArticles.length)

      articles.value = apiArticles
      searchResultCount.value = apiArticles.length

      // 更新收藏状态
      await updateArticlesFavoriteStatus(articles.value)

      if (apiArticles.length > 0) {
        // 清空推荐文本，避免与搜索结果统计重叠
        recommendationText.value = ''

        // 更新当前法条编号
        const firstArticleNum = articles.value[0].articleNumber.match(/\d+/)
        if (firstArticleNum) {
          currentArticleNumber.value = firstArticleNum[0]
        }

        // 滚动到顶部
        await nextTick()
        scrollbarRef.value?.setScrollTop(0)
      } else {
        ElMessage.info('未找到相关法条')
      }
    } else {
      console.warn('⚠️ 搜索API响应失败或无数据:', response)
      ElMessage.info('未找到相关法条')
      articles.value = []
    }
  } catch (error: any) {
    console.error('❌ 搜索失败:', error)
    ElMessage.error(error.message || '搜索服务暂时不可用，请稍后重试')
    articles.value = []
  } finally {
    loading.value = false
  }
}

// 滚动处理
function handleScroll() {
  if (articleRefs.value.length === 0 || articles.value.length === 0) {
    return
  }

  // 找到当前最接近顶部的法条
  let closestIndex = 0
  let minDistance = Infinity

  for (let i = 0; i < articleRefs.value.length; i++) {
    const el = articleRefs.value[i]
    if (el) {
      const rect = el.getBoundingClientRect()
      // 计算元素顶部到视口顶部的距离（考虑一个偏移量）
      const distance = Math.abs(rect.top - 100)

      // 如果元素已经完全滚动过去了，跳过
      if (rect.bottom < 0) continue

      // 如果元素还没有出现，也跳过
      if (rect.top > window.innerHeight) break

      // 找到距离最小的元素
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = i
      }
    }
  }

  // 更新当前法条编号
  if (articles.value[closestIndex]) {
    const articleNum = articles.value[closestIndex].articleNumber
    // 提取数字部分，如"第47条" -> "47"
    const match = articleNum.match(/\d+/)
    if (match) {
      currentArticleNumber.value = match[0]
    }
  }
}

// 收藏/取消收藏
async function toggleFavoriteArticle(article: LawArticle) {
  // 检查是否有 regulationId
  if (!article.regulationId) {
    ElMessage.warning('该法条无法收藏')
    return
  }

  const newStatus = !article.isFavorite

  try {
    // 调用API
    if (newStatus) {
      await addFavorite(article.regulationId)
    } else {
      await removeFavorite(article.regulationId)
    }

    // 更新当前文章的收藏状态
    article.isFavorite = newStatus

    ElMessage.success(newStatus ? '收藏成功' : '已取消收藏')

    // 更新收藏数量
    loadFavoriteCount()

    // 如果在收藏列表中，刷新收藏列表
    if (favoritesDialogVisible.value) {
      loadFavorites()
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
    ElMessage.error(newStatus ? '收藏失败' : '取消收藏失败')
  }
}

// 复制法条
function copyArticle(article: LawArticle) {
  const text = `${article.lawName} ${article.articleNumber}\n\n【原文】\n${article.content}\n\n【释义】\n${article.interpretation}`

  navigator.clipboard
    .writeText(text)
    .then(() => {
      ElMessage.success('复制成功')
    })
    .catch(() => {
      ElMessage.error('复制失败')
    })
}

// 跳转到关联法条 - 功能已废弃
async function jumpToArticle(_articleId: string) {
  // 跳转到关联法条功能已废弃
  ElMessage.warning('该功能暂时不可用，请使用搜索功能')
}

// 返回之前的位置 - 功能已废弃
async function backToPrevious() {
  if (!previousPosition.value) return

  // 返回功能已废弃
  showBackButton.value = false
  previousPosition.value = null
  ElMessage.warning('返回功能暂时不可用')
}

// 跳转到AI咨询
function askAI(question: string) {
  // 保存问题到本地存储，同时更新最后的咨询问题
  localStorage.setItem('aiConsultQuestion', question)
  localStorage.setItem('lastConsultQuestion', question)

  // 标记为从知识库跳转，需要自动发送
  localStorage.setItem('aiConsultAutoSend', 'true')

  // 触发切换到AI咨询页面的事件
  window.dispatchEvent(new CustomEvent('switchToAIConsult', { detail: { question } }))

  ElMessage.success('正在跳转到AI咨询...')
}

// 加载收藏数量
async function loadFavoriteCount() {
  try {
    const count = await getFavoriteCount()
    favoriteCount.value = count
    console.log('✅ 收藏数量:', count)
  } catch (error) {
    console.error('❌ 加载收藏数量失败:', error)
  }
}

// 显示收藏列表
async function showFavorites() {
  favoritesDialogVisible.value = true
  loadFavorites()
}

// 加载收藏列表
async function loadFavorites() {
  try {
    loading.value = true
    const favoriteList = await getFavoriteList()

    // 将后端返回的收藏数据转换为LawArticle格式
    favoriteArticles.value = favoriteList.map((fav: UserFavoriteRegulation) => ({
      id: `fav-${fav.regulationId}`,
      regulationId: fav.regulationId,
      lawName: fav.regulationName,
      articleNumber: `第${fav.articleNumber}条`,
      title: `${fav.regulationName} 第${fav.articleNumber}条`,
      content: fav.originalText,
      interpretation: '', // 收藏列表不包含释义，需要时再查询
      relatedArticles: [],
      relatedCases: [],
      relatedQuestions: [],
      category: 'favorite',
      isFavorite: true,
    }))

    console.log('✅ 收藏列表加载成功，共', favoriteArticles.value.length, '条')
  } catch (error) {
    console.error('❌ 加载收藏列表失败:', error)
    ElMessage.error('加载收藏列表失败')
  } finally {
    loading.value = false
  }
}

// 从收藏列表加载法条
async function loadArticleFromFavorite(article: LawArticle) {
  favoritesDialogVisible.value = false

  searchKeyword.value = '' // 清空搜索关键词
  loading.value = true
  showBackButton.value = false

  // 创建简化版的法条，只包含法条名称和原文
  const simplifiedArticle: LawArticle = {
    id: article.id,
    regulationId: article.regulationId,
    lawName: article.lawName,
    articleNumber: article.articleNumber,
    title: article.title,
    content: article.content,
    interpretation: '', // 不显示释义
    relatedArticles: [], // 不显示关联法条
    relatedCases: [], // 不显示相关案例
    relatedQuestions: [], // 不显示相关问题
    category: article.category,
    isFavorite: article.isFavorite,
  }

  articles.value = [simplifiedArticle]
  recommendationText.value = ''

  // 更新当前法条编号
  const articleNum = simplifiedArticle.articleNumber.match(/\d+/)
  if (articleNum) {
    currentArticleNumber.value = articleNum[0]
  }

  // 滚动到顶部
  await nextTick()
  scrollbarRef.value?.setScrollTop(0)

  loading.value = false
}
</script>

<style scoped lang="scss">
.knowledge-base {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f5f7fa;

  .content-wrapper {
    display: flex;
    flex: 1;
    overflow: hidden;
    gap: 0;

    .sidebar {
      width: 240px;
      background: white;
      box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
      overflow-y: auto;
      display: flex;
      flex-direction: column;

      .nav-section {
        .nav-title {
          padding: 16px 20px;
          font-size: 15px;
          font-weight: 600;
          color: #303133;
          background: #f0f2f5;
          border-bottom: 1px solid #e4e7ed;
        }

        .nav-category {
          margin-bottom: 0;

          .category-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 20px;
            font-size: 15px;
            color: #303133;
            cursor: pointer;
            transition: all 0.3s;
            border-bottom: 1px solid #f0f2f5;
            font-weight: 500;

            .toggle-icon {
              font-size: 14px;
              color: #909399;
              transition: all 0.3s;
            }

            &:hover {
              background-color: #f5f7fa;
              color: #409eff;

              .toggle-icon {
                color: #409eff;
              }
            }

            &.active {
              background-color: #e8f4ff;
              color: #409eff;
              border-left: 3px solid #409eff;
              padding-left: 17px;

              .toggle-icon {
                color: #409eff;
              }
            }
          }

          .sub-categories {
            background: #fafafa;

            .sub-category-item {
              padding: 10px 20px 10px 40px;
              font-size: 14px;
              color: #606266;
              cursor: pointer;
              transition: all 0.3s;
              border-bottom: 1px solid #f0f2f5;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: space-between;

              &:before {
                content: '•';
                position: absolute;
                left: 28px;
                color: #909399;
              }

              .scenario-label {
                flex: 1;
              }

              &:hover {
                background-color: #f5f7fa;
                color: #409eff;
              }

              &.active {
                background-color: #e8f4ff;
                color: #409eff;
                font-weight: 500;

                &:before {
                  color: #409eff;
                }
              }

              // 热点专题特殊样式
              &.hot-topic-item {
                .topic-label {
                  flex: 1;
                }

                .hot-icon {
                  font-size: 14px;
                  color: #f56c6c;
                  margin-left: 6px;
                  animation: pulse 2s ease-in-out infinite;
                }

                &:hover .hot-icon {
                  color: #ff4d4f;
                  transform: scale(1.1);
                }

                &.active .hot-icon {
                  color: #ff4d4f;
                }
              }
            }

            @keyframes pulse {
              0%,
              100% {
                opacity: 1;
              }
              50% {
                opacity: 0.6;
              }
            }

            // 法律法规的多级结构样式
            .primary-category {
              .primary-category-header {
                display: flex;
                align-items: center;
                padding: 10px 16px 10px 30px;
                font-size: 14px;
                color: #303133;
                cursor: pointer;
                transition: all 0.3s;
                border-bottom: 1px solid #f0f2f5;
                font-weight: 500;

                .expand-icon {
                  margin-right: 8px;
                  font-size: 14px;
                  color: #606266;
                  transition: all 0.3s;
                }

                .primary-category-title {
                  flex: 1;
                }

                &:hover {
                  background-color: #f5f7fa;
                  color: #409eff;

                  .expand-icon {
                    color: #409eff;
                  }
                }
              }

              .secondary-categories {
                background: #f5f7fa;

                .law-item {
                  display: flex;
                  align-items: center;
                  padding: 9px 16px 9px 50px;
                  font-size: 13px;
                  color: #606266;
                  cursor: pointer;
                  transition: all 0.3s;
                  border-bottom: 1px solid #ebeef5;

                  .law-toggle-icon {
                    margin-right: 6px;
                    font-size: 13px;
                    color: #909399;
                    flex-shrink: 0;
                    transition: all 0.3s;
                  }

                  .law-name {
                    flex: 1;
                    line-height: 1.5;
                  }

                  &:hover {
                    background-color: #ecf5ff;
                    color: #409eff;

                    .law-toggle-icon {
                      color: #409eff;
                    }
                  }

                  &.selected {
                    background-color: #e8f4ff;
                    color: #409eff;
                    font-weight: 500;

                    .law-toggle-icon {
                      color: #409eff;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #f5f7fa;

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        flex-shrink: 0;

        .search-container {
          display: flex;
          align-items: center;
          flex: 1;
          max-width: 500px;

          .search-wrapper {
            flex: 1;
            position: relative;
            margin-right: 12px;
          }

          .search-input {
            width: 100%;

            :deep(.el-input__wrapper) {
              box-shadow: 0 0 0 1px #dcdfe6 inset;
              transition: all 0.3s;

              &:hover {
                box-shadow: 0 0 0 1px #c0c4cc inset;
              }
            }

            :deep(.el-input__wrapper.is-focus) {
              box-shadow: 0 0 0 1px #409eff inset !important;
            }

            :deep(.el-input__inner) {
              &::placeholder {
                color: #a8abb2;
                font-size: 14px;
              }
            }
          }

          // 搜索历史下拉框
          .search-history-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            margin-top: 8px;
            background: white;
            border: 1px solid #e4e7ed;
            border-radius: 4px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
            z-index: 2000;
            max-height: 300px;
            overflow-y: auto;

            .history-header {
              display: flex;
              align-items: center;
              padding: 10px 16px;
              border-bottom: 1px solid #f0f2f5;
              font-size: 13px;
              color: #909399;
              gap: 6px;

              .el-icon {
                font-size: 14px;
              }
            }

            .history-list {
              .history-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 16px;
                cursor: pointer;
                transition: all 0.3s;
                border-bottom: 1px solid #f5f7fa;

                &:last-child {
                  border-bottom: none;
                }

                .history-text {
                  flex: 1;
                  font-size: 14px;
                  color: #606266;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }

                .delete-icon {
                  font-size: 18px;
                  color: #c0c4cc;
                  cursor: pointer;
                  transition: all 0.3s;
                  padding: 4px;

                  &:hover {
                    color: #f56c6c;
                    transform: scale(1.1);
                  }
                }

                &:hover {
                  background-color: #f5f7fa;

                  .history-text {
                    color: #409eff;
                  }
                }
              }
            }
          }

          .search-btn {
            width: 80px;
            font-weight: 500;
            transition: all 0.3s;

            &:hover:not(:disabled) {
              transform: translateY(-1px);
              box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
            }

            &:active:not(:disabled) {
              transform: translateY(0);
            }

            &:disabled {
              cursor: not-allowed;
              opacity: 0.6;
            }
          }
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
      }

      .recommendation-text {
        margin: 20px;
        padding: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 8px;
        font-size: 15px;
        flex-shrink: 0;
      }

      .search-result-info {
        margin: 0 20px 16px 20px;
        padding: 12px 16px;
        background: #ecf5ff;
        border-left: 4px solid #409eff;
        border-radius: 4px;
        font-size: 14px;
        color: #606266;
        flex-shrink: 0;

        .result-count {
          font-weight: 600;
          color: #409eff;
          font-size: 16px;
          margin: 0 4px;
        }
      }

      .articles-wrapper {
        flex: 1;
        margin: 0 20px 20px 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .article-indicator {
          padding: 16px 24px;
          border-bottom: 1px solid #e4e7ed;
          font-size: 16px;
          font-weight: 500;
          color: #303133;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .articles-container {
          flex: 1;

          .article-item {
            padding: 24px;
            border-bottom: 1px solid #ebeef5;

            &:last-child {
              border-bottom: none;
            }

            .article-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;

              .article-title {
                font-size: 18px;
                font-weight: 600;
                color: #303133;
                margin: 0;
              }

              .article-actions {
                display: flex;
                gap: 12px;
              }
            }

            .article-section {
              margin-bottom: 20px;

              &:last-child {
                margin-bottom: 0;
              }

              .section-title {
                font-size: 15px;
                font-weight: 600;
                color: #409eff;
                margin: 0 0 12px 0;
              }

              .section-content {
                font-size: 14px;
                line-height: 1.8;
                color: #606266;
                text-indent: 2em;
              }

              .related-articles {
                .related-article {
                  padding: 10px 16px;
                  background: #f5f7fa;
                  border-left: 3px solid #409eff;
                  margin-bottom: 8px;
                  cursor: pointer;
                  transition: all 0.3s;
                  font-size: 14px;
                  color: #606266;

                  &:hover {
                    background: #ecf5ff;
                    color: #409eff;
                  }
                }
              }

              .related-cases {
                display: flex;
                flex-direction: column;
                gap: 8px;

                .related-case {
                  color: #409eff;
                  font-size: 14px;
                  text-decoration: none;
                  transition: all 0.3s;

                  &:hover {
                    color: #66b1ff;
                    text-decoration: underline;
                  }
                }
              }

              .related-questions {
                display: flex;
                flex-direction: column;
                gap: 8px;

                .related-question {
                  padding: 10px 16px;
                  background: linear-gradient(135deg, #f5f7fa 0%, #ecf5ff 100%);
                  border-radius: 4px;
                  cursor: pointer;
                  transition: all 0.3s;
                  font-size: 14px;
                  color: #606266;

                  &:hover {
                    background: linear-gradient(135deg, #ecf5ff 0%, #e1f3ff 100%);
                    color: #409eff;
                    transform: translateX(4px);
                  }
                }
              }
            }
          }
        }
      }

      .loading-state,
      .empty-state {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 8px;
        margin: 20px;

        .empty-icon {
          color: #c0c4cc;
          margin-bottom: 16px;
        }

        .loading-text,
        .empty-title {
          font-size: 16px;
          color: #909399;
          margin-top: 16px;
        }

        .empty-subtitle {
          font-size: 14px;
          color: #c0c4cc;
          margin-top: 8px;
        }
      }
    }
  }
}

// 收藏弹窗样式
.favorites-dialog {
  .empty-favorites {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;

    .empty-text {
      font-size: 16px;
      color: #909399;
      margin-top: 16px;
    }
  }

  .favorites-list {
    .favorite-item {
      padding: 20px;
      border-bottom: 1px solid #ebeef5;
      cursor: pointer;
      transition: all 0.3s;
      position: relative;

      &:hover {
        background-color: #f5f7fa;

        .remove-favorite {
          opacity: 1;
        }
      }

      .favorite-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
      }

      .favorite-content {
        font-size: 14px;
        color: #606266;
        line-height: 1.6;
      }

      .remove-favorite {
        position: absolute;
        top: 20px;
        right: 20px;
        opacity: 0;
        transition: opacity 0.3s;
      }
    }
  }
}
</style>
