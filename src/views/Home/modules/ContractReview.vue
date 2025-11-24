<template>
  <div class="contract-review">
    <!-- 左侧输入区 -->
    <div class="left-panel">
      <div class="input-section">
        <div class="section-header">
          <h3 class="section-title">劳动合同文本</h3>
          <el-button type="primary" plain size="small" @click="handleUploadClick">
            <el-icon><component :is="UploadIcon" /></el-icon>
            {{ uploadButtonText }}
          </el-button>
          <input
            ref="fileInputRef"
            type="file"
            accept=".txt,.doc,.docx,.pdf"
            style="display: none"
            @change="handleFileChange"
          />
        </div>
        <div class="input-hint">输入或上传需要审查的劳动合同</div>

        <!-- 带高亮的文本显示区 -->
        <div v-if="hasResult" class="text-display-container">
          <el-scrollbar ref="textDisplayRef" class="text-display">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div
              class="highlighted-text"
              contenteditable="true"
              @input="handleTextEdit"
              v-html="highlightedText"
            ></div>
          </el-scrollbar>
        </div>

        <!-- 普通文本输入框 -->
        <el-input
          v-else
          v-model="contractText"
          type="textarea"
          :rows="18"
          placeholder="请输入劳动合同内容..."
          :maxlength="10000"
          show-word-limit
          class="contract-input"
        />

        <div class="action-buttons">
          <el-button
            type="primary"
            size="large"
            class="primary-btn"
            :disabled="!canReview"
            @click="startReview"
          >
            开始审查
          </el-button>
          <el-button size="large" @click="clearContent">清空</el-button>
          <el-dropdown trigger="click" @command="handleExportCommand">
            <el-button size="large" :disabled="!hasResult">
              <el-icon><component :is="DownloadIcon" /></el-icon>
              PDF
              <el-icon class="el-icon--right"><component :is="ArrowDownIcon" /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="pdf">
                  <el-icon><component :is="DocumentIcon" /></el-icon>
                  下载PDF
                </el-dropdown-item>
                <el-dropdown-item command="word">
                  <el-icon><component :is="DocumentIcon" /></el-icon>
                  下载Word
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button size="large" @click="showHistoryDialog">
            <el-icon><component :is="HistoryIcon" /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 右侧结果显示区 -->
    <div class="right-panel">
      <div class="result-section">
        <div class="section-header">
          <h3 class="section-title">审查结果</h3>
          <el-button type="primary" plain size="small" @click="showHistoryDialog">
            <el-icon><component :is="HistoryIcon" /></el-icon>
            审查记录
          </el-button>
        </div>

        <!-- 等待状态 -->
        <div v-if="!reviewing && !hasResult" class="empty-state">
          <el-icon :size="60" class="empty-icon">
            <component :is="DocumentIcon" />
          </el-icon>
          <div class="empty-title">等待审查</div>
          <div class="empty-subtitle">请在左侧输入劳动合同内容，点击“开始审查”按钮</div>
        </div>

        <!-- 审查中 -->
        <div v-if="reviewing" class="reviewing-state">
          <el-icon :size="60" class="is-loading">
            <component :is="LoadingIcon" />
          </el-icon>
          <div class="reviewing-text">审查中</div>
        </div>

        <!-- 审查结果 -->
        <el-scrollbar v-if="hasResult && !reviewing" class="result-content">
          <!-- 完全合规（三个等级都不存在时显示） -->
          <div v-if="isFullyCompliant" class="compliance-block">
            <div class="compliance-header">
              <el-icon :size="20" color="#67C23A"><component :is="SuccessIcon" /></el-icon>
              <span class="compliance-title">完全合规条款</span>
            </div>
          </div>

          <!-- 明显违法 -->
          <div
            v-if="reviewResult?.illegalIssues && reviewResult.illegalIssues.length > 0"
            class="issue-block illegal-block"
          >
            <div class="issue-header">
              <el-icon :size="18" color="#F56C6C"><component :is="WarningFilledIcon" /></el-icon>
              <span class="issue-title">明显违法条款</span>
            </div>
            <div
              v-for="(issue, index) in reviewResult.illegalIssues"
              :key="'illegal-' + index"
              class="issue-item"
              :class="{ active: activeIssueId === issue.id }"
              @click="locateIssue(issue.id)"
            >
              <div class="issue-order">{{ index + 1 }}</div>
              <div class="issue-content">
                <div class="issue-original">
                  <strong>合同原句：</strong>{{ issue.originalText }}
                </div>
                <div class="issue-law"><strong>相关条款：</strong>{{ issue.relatedLaw }}</div>
                <div class="issue-suggestion">
                  <strong>修改建议：</strong>{{ issue.suggestion }}
                </div>
              </div>
            </div>
          </div>

          <!-- 存在风险 -->
          <div
            v-if="reviewResult?.riskIssues && reviewResult.riskIssues.length > 0"
            class="issue-block risk-block"
          >
            <div class="issue-header">
              <el-icon :size="18" color="#E6A23C"><component :is="WarningIcon" /></el-icon>
              <span class="issue-title">存在风险条款</span>
            </div>
            <div
              v-for="(issue, index) in reviewResult.riskIssues"
              :key="'risk-' + index"
              class="issue-item"
              :class="{ active: activeIssueId === issue.id }"
              @click="locateIssue(issue.id)"
            >
              <div class="issue-order">{{ index + 1 }}</div>
              <div class="issue-content">
                <div class="issue-original">
                  <strong>合同原句：</strong>{{ issue.originalText }}
                </div>
                <div class="issue-law"><strong>相关条款：</strong>{{ issue.relatedLaw }}</div>
                <div class="issue-suggestion">
                  <strong>修改建议：</strong>{{ issue.suggestion }}
                </div>
              </div>
            </div>
          </div>

          <!-- 缺失必备 -->
          <div
            v-if="reviewResult?.missingIssues && reviewResult.missingIssues.length > 0"
            class="issue-block missing-block"
          >
            <div class="issue-header">
              <el-icon :size="18" color="#909399"><component :is="InfoIcon" /></el-icon>
              <span class="issue-title">缺失必备条款</span>
            </div>
            <div
              v-for="(issue, index) in reviewResult.missingIssues"
              :key="'missing-' + index"
              class="issue-item"
            >
              <div class="issue-order">{{ index + 1 }}</div>
              <div class="issue-content">
                <div class="issue-original">
                  <strong>缺失内容：</strong>{{ issue.originalText }}
                </div>
                <div class="issue-law"><strong>相关条款：</strong>{{ issue.relatedLaw }}</div>
                <div class="issue-suggestion">
                  <strong>修改建议：</strong>{{ issue.suggestion }}
                </div>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </div>
    </div>

    <!-- 审查记录弹窗 -->
    <el-dialog
      v-model="historyDialogVisible"
      title="审查记录"
      width="750px"
      :close-on-click-modal="false"
      class="history-dialog"
    >
      <el-scrollbar height="500px" class="history-scrollbar">
        <div v-if="groupedHistory.length === 0" class="history-empty">
          <el-icon :size="60" color="#c0c4cc">
            <component :is="DocumentIcon" />
          </el-icon>
          <div class="empty-text">暂无审查记录</div>
        </div>
        <div v-else class="history-list">
          <div v-for="group in groupedHistory" :key="group.date" class="history-group">
            <div class="group-date">{{ group.dateLabel }}</div>
            <div
              v-for="record in group.records"
              :key="record.id"
              class="history-record"
              @click="loadHistory(record)"
              @mouseenter="hoveredRecordId = record.id"
              @mouseleave="hoveredRecordId = ''"
            >
              <div class="record-main">
                <div class="record-title">{{ record.title }}</div>
                <div class="record-info">
                  <span class="record-time">{{ formatTime(record.reviewTime) }}</span>
                  <el-tag
                    v-if="record.issueCount > 0"
                    size="small"
                    type="danger"
                    class="record-tag"
                  >
                    {{ record.issueCount }}个问题
                  </el-tag>
                  <el-tag v-else size="small" type="success" class="record-tag"> 无问题 </el-tag>
                </div>
              </div>
              <el-icon
                v-show="hoveredRecordId === record.id && deletingRecordId !== record.id"
                class="delete-icon"
                :size="18"
                @click.stop="deleteHistory(record.id)"
              >
                <component :is="DeleteIcon" />
              </el-icon>
              <!-- 删除加载状态 -->
              <el-icon
                v-show="deletingRecordId === record.id"
                class="delete-icon loading"
                :size="18"
              >
                <component :is="LoadingIcon" />
              </el-icon>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, nextTick } from 'vue'
