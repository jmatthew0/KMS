import { supabase } from '../lib/supabaseClient'

// Upload file to storage
export const uploadFile = async (file, userId, documentId = null) => {
  try {
    // Create unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('document-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('document-attachments')
      .getPublicUrl(filePath)

    // If documentId is provided, save attachment record
    if (documentId) {
      const { data: attachmentData, error: attachmentError } = await supabase
        .from('attachments')
        .insert({
          document_id: documentId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: userId
        })
        .select()
        .single()

      if (attachmentError) throw attachmentError

      return {
        data: {
          attachment: attachmentData,
          url: urlData.publicUrl,
          path: filePath
        },
        error: null
      }
    }

    return {
      data: {
        url: urlData.publicUrl,
        path: filePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      },
      error: null
    }
  } catch (error) {
    return { data: null, error }
  }
}

// Upload multiple files
export const uploadMultipleFiles = async (files, userId, documentId = null) => {
  try {
    const uploadPromises = files.map(file => uploadFile(file, userId, documentId))
    const results = await Promise.all(uploadPromises)

    const successfulUploads = results.filter(r => !r.error)
    const failedUploads = results.filter(r => r.error)

    return {
      data: {
        successful: successfulUploads.map(r => r.data),
        failed: failedUploads.map(r => r.error)
      },
      error: failedUploads.length > 0 ? 'Some uploads failed' : null
    }
  } catch (error) {
    return { data: null, error }
  }
}

// Delete file from storage
export const deleteFile = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from('document-attachments')
      .remove([filePath])

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Delete attachment (file + database record)
export const deleteAttachment = async (attachmentId) => {
  try {
    // Get attachment info first
    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select('file_path')
      .eq('id', attachmentId)
      .single()

    if (fetchError) throw fetchError

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('document-attachments')
      .remove([attachment.file_path])

    if (storageError) throw storageError

    // Delete from database
    const { error: dbError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', attachmentId)

    if (dbError) throw dbError

    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Get document attachments
export const getDocumentAttachments = async (documentId) => {
  try {
    const { data, error } = await supabase
      .from('attachments')
      .select(`
        *,
        uploader:profiles(id, full_name)
      `)
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Add public URLs to attachments
    const attachmentsWithUrls = data.map(attachment => {
      const { data: urlData } = supabase.storage
        .from('document-attachments')
        .getPublicUrl(attachment.file_path)

      return {
        ...attachment,
        url: urlData.publicUrl
      }
    })

    return { data: attachmentsWithUrls, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Download file
export const downloadFile = async (filePath, fileName) => {
  try {
    const { data, error } = await supabase.storage
      .from('document-attachments')
      .download(filePath)

    if (error) throw error

    // Create download link
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Get file URL
export const getFileUrl = (filePath) => {
  const { data } = supabase.storage
    .from('document-attachments')
    .getPublicUrl(filePath)

  return data.publicUrl
}

// Validate file
export const validateFile = (file, maxSizeMB = 10, allowedTypes = []) => {
  const maxSize = maxSizeMB * 1024 * 1024 // Convert to bytes

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    }
  }

  // Check file type if specified
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`
    }
  }

  return { valid: true, error: null }
}

// Get user's uploaded files
export const getUserUploads = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('attachments')
      .select(`
        *,
        document:documents(id, title, is_published)
      `)
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Add public URLs
    const uploadsWithUrls = data.map(attachment => {
      const { data: urlData } = supabase.storage
        .from('document-attachments')
        .getPublicUrl(attachment.file_path)

      return {
        ...attachment,
        url: urlData.publicUrl
      }
    })

    return { data: uploadsWithUrls, error: null }
  } catch (error) {
    return { data: null, error }
  }
}