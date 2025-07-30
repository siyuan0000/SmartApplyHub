'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, CheckCircle, AlertCircle } from 'lucide-react'

interface AIProviderInfo {
  provider: string
  model: string
  status: 'active' | 'error'
  message: string
  error?: string
}

export function AIProviderInfo() {
  const [providerInfo, setProviderInfo] = useState<AIProviderInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProviderInfo = async () => {
      try {
        const response = await fetch('/api/ai/provider-info')
        const data = await response.json()
        setProviderInfo(data)
      } catch (error) {
        console.error('Failed to fetch AI provider info:', error)
        setProviderInfo({
          provider: 'unknown',
          model: 'unknown',
          status: 'error',
          message: 'Failed to load AI provider information'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProviderInfo()
  }, [])

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4" />
            AI Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="animate-pulse h-4 w-4 bg-gray-300 rounded-full"></div>
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!providerInfo) {
    return null
  }

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'deepseek':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'openai':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    return status === 'active' ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4" />
          AI Service Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Provider:</span>
          <Badge className={getProviderColor(providerInfo.provider)}>
            {providerInfo.provider.charAt(0).toUpperCase() + providerInfo.provider.slice(1)}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Model:</span>
          <span className="text-sm text-muted-foreground font-mono">
            {providerInfo.model}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(providerInfo.status)}
            <span className="text-sm capitalize">{providerInfo.status}</span>
          </div>
        </div>
        
        {providerInfo.message && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {providerInfo.message}
            </p>
          </div>
        )}
        
        {providerInfo.error && (
          <div className="pt-2 border-t">
            <p className="text-xs text-red-600">
              Error: {providerInfo.error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}