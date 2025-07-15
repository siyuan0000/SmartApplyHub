'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useResumeEditor } from '@/hooks/useResumeEditor'

export function ContactEditModal() {
  const { content, updateContact } = useResumeEditor()

  if (!content) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contact-name">Full Name *</Label>
          <Input
            id="contact-name"
            value={content.contact.name || ''}
            onChange={(e) => updateContact('name', e.target.value)}
            placeholder="John Doe"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="contact-email">Email Address *</Label>
          <Input
            id="contact-email"
            type="email"
            value={content.contact.email || ''}
            onChange={(e) => updateContact('email', e.target.value)}
            placeholder="john.doe@example.com"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="contact-phone">Phone Number</Label>
          <Input
            id="contact-phone"
            type="tel"
            value={content.contact.phone || ''}
            onChange={(e) => updateContact('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="contact-location">Location</Label>
          <Input
            id="contact-location"
            value={content.contact.location || ''}
            onChange={(e) => updateContact('location', e.target.value)}
            placeholder="San Francisco, CA"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="contact-linkedin">LinkedIn Profile</Label>
          <Input
            id="contact-linkedin"
            value={content.contact.linkedin || ''}
            onChange={(e) => updateContact('linkedin', e.target.value)}
            placeholder="linkedin.com/in/johndoe"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="contact-github">GitHub Profile</Label>
          <Input
            id="contact-github"
            value={content.contact.github || ''}
            onChange={(e) => updateContact('github', e.target.value)}
            placeholder="github.com/johndoe"
            className="mt-1"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="contact-website">Personal Website</Label>
          <Input
            id="contact-website"
            value={content.contact.website || ''}
            onChange={(e) => updateContact('website', e.target.value)}
            placeholder="https://johndoe.dev"
            className="mt-1"
          />
        </div>
      </div>
      
      <div className="pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          <span className="text-red-500">*</span> Required fields for a complete contact section
        </p>
      </div>
    </div>
  )
}