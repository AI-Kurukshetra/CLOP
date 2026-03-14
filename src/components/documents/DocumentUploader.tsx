'use client'

import { useCallback } from 'react'
import { FileUp, Trash2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export type UploadItem = {
  doc_type: string
  file_name: string
  file_url: string
  file_size: number
  progress?: number
}

export function DocumentUploader({
  label,
  value,
  onUpload,
  onRemove,
}: {
  label: string
  value?: UploadItem
  onUpload: (file: File) => Promise<void>
  onRemove: () => void
}) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const [file] = acceptedFiles
      if (file) {
        await onUpload(file)
      }
    },
    [onUpload],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
  })

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900">{label}</p>
            <p className="text-xs text-slate-500">PDF, JPG or PNG up to 5MB.</p>
          </div>
          {value ? (
            <Button size="sm" variant="outline" onClick={onRemove}>
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          ) : null}
        </div>
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-2xl border border-dashed p-6 text-center transition ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'
          }`}
        >
          <input {...getInputProps()} />
          <FileUp className="mx-auto h-6 w-6 text-slate-500" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            {value ? value.file_name : 'Drag and drop or click to upload'}
          </p>
          {value ? <p className="mt-1 text-xs text-slate-500">{Math.round(value.file_size / 1024)} KB</p> : null}
        </div>
        {value?.progress !== undefined && value.progress < 100 ? <Progress value={value.progress} /> : null}
      </CardContent>
    </Card>
  )
}
