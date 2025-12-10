import { supabase } from '../lib/supabaseClient'

// Get all published documents
export const getPublishedDocuments = async () => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        category:categories(id, name, color),
        creator:profiles!documents_created_by_fkey(id, full_name, email),
        document_tags(tag:tags(id, name))
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Get user's own documents
export const getUserDocuments = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        category:categories(id, name, color),
        document_tags(tag:tags(id, name))
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Get pending documents (for admin approval)
export const getPendingDocuments = async () => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        category:categories(id, name, color),
        creator:profiles!documents_created_by_fkey(id, full_name, email),
        document_tags(tag:tags(id, name))
      `)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Get single document by ID
export const getDocumentById = async (documentId, userId = null) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        category:categories(id, name, color),
        creator:profiles!documents_created_by_fkey(id, full_name, email, avatar_url),
        document_tags(tag:tags(id, name)),
        attachments(*)
      `)
      .eq('id', documentId)
      .single()

    if (error) throw error

    // Track view if user is logged in
    if (userId && data) {
      await supabase.rpc('increment_document_views', { 
        doc_id: documentId, 
        user_id: userId 
      })
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Create new document
export const createDocument = async (documentData) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: documentData.title,
        content: documentData.content,
        summary: documentData.summary,
        category_id: documentData.category_id,
        status: documentData.status || 'draft',
        is_published: documentData.is_published || false,
        created_by: documentData.created_by
      })
      .select()
      .single()

    if (error) throw error

    // Add tags if provided
    if (documentData.tags && documentData.tags.length > 0) {
      await addTagsToDocument(data.id, documentData.tags)
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Update document
export const updateDocument = async (documentId, updates) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Delete document
export const deleteDocument = async (documentId) => {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Approve document (admin only)
export const approveDocument = async (documentId, adminId) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({
        status: 'approved',
        is_published: true,
        approved_by: adminId,
        approved_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Reject document (admin only)
export const rejectDocument = async (documentId, reason) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({
        status: 'rejected',
        rejection_reason: reason
      })
      .eq('id', documentId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Get document versions
export const getDocumentVersions = async (documentId) => {
  try {
    const { data, error } = await supabase
      .from('document_versions')
      .select(`
        *,
        creator:profiles(id, full_name)
      `)
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Add tags to document
export const addTagsToDocument = async (documentId, tagIds) => {
  try {
    const tagRelations = tagIds.map(tagId => ({
      document_id: documentId,
      tag_id: tagId
    }))

    const { error } = await supabase
      .from('document_tags')
      .insert(tagRelations)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Remove tags from document
export const removeTagsFromDocument = async (documentId) => {
  try {
    const { error } = await supabase
      .from('document_tags')
      .delete()
      .eq('document_id', documentId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Get recently viewed documents by user
export const getRecentlyViewedDocuments = async (userId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('user_document_views')
      .select(`
        viewed_at,
        document:documents(
          *,
          category:categories(id, name, color),
          document_tags(tag:tags(id, name))
        )
      `)
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Track document download
export const trackDocumentDownload = async (documentId, userId = null) => {
  try {
    await supabase.rpc('track_document_download', { 
      doc_id: documentId, 
      user_id: userId 
    })
    return { error: null }
  } catch (error) {
    return { error }
  }
}