import {
  Upload,
  Document,
  Loading,
  Warning,
  SuccessFilled,
  WarningFilled,
  InfoFilled,
  Download,
  ArrowDown,
  Clock,
  Delete,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  parseFileContent,
  getConversationId,
  submitFileReview,
  saveReviewRecord,
  SaveRecordRequest,
  getReviewRecordDetail,
  deleteReviewRecord,
  getReviewRecordList,
  downloadFile,
  FileDownloadRequest,
} from '@/api/check'

// 使用 markRaw 优化图标
const UploadIcon = markRaw(Upload)
const DocumentIcon = markRaw(Document)
const LoadingIcon = markRaw(Loading)
const WarningIcon = markRaw(Warning)
const SuccessIcon = markRaw(SuccessFilled)
const WarningFilledIcon = markRaw(WarningFilled)
const InfoIcon = markRaw(InfoFilled)
const DownloadIcon = markRaw(Download)
const ArrowDownIcon = markRaw(ArrowDown)
const HistoryIcon = markRaw(Clock)
const DeleteIcon = markRaw(Delete)

interface Issue {
  id: string
  type: 'illegal' | 'risk' | 'missing'
  originalText: string
  relatedLaw: string
  suggestion: string
  startIndex: number
  endIndex: number
}

interface ReviewResult {
  illegalIssues: Issue[]
  riskIssues: Issue[]
  missingIssues: Issue[]
}

interface HistoryRecord {
  id: string
  title: string
  reviewTime: string
  issueCount: number
  contractText: string
  result: ReviewResult
}

// 合同文本
const contractText = ref<string>('')

// 原始合同文本（用于保存未修改的版本）
const originalContractText = ref<string>('')

// 审查状态
const reviewing = ref<boolean>(false)

// 审查结果
const reviewResult = ref<ReviewResult | null>(null)

// 文件输入引用
const fileInputRef = ref<HTMLInputElement>()

// 文本显示区引用
const textDisplayRef = ref()

// 是否已上传文件
const fileUploaded = ref<boolean>(false)

// 当前激活的问题ID
const activeIssueId = ref<string>('')

// 审查记录
const reviewHistory = ref<HistoryRecord[]>([])

// 历史弹窗显示状态
const historyDialogVisible = ref<boolean>(false)

