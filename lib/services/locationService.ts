export interface LocationGroup {
  tier: string
  cities: string[]
}

export interface LocationHierarchy {
  [tier: string]: {
    label: string
    cities: string[]
    districts?: { [city: string]: string[] }
  }
}

// Chinese city tier classification based on major job platforms
export const LOCATION_HIERARCHY: LocationHierarchy = {
  '一线城市': {
    label: '一线城市',
    cities: ['北京', '上海', '广州', '深圳'],
    districts: {
      '北京': [
        '朝阳区', '海淀区', '西城区', '东城区', '丰台区', '石景山区',
        '通州区', '昌平区', '大兴区', '顺义区', '房山区', '门头沟区',
        '平谷区', '怀柔区', '密云区', '延庆区'
      ],
      '上海': [
        '浦东新区', '黄浦区', '徐汇区', '长宁区', '静安区', '普陀区',
        '虹口区', '杨浦区', '闵行区', '宝山区', '嘉定区', '金山区',
        '松江区', '青浦区', '奉贤区', '崇明区'
      ],
      '广州': [
        '天河区', '越秀区', '海珠区', '荔湾区', '白云区', '黄埔区',
        '番禺区', '花都区', '南沙区', '从化区', '增城区'
      ],
      '深圳': [
        '福田区', '罗湖区', '南山区', '宝安区', '龙岗区', '盐田区',
        '龙华区', '坪山区', '光明区', '大鹏新区'
      ]
    }
  },
  '新一线城市': {
    label: '新一线城市',
    cities: [
      '杭州', '南京', '武汉', '天津', '苏州', '西安', '重庆', '青岛',
      '沈阳', '长沙', '大连', '厦门', '无锡', '福州', '济南', '宁波',
      '东莞', '郑州', '南宁', '合肥', '南昌', '哈尔滨', '常州', '佛山',
      '南通', '长春', '烟台', '石家庄', '泉州', '贵阳', '温州', '徐州'
    ]
  },
  '二线城市': {
    label: '二线城市',
    cities: [
      '昆明', '太原', '潍坊', '珠海', '中山', '惠州', '嘉兴', '南阳',
      '威海', '德州', '岳阳', '聊城', '常德', '漳州', '滨州', '茂名',
      '淮安', '江门', '芜湖', '湛江', '廊坊', '菏泽', '柳州', '宜昌',
      '临沂', '襄阳', '泰州', '鞍山', '绍兴', '湖州', '呼和浩特',
      '乌鲁木齐', '盐城', '汕头', '安阳', '包头', '赣州', '邯郸',
      '保定', '桂林', '三亚', '唐山', '吉林', '宝鸡', '遵义'
    ]
  },
  '三线城市': {
    label: '三线城市',
    cities: [
      '秦皇岛', '株洲', '枣庄', '许昌', '通辽', '湘潭', '承德', '日照',
      '连云港', '新乡', '周口', '蚌埠', '驻马店', '滁州', '阜阳', '盘锦',
      '营口', '淮南', '龙岩', '开封', '海口', '黄冈', '延安', '晋中',
      '渭南', '邵阳', '宣城', '荆州', '安庆', '锦州', '九江', '黄石',
      '长治', '三门峡', '孝感', '齐齐哈尔', '信阳', '咸阳'
    ]
  },
  '海外': {
    label: '海外地区',
    cities: [
      '新加坡', '香港', '台湾', '日本', '韩国', '马来西亚', '泰国',
      '美国', '加拿大', '英国', '澳大利亚', '德国', '法国', '荷兰',
      '瑞士', '瑞典', '挪威', '丹麦', '芬兰', '意大利', '西班牙',
      '爱尔兰', '比利时', '奥地利', '新西兰', '印度', '印尼', '菲律宾',
      '越南', '阿联酋', '以色列', '土耳其', '俄罗斯', '巴西', '墨西哥',
      '阿根廷', '智利', '南非', '埃及'
    ]
  }
}

export class LocationService {
  /**
   * Group locations by city tier
   */
  static groupLocationsByTier(locations: string[]): { tier: string; label: string; cities: string[] }[] {
    const tierGroups: { [tier: string]: string[] } = {}
    const unmapped: string[] = []

    // Initialize tier groups
    Object.keys(LOCATION_HIERARCHY).forEach(tier => {
      tierGroups[tier] = []
    })

    // Categorize locations
    locations.forEach(location => {
      let mapped = false
      
      for (const [tier, config] of Object.entries(LOCATION_HIERARCHY)) {
        // Direct city match
        if (config.cities.includes(location)) {
          tierGroups[tier].push(location)
          mapped = true
          break
        }
        
        // District match - extract city name
        if (config.districts) {
          for (const [city, districts] of Object.entries(config.districts)) {
            if (districts.includes(location) || location.includes(city)) {
              // Add the city, not the district
              if (!tierGroups[tier].includes(city)) {
                tierGroups[tier].push(city)
              }
              mapped = true
              break
            }
          }
        }
        
        if (mapped) break
      }
      
      if (!mapped) {
        unmapped.push(location)
      }
    })

    // Create result array
    const result = Object.entries(LOCATION_HIERARCHY).map(([tier, config]) => ({
      tier,
      label: config.label,
      cities: [...new Set(tierGroups[tier])].sort()
    })).filter(group => group.cities.length > 0)

    // Add unmapped cities as a separate group if any exist
    if (unmapped.length > 0) {
      result.push({
        tier: '其他地区',
        label: '其他地区',
        cities: [...new Set(unmapped)].sort()
      })
    }

    return result
  }

  /**
   * Get districts for a specific city
   */
  static getDistrictsForCity(city: string): string[] {
    for (const config of Object.values(LOCATION_HIERARCHY)) {
      if (config.districts && config.districts[city]) {
        return config.districts[city]
      }
    }
    return []
  }

  /**
   * Get tier for a specific location
   */
  static getTierForLocation(location: string): string {
    for (const [tier, config] of Object.entries(LOCATION_HIERARCHY)) {
      // Direct city match
      if (config.cities.includes(location)) {
        return tier
      }
      
      // District match
      if (config.districts) {
        for (const [city, districts] of Object.entries(config.districts)) {
          if (districts.includes(location) || location.includes(city)) {
            return tier
          }
        }
      }
    }
    return '其他地区'
  }

  /**
   * Fuzzy match location to handle variations
   */
  static fuzzyMatchLocation(input: string): string | null {
    const normalizedInput = input.trim()
    
    // Direct match first
    for (const config of Object.values(LOCATION_HIERARCHY)) {
      if (config.cities.includes(normalizedInput)) {
        return normalizedInput
      }
      
      // Check districts
      if (config.districts) {
        for (const [city, districts] of Object.entries(config.districts)) {
          if (districts.includes(normalizedInput)) {
            return city // Return parent city for districts
          }
        }
      }
    }

    // Partial match
    for (const config of Object.values(LOCATION_HIERARCHY)) {
      for (const city of config.cities) {
        if (normalizedInput.includes(city) || city.includes(normalizedInput)) {
          return city
        }
      }
    }

    return null
  }

  /**
   * Get all available cities
   */
  static getAllCities(): string[] {
    const cities: string[] = []
    Object.values(LOCATION_HIERARCHY).forEach(config => {
      cities.push(...config.cities)
    })
    return [...new Set(cities)].sort()
  }

  /**
   * Check if location has districts
   */
  static hasDistricts(city: string): boolean {
    for (const config of Object.values(LOCATION_HIERARCHY)) {
      if (config.districts && config.districts[city]) {
        return true
      }
    }
    return false
  }
}