<template>
  <div class="category-menu">
    <div class="title">常见问题分类</div>
    <el-scrollbar class="scrollbar">
      <el-menu class="menu" :default-openeds="openedMenus">
        <el-sub-menu v-for="category in categories" :key="category.id" :index="category.id">
          <template #title>
            <span class="primary-title">{{ category.label }}</span>
          </template>
          <el-menu-item
            v-for="child in category.children"
            :key="child.id"
            :index="child.id"
            @click="handleSelect(child)"
          >
            <span class="secondary-title" :title="child.label">
              {{ truncateText(child.label, 15) }}
            </span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface QuestionItem {
  id: string
  label: string
  content: string
}

interface Category {
  id: string
  label: string
  children?: QuestionItem[]
}

const props = defineProps<{
  categories: Category[]
}>()

const emit = defineEmits<{
  (e: 'select-question', content: string): void
}>()

// 默认展开所有一级菜单
const openedMenus = computed(() => props.categories.map((cat) => cat.id))

// 处理二级标题点击
function handleSelect(item: QuestionItem) {
  emit('select-question', item.content)
}

// 文字截断函数：超过指定长度显示省略号
function truncateText(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<style scoped lang="scss">
.category-menu {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .title {
    padding: 16px 20px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    border-bottom: 1px solid #e4e7ed;
    flex-shrink: 0;
  }

  .scrollbar {
    flex: 1;
    overflow: hidden;

    :deep(.el-scrollbar__view) {
      padding: 8px 0;
    }

    :deep(.el-scrollbar__wrap) {
      overflow-x: hidden;
    }
  }

  .menu {
    border-right: none;

    :deep(.el-sub-menu__title) {
      height: 48px;
      line-height: 48px;
      font-size: 14px;
      font-weight: 500;

      .primary-title {
        color: #303133;
      }

      &:hover {
        background-color: #f5f7fa;
      }
    }

    :deep(.el-menu-item) {
      height: 44px;
      line-height: 44px;
      padding-left: 48px !important;

      .secondary-title {
        color: #606266;
        font-size: 14px;
      }

      &:hover {
        background-color: #ecf5ff;
        color: #409eff;

        .secondary-title {
          color: #409eff;
        }
      }
    }
  }
}
</style>
