'use client'

export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Briefcase, Plus, Search, Filter, Eye, Edit, Trash2, Calendar, MapPin, Clock } from 'lucide-react'

export default function Applications() {
  const mockApplications = [
    {
      id: 1,
      company: 'TechCorp',
      position: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      status: 'interview',
      appliedDate: '2024-01-15',
      salary: '$120k - $150k',
      notes: 'Technical interview scheduled for next week'
    },
    {
      id: 2,
      company: 'StartupXYZ',
      position: 'Full Stack Developer',
      location: 'Remote',
      status: 'pending',
      appliedDate: '2024-01-12',
      salary: '$80k - $100k',
      notes: 'Waiting for initial screening call'
    },
    {
      id: 3,
      company: 'BigTech Inc',
      position: 'Frontend Developer',
      location: 'New York, NY',
      status: 'applied',
      appliedDate: '2024-01-10',
      salary: '$100k - $130k',
      notes: 'Application submitted via company website'
    },
    {
      id: 4,
      company: 'Innovation Labs',
      position: 'React Developer',
      location: 'Austin, TX',
      status: 'rejected',
      appliedDate: '2024-01-08',
      salary: '$90k - $120k',
      notes: 'Not a good fit for the role'
    },
    {
      id: 5,
      company: 'Future Systems',
      position: 'Software Engineer',
      location: 'Seattle, WA',
      status: 'offer',
      appliedDate: '2024-01-05',
      salary: '$110k - $140k',
      notes: 'Offer received! Negotiating terms'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'applied':
        return <Badge variant="outline">Applied</Badge>
      case 'interview':
        return <Badge variant="default">Interview</Badge>
      case 'offer':
        return <Badge className="bg-green-600">Offer</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'border-l-yellow-500'
      case 'applied': return 'border-l-blue-500'
      case 'interview': return 'border-l-purple-500'
      case 'offer': return 'border-l-green-500'
      case 'rejected': return 'border-l-red-500'
      default: return 'border-l-gray-500'
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Job Applications</h1>
            <p className="text-muted-foreground">
              Track and manage your job applications
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Application
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">8</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Interviews</p>
                  <p className="text-2xl font-bold text-purple-600">5</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Offers</p>
                  <p className="text-2xl font-bold text-green-600">2</p>
                </div>
                <Briefcase className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Response Rate</p>
                  <p className="text-2xl font-bold">18%</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search applications..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <div className="space-y-4">
          {mockApplications.map((app) => (
            <Card key={app.id} className={`border-l-4 ${getStatusColor(app.status)}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                        <Briefcase className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{app.position}</h3>
                        <p className="text-sm text-muted-foreground">{app.company}</p>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{app.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Applied {app.appliedDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 font-medium">{app.salary}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{app.notes}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}