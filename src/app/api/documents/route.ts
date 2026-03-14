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

  const { data, error } = await supabase.from('documents').select('*').order('uploaded_at', { ascending: false })

  if (error) {
    return errorResponse(error.message, 'FETCH_FAILED', 500)
  }

  return successResponse(data, 'Documents fetched successfully')
}

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  const body = (await request.json()) as Record<string, unknown>
  const { data, error } = await supabase
    .from('documents')
    .insert({
      ...body,
      borrower_id: user.id,
    })
    .select('*')
    .single()

  if (error) {
    return errorResponse(error.message, 'UPLOAD_FAILED', 500)
  }

  await supabase.from('audit_logs').insert({
    application_id: String(body.application_id),
    performed_by: user.id,
    action: 'document_uploaded',
    new_value: {
      doc_type: body.doc_type,
      file_name: body.file_name,
    },
  })

  return successResponse(data, 'Document uploaded successfully', 201)
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile || (profile.role !== 'officer' && profile.role !== 'admin')) {
    return errorResponse('Forbidden', 'FORBIDDEN', 403)
  }

  const body = (await request.json()) as { id: string; verified: boolean }
  const { data, error } = await supabase
    .from('documents')
    .update({ verified: body.verified })
    .eq('id', body.id)
    .select('*')
    .single()

  if (error) {
    return errorResponse(error.message, 'VERIFY_FAILED', 500)
  }

  await supabase.from('audit_logs').insert({
    application_id: data.application_id,
    performed_by: user.id,
    action: body.verified ? 'document_verified' : 'document_unverified',
    new_value: {
      document_id: data.id,
      verified: body.verified,
    },
  })

  return successResponse(data, 'Document updated successfully')
}
