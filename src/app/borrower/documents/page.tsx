'use client'

import { useEffect, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

import { DocumentUploader } from '@/components/documents/DocumentUploader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useApplications } from '@/hooks/useApplications'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/formatDate'
import { parseJsonResponse } from '@/lib/utils/api'
import type { ApiSuccess, Document } from '@/types'

export default function BorrowerDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplicationId, setSelectedApplicationId] = useState('')
  const [selectedDocType, setSelectedDocType] = useState('identity')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const { applications } = useApplications()

  const loadDocuments = async () => {
    const response = await fetch('/api/documents', { cache: 'no-store' })
    const body = await parseJsonResponse<ApiSuccess<Document[]>>(response)
    setDocuments(body.data)
    setLoading(false)
  }

  useEffect(() => {
    void loadDocuments()
  }, [])

  const uploadDocument = async () => {
    if (!selectedApplicationId || !pendingFile) {
      toast.error('Select an application and file first.')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const filePath = `${selectedApplicationId}/${Date.now()}-${pendingFile.name}`
    const { error } = await supabase.storage.from('loan-documents').upload(filePath, pendingFile, { upsert: true })

    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('loan-documents').getPublicUrl(filePath)

    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: selectedApplicationId,
        doc_type: selectedDocType,
        file_name: pendingFile.name,
        file_url: publicUrl,
        file_size: pendingFile.size,
      }),
    })

    try {
      await parseJsonResponse(response)
      toast.success('Document uploaded successfully.')
      setPendingFile(null)
      await loadDocuments()
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : 'Unable to save document')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Skeleton className="h-[520px]" />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div>
              <Label>Application</Label>
              <Select value={selectedApplicationId} onValueChange={setSelectedApplicationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select application" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((application) => (
                    <SelectItem key={application.id} value={application.id}>
                      {application.loan_product?.name ?? 'Loan'} • {application.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Document Type</Label>
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="identity">Identity Proof</SelectItem>
                  <SelectItem value="income_proof">Income Proof</SelectItem>
                  <SelectItem value="bank_statement">Bank Statement</SelectItem>
                  <SelectItem value="address_proof">Address Proof</SelectItem>
                  <SelectItem value="employment_letter">Employment Letter</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => void uploadDocument()} disabled={saving || !pendingFile}>
              {saving ? 'Uploading...' : 'Save document'}
            </Button>
          </div>
          <DocumentUploader
            label="Select file"
            value={
              pendingFile
                ? {
                    doc_type: selectedDocType,
                    file_name: pendingFile.name,
                    file_url: '',
                    file_size: pendingFile.size,
                    progress: 100,
                  }
                : undefined
            }
            onUpload={async (file) => {
              setPendingFile(file)
            }}
            onRemove={() => setPendingFile(null)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length ? (
            documents.map((document) => (
              <div key={document.id} className="flex flex-col gap-3 rounded-lg border border-[#E8ECF0] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1A202C]">{document.file_name}</p>
                  <p className="mt-1 text-xs text-[#718096]">{document.doc_type.replaceAll('_', ' ')} • {formatDate(document.uploaded_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={document.verified ? 'success' : 'warning'}>{document.verified ? 'Verified' : 'Pending verification'}</Badge>
                  <Button asChild variant="outline" size="sm">
                    <a href={document.file_url} target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={FileText} title="No documents uploaded" description="Upload supporting documents after creating an application." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