// 鼠标悬浮的记录ID
const hoveredRecordId = ref<string>('')

// 上传按钮文字
const uploadButtonText = computed(() => {
  return fileUploaded.value ? '重新上传' : '上传文件'
})

// 是否可以开始审查
const canReview = computed(() => {
  return contractText.value.trim().length > 0 && !reviewing.value
})

// 是否有结果
const hasResult = computed(() => {
  return reviewResult.value !== null
})

// 是否完全合规
const isFullyCompliant = computed(() => {
  if (!reviewResult.value) return false
  const { illegalIssues, riskIssues, missingIssues } = reviewResult.value
  return illegalIssues.length === 0 && riskIssues.length === 0 && missingIssues.length === 0
})

// 生成带高亮的HTML文本
const highlightedText = computed(() => {
  if (!reviewResult.value || !originalContractText.value) {
    return contractText.value
  }

  const text = originalContractText.value
  const allIssues = [...reviewResult.value.illegalIssues, ...reviewResult.value.riskIssues].sort(
    (a, b) => a.startIndex - b.startIndex,
  )

  if (allIssues.length === 0) {
    return text
  }

  let result = ''
  let lastIndex = 0

  allIssues.forEach((issue) => {
    // 添加普通文本
    result += escapeHtml(text.substring(lastIndex, issue.startIndex))

    // 添加高亮文本
    const highlightClass = issue.type === 'illegal' ? 'highlight-illegal' : 'highlight-risk'
    result += `<span class="${highlightClass}" data-issue-id="${issue.id}">${escapeHtml(
      text.substring(issue.startIndex, issue.endIndex),
    )}</span>`

    lastIndex = issue.endIndex
  })

  // 添加剩余文本
  result += escapeHtml(text.substring(lastIndex))

  return result
})

// HTML转义
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML.replace(/\n/g, '<br>')
}

// 按日期分组的历史记录
const groupedHistory = computed(() => {
  const groups: { date: string; dateLabel: string; records: HistoryRecord[] }[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 按日期分组
  const dateMap = new Map<string, HistoryRecord[]>()

  reviewHistory.value.forEach((record) => {
    const recordDate = new Date(record.reviewTime)
    recordDate.setHours(0, 0, 0, 0)
    const dateKey = formatDate(recordDate)

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, [])
    }
    dateMap.get(dateKey)!.push(record)
  })

  // 转换为数组并排序（从近到远）
  const sortedDates = Array.from(dateMap.keys()).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime()
  })

  sortedDates.forEach((date) => {
    const records = dateMap.get(date)!
    const recordDate = new Date(date)
    const isToday = recordDate.getTime() === today.getTime()

    groups.push({
      date,
      dateLabel: isToday ? '今天' : date,
      records: records.sort((a, b) => {
        return new Date(b.reviewTime).getTime() - new Date(a.reviewTime).getTime()
      }),
    })
  })

  return groups
})

// 格式化日期 YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化时间显示（仅显示时:分）
function formatTime(timeString: string): string {
  try {
    const date = new Date(timeString)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  } catch (e) {
    return timeString
  }
}

// 加载历史记录
function loadReviewHistory() {
  const stored = localStorage.getItem('contract_review_history')
  if (stored) {
    try {
      reviewHistory.value = JSON.parse(stored)
    } catch (e) {
      reviewHistory.value = []
    }
  }
}

// 保存历史记录
function saveReviewHistory() {
  localStorage.setItem('contract_review_history', JSON.stringify(reviewHistory.value))
}

// 当前审查记录的ID（用于跟踪是否需要覆盖）
const currentRecordId = ref<string>('')

// 保存记录的加载状态
const savingRecord = ref<boolean>(false)

// 加载记录详情的状态
const loadingRecordDetail = ref<boolean>(false)

// 删除记录的加载状态
const deletingRecordId = ref<string>('')

// 当前对话 ID
const conversationId = ref<string>('')

// 当前文件名
const currentFileName = ref<string>('')

// 加载后端记录列表的状态
const loadingRecordList = ref<boolean>(false)

// 保存当前审查结果到历史
async function saveToHistory() {
  if (!reviewResult.value || !contractText.value) return

  const issueCount =
    (reviewResult.value.illegalIssues?.length || 0) +
    (reviewResult.value.riskIssues?.length || 0) +
    (reviewResult.value.missingIssues?.length || 0)

  const title = generateContractTitle(contractText.value)

  // 设置保存状态
  savingRecord.value = true

  try {
    // 准备保存参数
    const saveParams: SaveRecordRequest = {
      reviewContent: JSON.stringify(reviewResult.value),
      fileName: currentFileName.value || title,
      conversationId: conversationId.value,
      recordId: !saveAsNewRecord.value && currentRecordId.value ? currentRecordId.value : undefined,
    }

    // 调用后端API保存记录
    const response = await saveReviewRecord(saveParams, true)

    // 检查响应是否有效
    if (response && response.success) {
      // 后端保存成功，同步更新本地历史
      if (!saveAsNewRecord.value && currentRecordId.value) {
        const index = reviewHistory.value.findIndex((item) => item.id === currentRecordId.value)
        if (index !== -1) {
          // 覆盖现有记录
          reviewHistory.value[index] = {
            id: currentRecordId.value,
            title,
            reviewTime: formatReviewTime(),
            issueCount,
            contractText: contractText.value,
            result: reviewResult.value,
          }
          ElMessage.success('已更新审查记录')
        } else {
          // 如果找不到记录，创建新记录
          createNewHistoryRecord(title, issueCount, response.data)
        }
      } else {
        // 创建新记录，使用后端返回的ID
        createNewHistoryRecord(title, issueCount, response.data)
      }

      // 保存本地历史
      saveReviewHistory()
    } else {
      const errorMessage = response?.message || '保存失败：未知错误'
      ElMessage.error(`保存失败：${errorMessage}`)
    }
  } catch (error) {
    ElMessage.error('保存失败，请稍后重试')

    // 如果后端保存失败，仍然保存到本地作为备份
    if (!saveAsNewRecord.value && currentRecordId.value) {
      const index = reviewHistory.value.findIndex((item) => item.id === currentRecordId.value)
      if (index !== -1) {
        reviewHistory.value[index] = {
          id: currentRecordId.value,
          title,
          reviewTime: formatReviewTime(),
          issueCount,
          contractText: contractText.value,
          result: reviewResult.value,
        }
      } else {
        createNewHistoryRecord(title, issueCount)
      }
    } else {
      createNewHistoryRecord(title, issueCount)
    }
    saveReviewHistory()
  } finally {
    // 清除保存状态
    savingRecord.value = false
  }
}

