import request from './index'

/**
 * 法律文档（后端返回的原始结构）
 */
export interface LawDocument {
  id: number
  lawName: string
  lawCategoryId: number
  articleNumber: number
  originalText: string
  originalTextSegmented: string
  issueYear: number | null
  relatedRegulationIds: string | null
  createTime: string
}

/**
 * 法规信息（用于国家法规列表）
 */
export interface RegulationVO {
  regulationId: number
  issueYear: string
  articleNumber: number
  originalText: string
}

/**
 * 法律分类及其法规
 */
export interface LawCategoryWithRegulationsVO {
  lawId: number
  lawName: string
  categoryType: number
  regulations: RegulationVO[]
}

/**
 * 国家法规分页响应
 */
export interface NationalLawsPageResponse {
  content: LawCategoryWithRegulationsVO[]
  page: number // 当前页码（从1开始）
  size: number // 每页大小
  total: number // 总记录数
  totalPages: number // 总页数
  hasNext: boolean // 是否有下一页
  hasPrevious: boolean // 是否有上一页
  isFirst: boolean // 是否为第一页
  isLast: boolean // 是否为最后一页
  isEmpty: boolean // 是否为空
}

/**
 * 国家法规API响应
 */
export interface NationalLawsResponse {
  code: number
  message: string
  data: NationalLawsPageResponse
  success: boolean
  timestamp: number
}

/**
 * 法律文档及其AI解析
 */
export interface LawDocumentWithAnalysis {
  lawDocument: LawDocument // 法律文档
  aiAnalysis: string // AI解析内容（Markdown格式）
}

/**
 * 相关案例
 */
export interface RelevantCase {
  caseContent: string // 案例内容
  caseLink: string // 案例链接
}

/**
 * 知识库单条法规数据
 */
export interface KnowledgeRegulationItem {
  lawName: string // 法律名称，如"使用有毒物品作业场所劳动保护条例_20241206"
  regulationContent: string // 法规原文内容
  aiTranslateContent: string // AI翻译/解析内容
  relevantCases: RelevantCase[] // 相关案例列表
  relevantQuestions: string[] // 相关问题列表
  articleNumber: number // 条款编号（第几条）
  totalArticles: number // 该法律总条款数
  issueYear: string | null // 发布年份
}

/**
 * 知识库查询响应数据
·· * 注意：由于响应拦截器已提取 data 字段，实际返回的就是数组本身
 */
export type KnowledgeQueryResponseData = KnowledgeRegulationItem[]

/**
 * 热点专栏主题列表响应数据
 * 注意：由于响应拦截器已提取 data 字段，实际返回的就是字符串数组本身
 */
export type HotTopicsResponseData = string[]

/**
 * 常见场景列表响应数据
 * 注意：由于响应拦截器已提取 data 字段，实际返回的就是字符串数组本身
 */
export type CommonCasesResponseData = string[]

/**
 * 用户历史记录响应数据
 * 注意：由于响应拦截器已提取 data 字段，实际返回的就是字符串数组本身
 */
export type UserHistoryResponseData = string[]

/**
 * 知识库查询请求参数
 */
export interface KnowledgeQueryRequest {
  question: string // 用户问题（必需）
}

/**
 * 知识库查询响应
 */
export interface KnowledgeQueryResponse {
  code: number
  message: string
  data: KnowledgeQueryResponseData
  success: boolean
  timestamp: number
}

/**
 * 法条详情（用于前端展示，兼容旧结构）
 */
export interface LawArticle {
  id: string
  regulationId?: number // 法律条款ID（用于收藏接口）
  lawName: string // 法律名称，如《中华人民共和国劳动合同法》
  articleNumber: string // 条款编号，如"第47条"
  title: string // 条款标题
  content: string // 原文内容
  interpretation: string // 释义（本条的适用情形）
  relatedArticles: RelatedArticle[] // 关联法条
  relatedCases?: RelatedCase[] // 相关案例（可选）
  relatedQuestions: string[] // 相关问题
  category: string // 分类：法律法规、常见场景、热点专题
  isFavorite?: boolean // 是否已收藏
}

/**
 * 关联法条
 */
export interface RelatedArticle {
  id: string
  lawName: string
  articleNumber: string
  title: string
}

/**
 * 相关案例
 */
export interface RelatedCase {
  title: string
  url: string
}

/**
 * 推荐法条响应
 */
export interface RecommendedArticlesResponse {
  code: number
  message: string
  data: {
    recommendationText: string // 推荐文本，如"根据您的问题为您推荐"
    articles: LawArticle[] // 推荐的法条列表
  }
  success: boolean
}

/**
 * 搜索法条响应
 */
export interface SearchArticlesResponse {
  code: number
  message: string
  data: LawArticle[]
  success: boolean
}

/**
 * 分类法条响应
 */
export interface CategoryArticlesResponse {
  code: number
  message: string
  data: LawArticle[]
  success: boolean
}

/**
 * 收藏/取消收藏响应
 */
export interface FavoriteResponse {
  code: number
  message: string
  data: boolean
  success: boolean
  timestamp: number
}

/**
 * 用户收藏的法规信息
 */
export interface UserFavoriteRegulation {
  id: number // 收藏ID
  userId: number // 用户ID
  regulationId: number // 法规ID
  regulationName: string // 法规名称
  lawCategoryId: number // 法律分类ID
  issueYear: string // 发布年份
  articleNumber: number // 条款号（第几条）
  originalText: string // 法条原文
  createdTime: string // 收藏时间
}

/**
 * 收藏列表响应
 */
export interface FavoriteListResponse {
  code: number
  message: string
  data: UserFavoriteRegulation[]
  success: boolean
  timestamp: number
}

