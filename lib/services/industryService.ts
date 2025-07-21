export interface IndustryHierarchy {
  [category: string]: {
    label: string
    industries: string[]
    aliases?: string[] // Alternative names for the same industry
  }
}

// Industry categorization based on research of major job platforms and VC/finance terminology
export const INDUSTRY_HIERARCHY: IndustryHierarchy = {
  '科技互联网': {
    label: '科技互联网',
    industries: [
      '软件开发', '互联网', '人工智能', 'AI', '机器学习', '数据科学', '大数据',
      '网络安全', '信息安全', '移动开发', 'APP开发', '前端开发', '后端开发',
      '全栈开发', '云计算', '区块链', '物联网', 'IoT', '游戏开发', '电子商务',
      '在线教育', '社交媒体', '搜索引擎', '内容平台', '技术咨询', '软件测试',
      '产品管理', 'SaaS', 'PaaS', 'IaaS', '开发运维', 'DevOps'
    ]
  },
  '金融投资': {
    label: '金融投资',
    industries: [
      // Investment & PE/VC
      '风险投资', 'VC', '私募股权', 'PE', '投资银行', '证券', '基金管理',
      '资产管理', '财富管理', '投资咨询', '并购', 'M&A', '股权投资',
      '债权投资', '量化投资', '对冲基金', '创业投资', '天使投资',
      
      // Traditional Finance
      '银行', '保险', '信托', '期货', '外汇', '支付', '金融科技', 'FinTech',
      '数字货币', '加密货币', '财务分析', '风险管理', '合规', '审计',
      '会计', '税务', '金融服务', '信贷', '理财', '融资租赁'
    ],
    aliases: ['FA', '财务顾问', '金融顾问', 'Financial Advisor']
  },
  '咨询服务': {
    label: '咨询服务',
    industries: [
      '管理咨询', '战略咨询', '技术咨询', 'IT咨询', '人力资源咨询',
      '财务咨询', '法律咨询', '营销咨询', '运营咨询', '组织发展',
      '业务流程优化', '数字化转型', '企业重组', '尽职调查',
      '市场研究', '商业分析', '项目管理', 'PMO'
    ]
  },
  '医疗健康': {
    label: '医疗健康',
    industries: [
      '医疗', '医院', '诊所', '医药', '制药', '生物技术', '生物医学',
      '医疗器械', '数字医疗', '互联网医疗', '医疗AI', '基因技术',
      '细胞治疗', '医学研究', '临床试验', '药物研发', '医疗服务',
      '健康管理', '康复医学', '中医', '医疗信息化', '医疗大数据'
    ]
  },
  '制造工业': {
    label: '制造工业',
    industries: [
      '制造业', '汽车', '汽车制造', '新能源汽车', '智能制造', '工业4.0',
      '航空航天', '船舶制造', '机械制造', '电子制造', '半导体',
      '芯片设计', '集成电路', '精密仪器', '自动化', '机器人',
      '3D打印', '新材料', '化工', '石油化工', '钢铁', '有色金属',
      '纺织', '服装', '家具', '食品加工', '包装', '模具'
    ]
  },
  '房地产建筑': {
    label: '房地产建筑',
    industries: [
      '房地产', '房地产开发', '建筑', '建筑设计', '工程建设',
      '施工管理', '建筑材料', '装修装饰', '园林景观', '城市规划',
      '工程咨询', '监理', '造价', '房地产投资', '物业管理',
      '商业地产', '住宅开发', '基础设施', '市政工程', '水利工程'
    ]
  },
  '消费零售': {
    label: '消费零售',
    industries: [
      '零售', '快消品', '消费品', '品牌营销', '新零售', '连锁经营',
      '百货', '超市', '便利店', '奢侈品', '时尚', '美妆', '服饰',
      '家电', '家居', '母婴', '宠物', '体育用品', '户外用品',
      '食品饮料', '餐饮', '酒店', '旅游', '娱乐', '文化产业'
    ]
  },
  '传媒广告': {
    label: '传媒广告',
    industries: [
      '广告', '营销', '公关', 'PR', '品牌管理', '数字营销', '内容营销',
      '社交媒体营销', '传媒', '新闻', '出版', '影视', '动画', '游戏',
      '直播', '短视频', '音频', '播客', '创意设计', '平面设计',
      'UI/UX设计', '视觉传达', '摄影', '视频制作'
    ]
  },
  '教育培训': {
    label: '教育培训',
    industries: [
      '教育', '在线教育', 'K12教育', '高等教育', '职业教育',
      '企业培训', '语言培训', 'IT培训', '职业技能培训',
      '学前教育', '素质教育', '国际教育', '教育科技', 'EdTech',
      '教学设计', '课程开发', '教育咨询', '留学服务'
    ]
  },
  '物流运输': {
    label: '物流运输',
    industries: [
      '物流', '供应链', '仓储', '配送', '快递', '货运', '航运',
      '港口', '机场', '铁路', '公路运输', '城市配送', '跨境物流',
      '冷链物流', '智慧物流', '物流科技', '运输管理', '库存管理'
    ]
  },
  '能源环保': {
    label: '能源环保',
    industries: [
      '新能源', '太阳能', '风能', '核能', '水电', '电力', '石油',
      '天然气', '煤炭', '节能环保', '环境保护', '污水处理',
      '垃圾处理', '环境监测', '碳交易', '清洁技术', '可再生能源',
      '储能', '电池技术', '充电桩', '智能电网'
    ]
  },
  '农业': {
    label: '农业',
    industries: [
      '农业', '现代农业', '智慧农业', '农业科技', '种植业', '养殖业',
      '农产品加工', '农业机械', '生物农业', '有机农业', '农业电商',
      '农业金融', '农业服务', '林业', '渔业', '畜牧业'
    ]
  },
  '政府公共': {
    label: '政府公共',
    industries: [
      '政府机关', '事业单位', '公共服务', '非营利组织', 'NGO',
      '社会组织', '基金会', '研究院', '智库', '公共政策',
      '社会工作', '公益', '法律服务', '律师事务所', '司法'
    ]
  }
}