// 创建新的历史记录
function createNewHistoryRecord(title: string, issueCount: number, backendId?: string) {
  // 优先使用后端返回的ID，否则生成本地ID
  const newId = backendId || `review_${Date.now()}`
  const record: HistoryRecord = {
    id: newId,
    title,
    reviewTime: formatReviewTime(),
    issueCount,
    contractText: contractText.value,
    result: reviewResult.value!,
  }

  reviewHistory.value.unshift(record)
  currentRecordId.value = newId
}

/**
 * 从后端加载指定的审查记录详情
 * @param recordId 记录ID
 */
async function loadReviewRecordDetail(recordId: string) {
  if (!recordId) {
    ElMessage.error('记录ID不能为空')
    return
  }

  loadingRecordDetail.value = true

  try {
    const response = await getReviewRecordDetail(recordId)

    if (response && response.success && response.data) {
      const recordData = response.data

      // 解析reviewContent为JSON
      try {
        const parsedReviewContent = JSON.parse(recordData.reviewContent)

        // 更新界面数据
        reviewResult.value = parsedReviewContent
        currentFileName.value = recordData.fileName
        currentRecordId.value = recordData.recordId
        activeIssueId.value = '' // 重置活跃问题ID

        // 显示成功消息
        ElMessage.success('审查记录加载成功')
      } catch (parseError) {
        ElMessage.error('审查记录数据格式错误')
      }
    } else {
      const errorMessage = response?.message || '获取审查记录失败'
      ElMessage.error(errorMessage)
    }
  } catch (error) {
    ElMessage.error('加载失败，请稍后重试')
  } finally {
    loadingRecordDetail.value = false
  }
}

/**
 * 从后端同步审查记录列表
 */
async function syncRecordListFromBackend() {
  loadingRecordList.value = true

  try {
    const response = await getReviewRecordList()

    if (response && response.success && response.data && response.data.records) {
      const backendRecords = response.data.records

      // 将后端记录转换为本地历史记录格式
      const convertedRecords = backendRecords
        .map((record) => {
          // 解析审查内容
          let reviewResult = null
          try {
            reviewResult = JSON.parse(record.reviewContent)
          } catch (error) {
            return null
          }

          // 计算问题数量
          const issueCount =
            (reviewResult.illegalIssues?.length || 0) +
            (reviewResult.riskIssues?.length || 0) +
            (reviewResult.missingIssues?.length || 0)

          return {
            id: record.recordId,
            title: record.fileName || '未命名合同',
            reviewTime: new Date(record.updateTime || record.createTime).toLocaleString(),
            issueCount,
            contractText: '', // 后端不返回合同文本，需要时可以单独获取
            result: reviewResult,
          }
        })
        .filter(Boolean) as HistoryRecord[]

      // 合并后端记录和本地记录（去重）
      const localRecords = reviewHistory.value.filter(
        (local) => !convertedRecords.some((backend) => backend.id === local.id),
      )

      // 更新历史记录（后端记录优先）
      reviewHistory.value = [...convertedRecords, ...localRecords]

      // 保存到本地存储
      saveReviewHistory()
    }
  } catch (error) {
    // 静默失败，不影响用户体验
  } finally {
    loadingRecordList.value = false
  }
}

// 生成合同标题
function generateContractTitle(text: string): string {
  const lines = text.split('\n').filter((line) => line.trim())
  if (lines.length === 0) return '未命名合同'

  // 尝试从前几行找到标题
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i].trim()
    if (line.length > 2 && line.length < 30) {
      return line
    }
  }

  // 使用前20个字符
  const firstLine = lines[0].trim()
  return firstLine.length > 20 ? firstLine.substring(0, 20) + '...' : firstLine
}

