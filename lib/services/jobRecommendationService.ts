interface UserPreferences {
  job_titles: string[]
  preferred_location?: string
  salary_min?: number
  salary_max?: number
  job_type: string[]
  experience_level?: string
  skills: string[]
  industries: string[]
}

interface RecommendationPreferences {
  location_filter?: string[]
  location_flexible?: boolean
  remote_only?: boolean
  recency_filter?: string
  salary_min_override?: number
  salary_max_override?: number
  company_size_preference?: string[]
  job_level_override?: string[]
  excluded_companies?: string[]
  excluded_industries?: string[]
  is_active?: boolean
}

interface JobPosting {
  id: string
  title: string
  company_name: string
  location: string
  description: string
  requirements?: string
  salary_range?: string
  job_type?: string
  industry?: string
  remote_work_type?: string
  work_days_per_week?: string
  department?: string
  job_level?: string
  created_at: string
}

interface JobMatch {
  job: JobPosting
  matchReasons: string[]
  sortScore: number
}

export class JobRecommendationService {
  private static readonly MATCH_WEIGHTS = {
    industryMatch: 40,
    locationMatch: 25,
    workTypeMatch: 20,
    titleRelevance: 10,
    experienceMatch: 5,
  }

  static calculateJobMatches(
    userPreferences: UserPreferences,
    recommendationPrefs: RecommendationPreferences | null,
    jobs: JobPosting[],
    appliedJobIds: string[]
  ): JobMatch[] {
    // Filter out already applied jobs
    const availableJobs = jobs.filter(job => !appliedJobIds.includes(job.id))

    // Calculate matches for each job
    const matches = availableJobs.map(job => {
      const matchResult = this.calculateSingleJobMatch(job, userPreferences, recommendationPrefs)
      return matchResult
    })

    // Sort by score (highest first) and return top matches
    return matches.sort((a, b) => b.sortScore - a.sortScore)
  }

  private static calculateSingleJobMatch(
    job: JobPosting,
    userPrefs: UserPreferences,
    recPrefs: RecommendationPreferences | null
  ): JobMatch {
    let score = 0
    const matchReasons: string[] = []

    // Industry Match (40 points)
    const industryScore = this.calculateIndustryMatch(job, userPrefs, recPrefs)
    score += industryScore.score
    if (industryScore.reason) matchReasons.push(industryScore.reason)

    // Location Match (25 points)
    const locationScore = this.calculateLocationMatch(job, userPrefs, recPrefs)
    score += locationScore.score
    if (locationScore.reason) matchReasons.push(locationScore.reason)

    // Work Type Match (20 points)
    const workTypeScore = this.calculateWorkTypeMatch(job, userPrefs, recPrefs)
    score += workTypeScore.score
    if (workTypeScore.reason) matchReasons.push(workTypeScore.reason)

    // Title Relevance (10 points)
    const titleScore = this.calculateTitleRelevance(job, userPrefs)
    score += titleScore.score
    if (titleScore.reason) matchReasons.push(titleScore.reason)

    // Experience Match (5 points)
    const experienceScore = this.calculateExperienceMatch(job, userPrefs, recPrefs)
    score += experienceScore.score
    if (experienceScore.reason) matchReasons.push(experienceScore.reason)

    // Recency bonus (up to 5 points)
    const recencyBonus = this.calculateRecencyBonus(job, recPrefs)
    score += recencyBonus

    return {
      job,
      matchReasons: matchReasons.slice(0, 3), // Show max 3 reasons
      sortScore: score
    }
  }

  private static calculateIndustryMatch(
    job: JobPosting,
    userPrefs: UserPreferences,
    recPrefs: RecommendationPreferences | null
  ): { score: number; reason?: string } {
    // Check exclusions first
    if (recPrefs?.excluded_industries?.includes(job.industry || '')) {
      return { score: 0 }
    }

    // Check if job industry matches user's preferred industries
    if (job.industry && userPrefs.industries.includes(job.industry)) {
      return {
        score: this.MATCH_WEIGHTS.industryMatch,
        reason: 'industry_match'
      }
    }

    return { score: 0 }
  }

  private static calculateLocationMatch(
    job: JobPosting,
    userPrefs: UserPreferences,
    recPrefs: RecommendationPreferences | null
  ): { score: number; reason?: string } {
    // If remote_only is set, only consider remote jobs
    if (recPrefs?.remote_only) {
      if (this.isRemoteJob(job.remote_work_type)) {
        return {
          score: this.MATCH_WEIGHTS.locationMatch,
          reason: 'remote_friendly'
        }
      }
      return { score: 0 }
    }

    // Check specific location filters from recommendation preferences
    if (recPrefs?.location_filter && recPrefs.location_filter.length > 0) {
      const hasLocationMatch = recPrefs.location_filter.some(location =>
        this.isLocationMatch(location, job.location)
      )
      if (hasLocationMatch) {
        return {
          score: this.MATCH_WEIGHTS.locationMatch,
          reason: 'location_match'
        }
      }
    }

    // Check user's preferred location
    if (userPrefs.preferred_location && this.isLocationMatch(userPrefs.preferred_location, job.location)) {
      return {
        score: this.MATCH_WEIGHTS.locationMatch,
        reason: 'location_match'
      }
    }

    // Check remote work compatibility with user preferences
    if (userPrefs.job_type.includes('remote') && this.isRemoteJob(job.remote_work_type)) {
      return {
        score: this.MATCH_WEIGHTS.locationMatch * 0.8, // Slightly lower score for remote match
        reason: 'remote_friendly'
      }
    }

    // If location_flexible is true, don't penalize for location mismatch
    if (recPrefs?.location_flexible !== false) {
      return { score: 0 } // No penalty, no bonus
    }

    return { score: 0 }
  }