export class IndustryService {
  /**
   * Group industries by category
   */
  static groupIndustriesByCategory(industries: string[]): { category: string; label: string; industries: string[] }[] {
    const categoryGroups: { [category: string]: Set<string> } = {}
    const unmapped: string[] = []

    // Initialize category groups
    Object.keys(INDUSTRY_HIERARCHY).forEach(category => {
      categoryGroups[category] = new Set()
    })

    // Categorize industries
    industries.forEach(industry => {
      let mapped = false
      const normalizedIndustry = industry.trim()
      
      for (const [category, config] of Object.entries(INDUSTRY_HIERARCHY)) {
        // Direct match
        if (config.industries.includes(normalizedIndustry)) {
          categoryGroups[category].add(normalizedIndustry)
          mapped = true
          break
        }
        
        // Fuzzy match
        const fuzzyMatch = this.fuzzyMatchIndustry(normalizedIndustry, config.industries)
        if (fuzzyMatch) {
          categoryGroups[category].add(normalizedIndustry)
          mapped = true
          break
        }
        
        // Alias match
        if (config.aliases) {
          const aliasMatch = config.aliases.some(alias => 
            normalizedIndustry.toLowerCase().includes(alias.toLowerCase()) ||
            alias.toLowerCase().includes(normalizedIndustry.toLowerCase())
          )
          if (aliasMatch) {
            categoryGroups[category].add(normalizedIndustry)
            mapped = true
            break
          }
        }
      }
      
      if (!mapped) {
        unmapped.push(normalizedIndustry)
      }
    })

    // Create result array
    const result = Object.entries(INDUSTRY_HIERARCHY).map(([category, config]) => ({
      category,
      label: config.label,
      industries: Array.from(categoryGroups[category]).sort()
    })).filter(group => group.industries.length > 0)

    // Add unmapped industries as a separate group if any exist
    if (unmapped.length > 0) {
      result.push({
        category: '其他行业',
        label: '其他行业',
        industries: [...new Set(unmapped)].sort()
      })
    }

    return result
  }