// 格式化审查时间（用于保存）
function formatReviewTime(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 是否保存当前审查结果为新记录（重新上传时的选择）
const saveAsNewRecord = ref<boolean>(true)

// 点击上传按钮
function handleUploadClick() {
  // 如果已有审查结果且是重新上传，弹窗询问
  if (fileUploaded.value && hasResult.value) {
    ElMessageBox.confirm('是否将当前审查结果保存至审查记录？', '重新上传', {
      confirmButtonText: '是',
      cancelButtonText: '否',
      type: 'warning',
      distinguishCancelAndClose: true,
    })
      .then(() => {
        // 用户选择"是"，保存为新记录
        saveAsNewRecord.value = true
        fileInputRef.value?.click()
      })
      .catch((action) => {
        if (action === 'cancel') {
          // 用户选择"否"，覆盖当前记录
          saveAsNewRecord.value = false
          fileInputRef.value?.click()
        }
        // 如果是 close（点击X关闭），不做任何操作
      })
  } else {
    // 首次上传，直接打开文件选择
    saveAsNewRecord.value = true
    fileInputRef.value?.click()
  }
}

// 处理文件选择
async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 检查文件大小（限制10MB）
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过10MB')
    return
  }

  // 检查文件类型
  const allowedTypes = ['.txt', '.doc', '.docx', '.pdf']
  const fileName = file.name.toLowerCase()
  const isAllowed = allowedTypes.some((type) => fileName.endsWith(type))

  if (!isAllowed) {
    ElMessage.error('仅支持 .txt、.doc、.docx、.pdf 格式的文件')
    return
  }

  // 清除之前的审查结果（准备新的审查）
  reviewResult.value = null
  originalContractText.value = ''
  activeIssueId.value = ''

  // 读取文件内容（仅对txt文件）
  if (fileName.endsWith('.txt')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      contractText.value = e.target?.result as string
      fileUploaded.value = true
      ElMessage.success('文件上传成功，请点击开始审查')
    }
    reader.onerror = () => {
      ElMessage.error('文件读取失败')
    }
    reader.readAsText(file)
  } else {
    // 对于其他格式，调用后端接口解析文件内容
    ElMessage.info('文件已上传，正在解析...')

    // 如果是PDF文件，显示格式转换提示
    if (fileName.endsWith('.pdf')) {
      ElMessage.info('PDF文件的格式已转换为文本格式进行解析')
    }

    // 调用文档解析API
    try {
      const parseResult = await parseFileContent(file)
      contractText.value = parseResult.text
      fileUploaded.value = true
      ElMessage.success('文件解析成功，请点击开始审查')
    } catch (error) {
      ElMessage.error('文件解析失败，请稍后重试')
      // 清理状态
      fileUploaded.value = false
      contractText.value = ''
    }
  }

  // 重置input，允许重复选择同一文件
  target.value = ''
}

// 开始审查
async function startReview() {
  if (!canReview.value) return

  // 保存原始文本
  originalContractText.value = contractText.value

  reviewing.value = true
  reviewResult.value = null
  activeIssueId.value = ''

  try {
    // 获取对话ID
    if (!conversationId.value) {
      conversationId.value = await getConversationId()
    }

    // 调用后端AI审查接口
    const reviewResponse = await submitFileReview(
      contractText.value,
      conversationId.value,
      generateContractTitle(contractText.value) + '.txt',
    )

    // 解析审查结果
    parseReviewResult(reviewResponse.review)

    // 审查完成后自动保存到历史
    await saveToHistory()

    ElMessage.success('审查完成')
  } catch (error) {
    ElMessage.error('审查失败，请稍后重试')
  } finally {
    reviewing.value = false
  }
}

/**
 * 在文本中查找问题的位置
 * @param text 原始文本
 * @param originalText 问题文本
 * @returns {startIndex, endIndex}
 */
function findTextPosition(
  text: string,
  originalText: string,
): { startIndex: number; endIndex: number } {
  if (!originalText || !text) {
    return { startIndex: 0, endIndex: 0 }
  }

  // 尝试精确匹配
  const index = text.indexOf(originalText)
  if (index !== -1) {
    return {
      startIndex: index,
      endIndex: index + originalText.length,
    }
  }

  // 如果精确匹配失败，尝试模糊匹配（忽略空白和换行）
  const normalizedOriginal = originalText.replace(/\s+/g, '')
  const normalizedText = text.replace(/\s+/g, '')
  const normalizedIndex = normalizedText.indexOf(normalizedOriginal)

  if (normalizedIndex !== -1) {
    // 找到归一化后的位置，需要转换回原始位置
    let charCount = 0
    let actualIndex = 0

    for (let i = 0; i < text.length && charCount < normalizedIndex; i++) {
      if (!/\s/.test(text[i])) {
        charCount++
      }
      actualIndex++
    }

    return {
      startIndex: actualIndex,
      endIndex: Math.min(actualIndex + originalText.length, text.length),
    }
  }

  // 如果都找不到，返回默认值
  return { startIndex: 0, endIndex: 0 }
}

