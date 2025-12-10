import { supabase } from '../lib/supabaseClient'

// ============================================
// CATEGORIES
// ============================================

// Get all categories
export const getAllCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Get category by ID
export const getCategoryById = async (categoryId) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Create new category (admin only)
export const createCategory = async (categoryData) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: categoryData.name,
        description: categoryData.description,
        color: categoryData.color || '#3B82F6',
        icon: categoryData.icon,
        parent_id: categoryData.parent_id,
        created_by: categoryData.created_by
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Update category (admin only)
export const updateCategory = async (categoryId, updates) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Delete category (admin only)
export const deleteCategory = async (categoryId) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Get documents count by category
export const getCategoryDocumentsCount = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        color,
        documents:documents(count)
      `)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ============================================
// TAGS
// ============================================

// Get all tags
export const getAllTags = async () => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Create new tag
export const createTag = async (tagName) => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .insert({ name: tagName })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Delete tag (admin only)
export const deleteTag = async (tagId) => {
  try {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Get or create tag by name
export const getOrCreateTag = async (tagName) => {
  try {
    // First, try to find existing tag
    const { data: existingTag, error: searchError } = await supabase
      .from('tags')
      .select('*')
      .eq('name', tagName)
      .single()

    if (existingTag) {
      return { data: existingTag, error: null }
    }

    // If not found, create new tag
    if (searchError && searchError.code === 'PGRST116') {
      return await createTag(tagName)
    }

    throw searchError
  } catch (error) {
    return { data: null, error }
  }
}

// Get popular tags (most used)
export const getPopularTags = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select(`
        *,
        document_tags(count)
      `)
      .order('document_tags(count)', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}