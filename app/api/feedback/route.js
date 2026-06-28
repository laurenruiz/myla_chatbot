import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { messageContent, rating, timestamp } = await req.json()

    if (!messageContent || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[Feedback]', {
      rating,
      timestamp: timestamp ?? new Date().toISOString(),
      messagePreview: messageContent.slice(0, 100),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