// 解析审查结果
function parseReviewResult(reviewText: string) {
  if (!reviewText || typeof reviewText !== 'string') {
    ElMessage.error('审查结果格式错误')
    reviewing.value = false
    return
  }

  try {
    const parsed = JSON.parse(reviewText)

    if (parsed && typeof parsed === 'object') {
      // 获取不同类型的问题数组
      const rawIllegalIssues = parsed.illegalIssues || parsed.illegal || []
      const rawRiskIssues = parsed.riskIssues || parsed.risk || []
      const rawMissingIssues = parsed.missingIssues || parsed.missing || []

      const contractTextValue = originalContractText.value || contractText.value

      // 映射明显违法问题
      const illegalIssues = Array.isArray(rawIllegalIssues)
        ? rawIllegalIssues.map((item: any) => {
            const originalTextContent = item.originalSentence || item.originalText || ''
            let startIndex = item.startIndex
            let endIndex = item.endIndex

            // 调试信息：检查后端索引是否匹配
            if (typeof startIndex === 'number' && typeof endIndex === 'number') {
              const extractedText = contractTextValue.substring(startIndex, endIndex)
              if (extractedText !== originalTextContent) {
                // 重新查找正确位置
                const position = findTextPosition(contractTextValue, originalTextContent)
                startIndex = position.startIndex
                endIndex = position.endIndex
              }
            } else {
              // 如枟后端没有提供索引，在文本中查找
              const position = findTextPosition(contractTextValue, originalTextContent)
              startIndex = position.startIndex
              endIndex = position.endIndex
            }

            return {
              id: item.id || `illegal_${Date.now()}_${Math.random()}`,
              type: 'illegal' as const,
              originalText: originalTextContent,
              relatedLaw: item.relatedClauses || item.relatedLaw || '',
              suggestion: item.suggestion || '',
              startIndex: startIndex,
              endIndex: endIndex,
            }
          })
        : []

      // 映射风险问题
      const riskIssues = Array.isArray(rawRiskIssues)
        ? rawRiskIssues.map((item: any) => {
            const originalTextContent = item.originalSentence || item.originalText || ''
            let startIndex = item.startIndex
            let endIndex = item.endIndex

            // 调试信息：检查后端索引是否匹配
            if (typeof startIndex === 'number' && typeof endIndex === 'number') {
              const extractedText = contractTextValue.substring(startIndex, endIndex)
              if (extractedText !== originalTextContent) {
                // 重新查找正确位置
                const position = findTextPosition(contractTextValue, originalTextContent)
                startIndex = position.startIndex
                endIndex = position.endIndex
              }
            } else {
              // 如枟后端没有提供索引，在文本中查找
              const position = findTextPosition(contractTextValue, originalTextContent)
              startIndex = position.startIndex
              endIndex = position.endIndex
            }

            return {
              id: item.id || `risk_${Date.now()}_${Math.random()}`,
              type: 'risk' as const,
              originalText: originalTextContent,
              relatedLaw: item.relatedClauses || item.relatedLaw || '',
              suggestion: item.suggestion || '',
              startIndex: startIndex,
              endIndex: endIndex,
            }
          })
        : []

      // 映射缺失问题（缺失问题通常没有在文本中的位置）
      const missingIssues = Array.isArray(rawMissingIssues)
        ? rawMissingIssues.map((item: any) => ({
            id: item.id || `missing_${Date.now()}_${Math.random()}`,
            type: 'missing' as const,
            originalText: item.originalSentence || item.originalText || '',
            relatedLaw: item.relatedClauses || item.relatedLaw || '',
            suggestion: item.suggestion || '',
            startIndex: 0,
            endIndex: 0,
          }))
        : []

      reviewResult.value = {
        illegalIssues,
        riskIssues,
        missingIssues,
      }

      return
    }

    // 如果解析失败，显示错误
    ElMessage.error('审查结果解析失败，请重试')
    reviewing.value = false
  } catch (error) {
    ElMessage.error('审查结果解析失败，请重试')
    reviewing.value = false
  }
}

// 定位到问题位置
function locateIssue(issueId: string) {
  activeIssueId.value = issueId

  // 滚动到对应位置
  nextTick(() => {
    const element = document.querySelector(`[data-issue-id="${issueId}"]`)
    if (element && textDisplayRef.value) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // 添加闪烁效果
      element.classList.add('flash-highlight')
      setTimeout(() => {
        element.classList.remove('flash-highlight')
      }, 1500)
    }
  })
}

// 处理文本编辑
function handleTextEdit(event: Event) {
  const target = event.target as HTMLElement
  const newText = target.innerText

  // 更新合同文本
  contractText.value = newText

  // 文本修改后，自动更新历史记录中的当前版本
  if (currentRecordId.value && reviewHistory.value.length > 0) {
    const index = reviewHistory.value.findIndex((item) => item.id === currentRecordId.value)
    if (index !== -1) {
      reviewHistory.value[index].contractText = newText
      saveReviewHistory()
    }
  }
}

// 清空内容
function clearContent() {
  if (hasResult.value) {
    ElMessageBox.confirm('清空后将保存当前审查结果到历史记录，是否继续？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        // 已经在审查完成时保存过，这里只需清空
        contractText.value = ''
        originalContractText.value = ''
        reviewResult.value = null
        fileUploaded.value = false
        activeIssueId.value = ''
        currentRecordId.value = ''
        saveAsNewRecord.value = true
        ElMessage.success('已清空并保存记录')
      })
      .catch(() => {
        // 取消操作
      })
  } else {
    contractText.value = ''
    originalContractText.value = ''
    fileUploaded.value = false
    currentRecordId.value = ''
    saveAsNewRecord.value = true
  }
}

// 导出结果（下拉菜单命令）
function handleExportCommand(command: string) {
  if (!reviewResult.value) return

  if (command === 'pdf') {
    exportToPDF()
  } else if (command === 'word') {
    exportToWord()
  }
}

// 导出为PDF
async function exportToPDF() {
  if (!reviewResult.value || !conversationId.value) {
    ElMessage.warning('没有可导出的内容')
    return
  }

  try {
    ElMessage.info('正在生成PDF文件...')

    const downloadRequest: FileDownloadRequest = {
      isChange: false, // 默认false，后续可根据实际需求调整
      conversationId: conversationId.value,
      contentType: 'pdf',
      content: contractText.value, // 合同文本内容
    }

    const blob = await downloadFile(downloadRequest)

    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${currentFileName.value || '合同审查结果'}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('PDF文件下载成功')
  } catch (error: any) {
    ElMessage.error(error.message || '导出PDF失败，请稍后重试')
  }
}