  private static calculateWorkTypeMatch(
    job: JobPosting,
    userPrefs: UserPreferences,
    recPrefs: RecommendationPreferences | null // eslint-disable-line @typescript-eslint/no-unused-vars
  ): { score: number; reason?: string } {
    // Map job types
    const jobWorkTypes = this.getJobWorkTypes(job)
    const userWorkTypes = userPrefs.job_type

    // Check for overlap
    const hasWorkTypeMatch = jobWorkTypes.some(type => userWorkTypes.includes(type))

    if (hasWorkTypeMatch) {
      return {
        score: this.MATCH_WEIGHTS.workTypeMatch,
        reason: 'work_type_match'
      }
    }

    return { score: 0 }
  }

  private static calculateTitleRelevance(
    job: JobPosting,
    userPrefs: UserPreferences
  ): { score: number; reason?: string } {
    const jobTitleLower = job.title.toLowerCase()
    const userTitles = userPrefs.job_titles.map(title => title.toLowerCase())

    // Check for keyword overlap
    let bestMatch = 0
    for (const userTitle of userTitles) {
      const keywords = userTitle.split(/\s+/)
      const matchCount = keywords.filter(keyword => 
        keyword.length > 2 && jobTitleLower.includes(keyword)
      ).length

      if (matchCount > 0) {
        const matchRatio = matchCount / keywords.length
        bestMatch = Math.max(bestMatch, matchRatio)
      }
    }

    if (bestMatch > 0.3) {
      return {
        score: this.MATCH_WEIGHTS.titleRelevance * bestMatch,
        reason: 'title_match'
      }
    }

    return { score: 0 }
  }

  private static calculateExperienceMatch(
    job: JobPosting,
    userPrefs: UserPreferences,
    recPrefs: RecommendationPreferences | null
  ): { score: number; reason?: string } {
    if (!job.job_level || !userPrefs.experience_level) {
      return { score: 0 }
    }

    // Use override if available
    const targetLevels = recPrefs?.job_level_override?.length 
      ? recPrefs.job_level_override 
      : [userPrefs.experience_level]

    // Map experience levels
    const jobLevelMapped = this.mapExperienceLevel(job.job_level)
    const userLevelsMapped = targetLevels.map(level => this.mapExperienceLevel(level))

    if (userLevelsMapped.includes(jobLevelMapped)) {
      return {
        score: this.MATCH_WEIGHTS.experienceMatch,
        reason: 'experience_match'
      }
    }

    return { score: 0 }
  }

  private static calculateRecencyBonus(
    job: JobPosting,
    recPrefs: RecommendationPreferences | null
  ): number {
    const now = new Date()
    const jobDate = new Date(job.created_at)
    const daysDiff = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24))

    const recencyFilter = recPrefs?.recency_filter || '1week'
    const maxDays = this.getMaxDaysFromFilter(recencyFilter)

    // Job is too old based on filter
    if (daysDiff > maxDays) return -10 // Penalty for old jobs

    // Bonus for recent jobs (newer = higher bonus)
    const recencyBonus = Math.max(0, 5 - (daysDiff / maxDays) * 5)
    return recencyBonus
  }

  // Helper methods
  private static isRemoteJob(remoteType?: string): boolean {
    if (!remoteType) return false
    return remoteType.includes('远程') || remoteType.toLowerCase().includes('remote')
  }

  private static isLocationMatch(userLocation: string, jobLocation: string): boolean {
    const userLocationLower = userLocation.toLowerCase()
    const jobLocationLower = jobLocation.toLowerCase()
    
    // Exact match or job location contains user location
    return jobLocationLower.includes(userLocationLower) || 
           userLocationLower.includes(jobLocationLower)
  }

  private static getJobWorkTypes(job: JobPosting): string[] {
    const types: string[] = []
    
    if (job.job_type) {
      types.push(job.job_type)
    }
    
    if (job.remote_work_type && this.isRemoteJob(job.remote_work_type)) {
      types.push('remote')
    }
    
    return types
  }

  private static mapExperienceLevel(level: string): string {
    const levelLower = level.toLowerCase()
    
    if (levelLower.includes('entry') || levelLower.includes('junior') || levelLower.includes('初级') || levelLower.includes('实习')) {
      return 'entry'
    } else if (levelLower.includes('mid') || levelLower.includes('中级')) {
      return 'mid'
    } else if (levelLower.includes('senior') || levelLower.includes('高级') || levelLower.includes('资深')) {
      return 'senior'
    } else if (levelLower.includes('lead') || levelLower.includes('principal') || levelLower.includes('主管')) {
      return 'lead'
    } else if (levelLower.includes('executive') || levelLower.includes('director') || levelLower.includes('总监')) {
      return 'executive'
    }
    
    return level // Return as-is if no mapping found
  }

  private static getMaxDaysFromFilter(filter: string): number {
    switch (filter) {
      case '1day': return 1
      case '3days': return 3
      case '1week': return 7
      case '2weeks': return 14
      case '1month': return 30
      default: return 7
    }
  }

  // Public method to get match reason labels for UI
  static getMatchReasonLabel(reason: string): string {
    const labels: Record<string, string> = {
      'industry_match': '✨ Matches your industry',
      'location_match': '📍 In your preferred area',
      'remote_friendly': '🏠 Remote work available',
      'work_type_match': '💼 Matches work preference',
      'title_match': '🎯 Relevant job title',
      'experience_match': '📈 Matches your level',
    }
    
    return labels[reason] || reason
  }
}