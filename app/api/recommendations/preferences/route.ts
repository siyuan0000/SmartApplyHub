import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/api'
import { 
  RecommendationPreferencesService
} from '@/lib/services/recommendationPreferencesService'

/**
 * GET - Fetch user's recommendation preferences
 */
export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.next()
    const user = await getAuthenticatedUser(request, response)

    const preferences = await RecommendationPreferencesService.getPreferencesWithDefaults(user.id)

    return NextResponse.json({ 
      success: true,
      preferences 
    })
  } catch (error) {
    console.error('Error fetching recommendation preferences:', error)
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch recommendation preferences' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create new recommendation preferences
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.next()
    const user = await getAuthenticatedUser(request, response)
    const body = await request.json()

    // Validate input
    const validation = RecommendationPreferencesService.validatePreferences(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid preferences',
          details: validation.errors 
        },
        { status: 400 }
      )
    }

    const preferences = await RecommendationPreferencesService.createPreferences(user.id, body)

    return NextResponse.json({ 
      success: true,
      preferences 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating recommendation preferences:', error)
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create recommendation preferences' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update existing recommendation preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const response = NextResponse.next()
    const user = await getAuthenticatedUser(request, response)
    const body = await request.json()

    // Validate input
    const validation = RecommendationPreferencesService.validatePreferences(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid preferences',
          details: validation.errors 
        },
        { status: 400 }
      )
    }

    const preferences = await RecommendationPreferencesService.upsertPreferences(user.id, body)

    return NextResponse.json({ 
      success: true,
      preferences 
    })
  } catch (error) {
    console.error('Error updating recommendation preferences:', error)
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update recommendation preferences' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete (deactivate) recommendation preferences
 */
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.next()
    const user = await getAuthenticatedUser(request, response)

    await RecommendationPreferencesService.deletePreferences(user.id)

    return NextResponse.json({ 
      success: true,
      message: 'Recommendation preferences deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting recommendation preferences:', error)
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete recommendation preferences' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Reset to default preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const response = NextResponse.next()
    const user = await getAuthenticatedUser(request, response)

    const defaultPreferences = RecommendationPreferencesService.getDefaultPreferences()
    const preferences = await RecommendationPreferencesService.upsertPreferences(user.id, defaultPreferences)

    return NextResponse.json({ 
      success: true,
      preferences,
      message: 'Preferences reset to defaults successfully'
    })
  } catch (error) {
    console.error('Error resetting recommendation preferences:', error)
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to reset recommendation preferences' },
      { status: 500 }
    )
  }
}