/**
 * 收藏数量响应
 */
export interface FavoriteCountResponse {
  code: number
  message: string
  data: number
  success: boolean
  timestamp: number
}

/**
 * 检查收藏状态响应
 */
export interface CheckFavoriteResponse {
  code: number
  message: string
  data: boolean
  success: boolean
  timestamp: number
}

/**
 * 知识库查询（主接口）
 * 根据用户问题查询相关法律文档并返回AI解析
 * @param data 查询请求参数
 * 注意：由于响应拦截器已提取 data 字段，实际返回 KnowledgeQueryResponseData
 */
export async function queryKnowledge(
  data: KnowledgeQueryRequest,
): Promise<KnowledgeQueryResponseData> {
  return request.get('/knowledgebs/query', {
    params: {
      question: data.question,
    },
  })
}

/**
 * 获取热点专栏主题列表
 * @returns 热点专栏主题字符串数组
 * 注意：由于响应拦截器已提取 data 字段，实际返回的就是字符串数组本身
 */
export async function getHotTopics(): Promise<HotTopicsResponseData> {
  return request.get('/knowledgebs/topic')
}

/**
 * 获取常见场景列表
 * @returns 常见场景字符串数组
 * 注意：由于响应拦截器已提取 data 字段，实际返回的就是字符串数组本身
 */
export async function getCommonCases(): Promise<CommonCasesResponseData> {
  return request.get('/knowledgebs/case')
}

/**
 * 获取用户历史记录
 * @returns 用户历史搜索记录字符串数组
 * 注意：由于响应拦截器已提取 data 字段，实际返回的就是字符串数组本身
 */
export async function getUserHistory(): Promise<UserHistoryResponseData> {
  return request.get('/knowledgebs/history')
}

/**
 * 删除指定的历史记录
 * @param historyQuery 要删除的历史记录查询内容
 * @returns Promise<void>
 */
export async function deleteUserHistory(historyQuery: string): Promise<void> {
  return request.delete('/knowledgebs/history/delete', {
    params: {
      historyQuery,
    },
  })
}

/**
 * 获取推荐法条
 * @param lastQuestion 用户咨询的最后一个问题
 */
export async function getRecommendedArticles(
  lastQuestion?: string,
): Promise<RecommendedArticlesResponse> {
  return request.post('/knowledge/recommend', { lastQuestion })
}

/**
 * 搜索法条
 * @param keyword 关键词
 */
export async function searchArticles(keyword: string): Promise<SearchArticlesResponse> {
  return request.get('/knowledge/search', { params: { keyword } })
}

/**
 * 根据分类获取法条
 * @param category 分类：法律法规、常见场景、热点专题
 * @param subCategory 子分类（可选）
 */
export async function getArticlesByCategory(
  category: string,
  subCategory?: string,
): Promise<CategoryArticlesResponse> {
  return request.get('/knowledge/category', { params: { category, subCategory } })
}

/**
 * 根据法规ID获取法条详情及AI解析
 * @param regulationId 法规ID
 * @returns 返回法条的完整信息，包括AI解析
 *
 * 需要后端实现此接口：
 * - 根据 regulationId 查询法律文档
 * - 调用AI生成完整的解析内容（标题、原文、释义、关联法条、相关案例、相关问题）
 * - 返回格式应该与 /knowledge/query 相同，但只返回单条法条
 */
export async function getRegulationDetail(regulationId: number): Promise<LawDocumentWithAnalysis> {
  return request.get(`/knowledge/regulation/${regulationId}`)
}

/**
 * 获取法条详情（旧接口，保留兼容性）
 * @param articleId 法条ID
 */
export async function getArticleDetail(articleId: string): Promise<LawArticle> {
  return request.get(`/knowledge/article/${articleId}`)
}

/**
 * 添加法律条款收藏
 * @param regulationId 法则ID
 */
export async function addFavorite(regulationId: number): Promise<FavoriteResponse> {
  return request.post('/lawFavor/add', null, { params: { regulationId } })
}

/**
 * 删除法律条款收藏
 * @param regulationId 法则ID
 */
export async function removeFavorite(regulationId: number): Promise<FavoriteResponse> {
  return request.delete('/lawFavor/remove', { params: { regulationId } })
}

/**
 * 获取收藏列表
 */
export async function getFavoriteList(): Promise<UserFavoriteRegulation[]> {
  return request.get('/lawFavor/list')
}

/**
 * 查询用户的收藏数量
 */
export async function getFavoriteCount(): Promise<number> {
  return request.get('/lawFavor/count')
}

/**
 * 查询用户是否已收藏某法规
 * @param regulationId 法规ID
 */
export async function checkFavorite(regulationId: number): Promise<boolean> {
  return request.get('/lawFavor/check', { params: { regulationId } })
}

/**
 * 查询所有国家法规及其关联的法律条款（分页）
 * @param page 页码（从1开始，默认1）
 * @param size 每页大小（默认10）
 * @returns 分页的国家法规数据 (category_type=1)
 */
export async function getNationalLaws(
  page: number = 1,
  size: number = 10,
): Promise<NationalLawsPageResponse> {
  return request.get('/law/national-laws', {
    params: {
      page,
      size,
    },
  })
}

/**
 * 查询所有地方法规及其关联的法律条款（分页）
 * @param page 页码（从1开始，默认1）
 * @param size 每页大小（默认10）
 * @returns 分页的地方法规数据 (category_type=0)
 */
export async function getLocalLaws(
  page: number = 1,
  size: number = 10,
): Promise<NationalLawsPageResponse> {
  return request.get('/law/local-laws', {
    params: {
      page,
      size,
    },
  })
}
