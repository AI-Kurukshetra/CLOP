import { createClient } from '@/lib/supabase/server'
import { errorResponse, successResponse } from '@/lib/utils/api'

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return errorResponse(error.message, 'FETCH_FAILED', 500)
  }

  return successResponse(data, 'Notifications fetched successfully')
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  const body = (await request.json()) as { id?: string; markAll?: boolean }
  const query = supabase.from('notifications').update({ read: true }).eq('user_id', user.id)

  const { data, error } = body.markAll
    ? await query.select('*')
    : await query.eq('id', body.id).select('*')

  if (error) {
    return errorResponse(error.message, 'UPDATE_FAILED', 500)
  }

  return successResponse(data, 'Notifications updated successfully')
}
