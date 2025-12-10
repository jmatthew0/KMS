import { supabase } from '../lib/supabaseClient'

// ============================================
// FAQ CATEGORIES
// ============================================

// Get all FAQ categories
export const getFaqCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('faq_categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Create FAQ category (admin only)
export const createFaqCategory = async (categoryData) => {
  try {
    const { data, error } = await supabase
      .from('faq_categories')
      .insert({
        name: categoryData.name,
        description: categoryData.description,
        display_order: categoryData.display_order || 0
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Update FAQ category (admin only)
export const updateFaqCategory = async (categoryId, updates) => {
  try {
    const { data, error } = await supabase
      .from('faq_categories')
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

// Delete FAQ category (admin only)
export const deleteFaqCategory = async (categoryId) => {
  try {
    const { error } = await supabase
      .from('faq_categories')
      .delete()
      .eq('id', categoryId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// ============================================
// FAQs
// ============================================

// Get all published FAQs
export const getPublishedFaqs = async () => {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select(`
        *,
        category:faq_categories(id, name)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Get FAQs by category
export const getFaqsByCategory = async (categoryId) => {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Get single FAQ by ID
export const getFaqById = async (faqId) => {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select(`
        *,
        category:faq_categories(id, name)
      `)
      .eq('id', faqId)
      .single()

    if (error) throw error

    // Increment view count
    await supabase.rpc('increment_faq_views', { faq_id_param: faqId })

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Create FAQ (admin only)
export const createFaq = async (faqData) => {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .insert({
        category_id: faqData.category_id,
        question: faqData.question,
        answer: faqData.answer,
        is_published: faqData.is_published || true,
        created_by: faqData.created_by
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Update FAQ (admin only)
export const updateFaq = async (faqId, updates) => {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .update(updates)
      .eq('id', faqId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Delete FAQ (admin only)
export const deleteFaq = async (faqId) => {
  try {
    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', faqId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Search FAQs
export const searchFaqs = async (query) => {
  try {
    const { data, error } = await supabase
      .rpc('search_faqs', { search_query: query })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Get popular/most viewed FAQs
export const getPopularFaqs = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select(`
        *,
        category:faq_categories(id, name)
      `)
      .eq('is_published', true)
      .order('views_count', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Get most helpful FAQs
export const getMostHelpfulFaqs = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select(`
        *,
        category:faq_categories(id, name)
      `)
      .eq('is_published', true)
      .order('helpful_count', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ============================================
// FAQ RATINGS
// ============================================

// Rate FAQ as helpful/not helpful
export const rateFaq = async (faqId, userId, isHelpful) => {
  try {
    // First, check if user already rated
    const { data: existingRating } = await supabase
      .from('faq_ratings')
      .select('*')
      .eq('faq_id', faqId)
      .eq('user_id', userId)
      .single()

    if (existingRating) {
      // Update existing rating
      const { error } = await supabase
        .from('faq_ratings')
        .update({ is_helpful: isHelpful })
        .eq('id', existingRating.id)

      if (error) throw error
    } else {
      // Create new rating
      const { error } = await supabase
        .from('faq_ratings')
        .insert({
          faq_id: faqId,
          user_id: userId,
          is_helpful: isHelpful
        })

      if (error) throw error
    }

    // Update FAQ helpful/not helpful counts
    const { data: ratings } = await supabase
      .from('faq_ratings')
      .select('is_helpful')
      .eq('faq_id', faqId)

    const helpfulCount = ratings.filter(r => r.is_helpful).length
    const notHelpfulCount = ratings.filter(r => !r.is_helpful).length

    await supabase
      .from('faqs')
      .update({
        helpful_count: helpfulCount,
        not_helpful_count: notHelpfulCount
      })
      .eq('id', faqId)

    return { error: null }
  } catch (error) {
    return { error }
  }
}

// ============================================
// USER-SUBMITTED QUESTIONS
// ============================================

// Submit a question
export const submitQuestion = async (question, userId) => {
  try {
    const { data, error } = await supabase
      .from('faq_submissions')
      .insert({
        question,
        submitted_by: userId,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Get all submitted questions (admin only)
export const getSubmittedQuestions = async () => {
  try {
    const { data, error } = await supabase
      .from('faq_submissions')
      .select(`
        *,
        submitter:profiles(id, full_name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Update submission status (admin only)
export const updateSubmissionStatus = async (submissionId, status, adminNotes = null) => {
  try {
    const { data, error } = await supabase
      .from('faq_submissions')
      .update({
        status,
        admin_notes: adminNotes
      })
      .eq('id', submissionId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}