// 导出为Word
async function exportToWord() {
  if (!reviewResult.value || !conversationId.value) {
    ElMessage.warning('没有可导出的内容')
    return
  }

  try {
    ElMessage.info('正在生成Word文件...')

    const downloadRequest: FileDownloadRequest = {
      isChange: false, // 默认false，后续可根据实际需求调整
      conversationId: conversationId.value,
      contentType: 'docx',
      content: contractText.value, // 合同文本内容
    }

    const blob = await downloadFile(downloadRequest)

    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${currentFileName.value || '合同审查结果'}.docx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('Word文件下载成功')
  } catch (error: any) {
    ElMessage.error(error.message || '导出Word失败，请稍后重试')
  }
}

// 显示历史记录弹窗
async function showHistoryDialog() {
  historyDialogVisible.value = true
  // 同步后端记录列表
  await syncRecordListFromBackend()
}

// 加载历史记录
async function loadHistory(record: HistoryRecord) {
  // 关闭历史对话框
  historyDialogVisible.value = false

  // 如果记录ID以'review_'开头，说明是本地生成的ID，直接使用本地数据
  if (record.id.startsWith('review_')) {
    loadLocalHistory(record)
    return
  }

  // 尝试从后端获取最新数据
  try {
    // 先设置合同文本（从本地记录中）
    if (record.contractText) {
      contractText.value = record.contractText
      originalContractText.value = record.contractText
    }

    // 再加载后端记录详情
    await loadReviewRecordDetail(record.id)

    // 修复索引位置（如果有合同文本和审查结果）
    if (reviewResult.value && contractText.value) {
      reviewResult.value = fixResultIndices(reviewResult.value, contractText.value)
    }

    fileUploaded.value = true
    saveAsNewRecord.value = false // 加载已有记录，不保存为新记录
  } catch (error) {
    // 后端加载失败，使用本地数据
    loadLocalHistory(record)
  }
}

/**
 * 修复审查结果中的索引位置
 * @param result 审查结果
 * @param text 合同文本
 */
function fixResultIndices(result: ReviewResult, text: string): ReviewResult {
  const fixIssue = (issue: Issue): Issue => {
    // 如果索引不存在（undefined/null）或者两个索引都是0，尝试重新查找
    const hasNoIndex = typeof issue.startIndex !== 'number' || typeof issue.endIndex !== 'number'
    const bothZero = issue.startIndex === 0 && issue.endIndex === 0

    if (hasNoIndex || bothZero) {
      const position = findTextPosition(text, issue.originalText)
      return {
        ...issue,
        startIndex: position.startIndex,
        endIndex: position.endIndex,
      }
    }
    return issue
  }

  return {
    illegalIssues: result.illegalIssues.map(fixIssue),
    riskIssues: result.riskIssues.map(fixIssue),
    missingIssues: result.missingIssues || [],
  }
}

// 加载本地历史记录
function loadLocalHistory(record: HistoryRecord) {
  contractText.value = record.contractText
  originalContractText.value = record.contractText

  // 修复索引位置
  reviewResult.value = fixResultIndices(record.result, record.contractText)

  activeIssueId.value = ''
  currentRecordId.value = record.id
  fileUploaded.value = true
  saveAsNewRecord.value = true
  ElMessage.success('已加载历史记录')
}

// 删除历史记录
async function deleteHistory(id: string) {
  try {
    await ElMessageBox.confirm('删除后不可恢复', '确认删除该审查记录？', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
      showCancelButton: true,
      showClose: true,
      closeOnClickModal: false,
      closeOnPressEscape: true,
      center: false,
    })

    // 设置删除状态
    deletingRecordId.value = id

    let backendDeleteSuccess = false

    // 如果不是本地生成的ID，尝试从后端删除
    if (!id.startsWith('review_')) {
      try {
        const response = await deleteReviewRecord(id)
        if (response && response.success) {
          backendDeleteSuccess = true
          ElMessage.success('已从后端删除记录')
        } else {
          ElMessage.warning(`后端删除失败：${response?.message || '未知错误'}，仅删除本地记录`)
        }
      } catch (error) {
        ElMessage.warning('后端删除失败，仅删除本地记录')
      }
    }

    // 删除本地历史记录
    const index = reviewHistory.value.findIndex((item) => item.id === id)
    if (index !== -1) {
      reviewHistory.value.splice(index, 1)
      saveReviewHistory()

      if (!backendDeleteSuccess) {
        ElMessage.success('删除成功')
      }

      // 如果删除的是当前正在查看的记录，清空当前记录ID
      if (currentRecordId.value === id) {
        currentRecordId.value = ''
      }
    }
  } catch (error) {
    // 用户点击取消或关闭
  } finally {
    // 清除删除状态
    deletingRecordId.value = ''
  }
}

// 组件初始化
async function initializeComponent() {
  // 加载本地历史记录
  loadReviewHistory()

  // 同步后端记录列表
  try {
    await syncRecordListFromBackend()
  } catch (error) {
    // 初始化时同步后端记录失败
  }
}

// 组件挂载时初始化
initializeComponent()
</script>

<style scoped lang="scss">
.contract-review {
  display: flex;
  gap: 20px;
  height: calc(100vh - 180px);
}