  /**
   * Get category for a specific industry
   */
  static getCategoryForIndustry(industry: string): string {
    const normalizedIndustry = industry.trim()
    
    for (const [category, config] of Object.entries(INDUSTRY_HIERARCHY)) {
      // Direct match
      if (config.industries.includes(normalizedIndustry)) {
        return category
      }
      
      // Fuzzy match
      if (this.fuzzyMatchIndustry(normalizedIndustry, config.industries)) {
        return category
      }
      
      // Alias match
      if (config.aliases) {
        const aliasMatch = config.aliases.some(alias => 
          normalizedIndustry.toLowerCase().includes(alias.toLowerCase()) ||
          alias.toLowerCase().includes(normalizedIndustry.toLowerCase())
        )
        if (aliasMatch) {
          return category
        }
      }
    }
    
    return '其他行业'
  }

  /**
   * Fuzzy match industry name with a list of industries
   */
  private static fuzzyMatchIndustry(input: string, industries: string[]): boolean {
    const normalizedInput = input.toLowerCase().trim()
    
    return industries.some(industry => {
      const normalizedIndustry = industry.toLowerCase()
      
      // Contains match
      if (normalizedInput.includes(normalizedIndustry) || normalizedIndustry.includes(normalizedInput)) {
        return true
      }
      
      // Handle common variations
      const variations = [
        { pattern: /互联网.*公司/g, target: '互联网' },
        { pattern: /软件.*开发/g, target: '软件开发' },
        { pattern: /人工智能|ai/gi, target: 'AI' },
        { pattern: /风险投资|风投/g, target: 'VC' },
        { pattern: /私募股权|私募/g, target: 'PE' },
        { pattern: /投资银行|投行/g, target: '投资银行' },
        { pattern: /房地产.*开发/g, target: '房地产开发' },
        { pattern: /新能源.*汽车/g, target: '新能源汽车' }
      ]
      
      for (const variation of variations) {
        if (variation.pattern.test(normalizedInput) && normalizedIndustry === variation.target.toLowerCase()) {
          return true
        }
      }
      
      return false
    })
  }

  /**
   * Get standardized industry name
   */
  static standardizeIndustryName(input: string): string {
    const normalizedInput = input.trim()
    
    for (const config of Object.values(INDUSTRY_HIERARCHY)) {
      // Direct match
      if (config.industries.includes(normalizedInput)) {
        return normalizedInput
      }
      
      // Find closest match
      for (const industry of config.industries) {
        if (this.fuzzyMatchIndustry(normalizedInput, [industry])) {
          return industry
        }
      }
      
      // Alias match
      if (config.aliases) {
        for (const alias of config.aliases) {
          if (normalizedInput.toLowerCase().includes(alias.toLowerCase()) ||
              alias.toLowerCase().includes(normalizedInput.toLowerCase())) {
            // Return the first matching industry in this category
            return config.industries[0]
          }
        }
      }
    }
    
    return normalizedInput // Return original if no match found
  }

  /**
   * Get all available industries
   */
  static getAllIndustries(): string[] {
    const industries: string[] = []
    Object.values(INDUSTRY_HIERARCHY).forEach(config => {
      industries.push(...config.industries)
    })
    return [...new Set(industries)].sort()
  }

  /**
   * Search industries by keyword
   */
  static searchIndustries(keyword: string): string[] {
    const normalizedKeyword = keyword.toLowerCase().trim()
    const results: Set<string> = new Set()
    
    Object.values(INDUSTRY_HIERARCHY).forEach(config => {
      config.industries.forEach(industry => {
        if (industry.toLowerCase().includes(normalizedKeyword)) {
          results.add(industry)
        }
      })
    })
    
    return Array.from(results).sort()
  }
}