.left-panel,
.right-panel {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.left-panel {
  width: 45%;
  min-width: 500px;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

.input-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }

  .el-button {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.input-hint {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}

.text-display-container {
  flex: 1;
  margin-bottom: 16px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
}

.text-display {
  height: 100%;

  :deep(.el-scrollbar__wrap) {
    overflow-x: hidden;
  }
}

.highlighted-text {
  padding: 12px;
  font-family: 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  min-height: 100%;
  outline: none;
  white-space: pre-wrap;
  word-break: break-word;

  :deep(.highlight-illegal) {
    background-color: rgba(245, 108, 108, 0.15);
    border-bottom: 2px solid #f56c6c;
    cursor: pointer;
    transition: all 0.3s;
    padding: 2px 0;

    &:hover {
      background-color: rgba(245, 108, 108, 0.25);
    }
  }

  :deep(.highlight-risk) {
    background-color: rgba(230, 162, 60, 0.15);
    border-bottom: 2px solid #e6a23c;
    cursor: pointer;
    transition: all 0.3s;
    padding: 2px 0;

    &:hover {
      background-color: rgba(230, 162, 60, 0.25);
    }
  }

  :deep(.flash-highlight) {
    animation: flash 1.5s ease-in-out;
  }
}

@keyframes flash {
  0%,
  100% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(64, 158, 255, 0.3);
  }
}

.contract-input {
  flex: 1;
  margin-bottom: 16px;

  :deep(.el-textarea__inner) {
    font-family: 'Microsoft YaHei', sans-serif;
    font-size: 14px;
    line-height: 1.8;
    border-radius: 6px;
    resize: none;

    &:focus {
      border-color: #409eff;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 10px;

  .primary-btn {
    flex: 2;
  }

  .el-button {
    font-size: 14px;
  }
}

.result-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  text-align: center;
  padding: 24px;
  gap: 12px;

  .empty-icon {
    color: #dcdfe6;
  }

  .empty-title {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
  }

  .empty-subtitle {
    font-size: 14px;
    color: #909399;
    line-height: 1.6;
  }
}

.reviewing-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .reviewing-text {
    font-size: 16px;
    font-weight: 400;
    color: #409eff;
    margin-top: 16px;
  }
}

.result-content {
  flex: 1;
  margin-top: 12px;

  :deep(.el-scrollbar__wrap) {
    overflow-x: hidden;
  }
}

.compliance-block {
  background: #f0f9ff;
  border: 1px solid #b3e0ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;

  .compliance-header {
    display: flex;
    align-items: center;
    gap: 8px;

    .compliance-title {
      font-size: 15px;
      font-weight: 600;
      color: #67c23a;
    }
  }
}

.issue-block {
  margin-bottom: 20px;

  .issue-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding: 8px 12px;
    border-radius: 6px;

    .issue-title {
      font-size: 14px;
      font-weight: 600;
    }
  }

  &.illegal-block .issue-header {
    background: #fef0f0;

    .issue-title {
      color: #f56c6c;
    }
  }

  &.risk-block .issue-header {
    background: #fdf6ec;

    .issue-title {
      color: #e6a23c;
    }
  }

  &.missing-block .issue-header {
    background: #f4f4f5;

    .issue-title {
      color: #909399;
    }
  }
}

.issue-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  margin-bottom: 10px;
  background: #fafafa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #f5f7fa;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &.active {
    background: #ecf5ff;
    border-color: #409eff;
  }

  .issue-order {
    width: 24px;
    height: 24px;
    background: #409eff;
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .issue-content {
    flex: 1;
    font-size: 13px;
    line-height: 1.8;

    .issue-original,
    .issue-law,
    .issue-suggestion {
      margin-bottom: 8px;
      color: #606266;

      &:last-child {
        margin-bottom: 0;
      }

      strong {
        font-weight: 600;
        color: #303133;
      }
    }

    .issue-original {
      color: #303133;
    }

    .issue-law {
      color: #666;
      font-size: 12px;
    }

    .issue-suggestion {
      color: #409eff;
      background: #ecf5ff;
      padding: 6px 10px;
      border-radius: 4px;
      margin-top: 8px;
    }
  }
}

// 历史记录弹窗样式
.history-dialog {
  :deep(.el-dialog__body) {
    padding: 0 20px 20px;
  }
}

.history-scrollbar {
  :deep(.el-scrollbar__wrap) {
    overflow-x: hidden;
  }
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;

  .empty-text {
    margin-top: 16px;
    font-size: 14px;
    color: #909399;
  }
}

.history-list {
  padding: 8px 0;
}

.history-group {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }

  .group-date {
    font-size: 13px;
    font-weight: 600;
    color: #909399;
    padding: 8px 12px;
    margin-bottom: 8px;
    background: #f5f7fa;
    border-radius: 4px;
  }
}

.history-record {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #f5f7fa;
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
  }

  .record-main {
    flex: 1;
    min-width: 0;
  }

  .record-title {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .record-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .record-time {
      font-size: 12px;
      color: #909399;
    }

    .record-tag {
      font-size: 12px;
    }
  }

  .delete-icon {
    flex-shrink: 0;
    margin-left: 12px;
    color: #f56c6c;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      color: #f23c3c;
      transform: scale(1.1);
    }

    &.loading {
      color: #909399;
      cursor: not-allowed;
      animation: spin 1s linear infinite;

      &:hover {
        transform: none;
        color: #909399;
      }
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1400px) {
  .contract-review {
    flex-direction: column;
    height: auto;
  }

  .left-panel {
    width: 100%;
    min-width: 0;
  }

  .right-panel {
    min-height: 600px;
  }
}
</style>
