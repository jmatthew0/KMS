import React, { useState, useEffect } from 'react';
import '../Css/FAQs.css';
import { ChevronDown, Search, ThumbsUp, ThumbsDown, Plus, X, Edit3, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Load FAQs
      const { data: faqsData, error: faqsError } = await supabase
        .from('faqs')
        .select(`
          *,
          category:faq_categories(id, name),
          creator:profiles!faqs_created_by_fkey(id, full_name)
        `)
        .eq('is_published', true)
        .order('views_count', { ascending: false });

      if (faqsError) throw faqsError;

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('faq_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Load ALL user submissions (pending, approved, rejected) if logged in
      if (userId) {
        const { data: submissionsData } = await supabase
          .from('faq_submissions')
          .select('*')
          .eq('submitted_by', userId)
          .order('created_at', { ascending: false });
        
        setSubmissions(submissionsData || []);
      }

      setFaqs(faqsData || []);
      setCategories(categoriesData || []);
      if (categoriesData && categoriesData.length > 0) {
        setNewCategoryId(categoriesData[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = async (index, faq) => {
    setOpenIndex(openIndex === index ? null : index);
    
    // Track view count when opening
    if (openIndex !== index) {
      try {
        await supabase.rpc('increment_faq_views', { faq_id_param: faq.id });
      } catch (err) {
        console.error('Error updating view count:', err);
      }
    }
  };

  const handleRating = async (faq, isHelpful) => {
    if (!userId) {
      alert('Please login to rate FAQs');
      return;
    }

    try {
      // Check if user already rated this FAQ
      const { data: existingRating } = await supabase
        .from('faq_ratings')
        .select('*')
        .eq('faq_id', faq.id)
        .eq('user_id', userId)
        .single();

      if (existingRating) {
        // Update existing rating
        await supabase
          .from('faq_ratings')
          .update({ is_helpful: isHelpful })
          .eq('id', existingRating.id);
      } else {
        // Insert new rating
        await supabase
          .from('faq_ratings')
          .insert({
            faq_id: faq.id,
            user_id: userId,
            is_helpful: isHelpful
          });
      }

      // Update counts in FAQ table
      const field = isHelpful ? 'helpful_count' : 'not_helpful_count';
      await supabase
        .from('faqs')
        .update({ [field]: (faq[field] || 0) + 1 })
        .eq('id', faq.id);

      // Reload FAQs
      loadData();
      
      alert(isHelpful ? 'Thanks for your feedback!' : 'Thanks for letting us know.');
    } catch (err) {
      console.error('Error rating FAQ:', err);
      alert('Failed to submit rating');
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    
    if (!newQuestion.trim()) {
      alert('Please enter a question');
      return;
    }

    if (!userId) {
      alert('Please login to submit questions');
      return;
    }

    setSubmitting(true);
    
    try {
      if (userRole === 'admin') {
        // Admin creates FAQ directly
        if (!newAnswer.trim()) {
          alert('Please provide an answer');
          setSubmitting(false);
          return;
        }

        const { error: insertError } = await supabase
          .from('faqs')
          .insert({
            question: newQuestion.trim(),
            answer: newAnswer.trim(),
            category_id: newCategoryId || null,
            is_published: true,
            created_by: userId,
            views_count: 0,
            helpful_count: 0,
            not_helpful_count: 0
          });

        if (insertError) throw insertError;
        alert('FAQ added successfully!');
      } else {
        // Regular user submits for review
        const { error: insertError } = await supabase
          .from('faq_submissions')
          .insert({
            question: newQuestion.trim(),
            submitted_by: userId,
            status: 'pending'
          });

        if (insertError) throw insertError;
        alert('Question submitted successfully! It will be reviewed by our team.');
      }

      await loadData();
      setShowSubmitForm(false);
      setNewQuestion('');
      setNewAnswer('');
      setNewCategoryId(categories[0]?.id || '');
    } catch (err) {
      console.error('Error submitting:', err);
      alert('Failed to submit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (faq) => {
    setEditingFaq(faq);
    setNewQuestion(faq.question);
    setNewAnswer(faq.answer);
    setNewCategoryId(faq.category_id);
    setShowEditForm(true);
  };

  const handleUpdateFaq = async (e) => {
    e.preventDefault();
    
    if (!newQuestion.trim() || !newAnswer.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    
    try {
      const { error: updateError } = await supabase
        .from('faqs')
        .update({
          question: newQuestion.trim(),
          answer: newAnswer.trim(),
          category_id: newCategoryId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingFaq.id);

      if (updateError) throw updateError;

      await loadData();
      setShowEditForm(false);
      setEditingFaq(null);
      setNewQuestion('');
      setNewAnswer('');
      
      alert('FAQ updated successfully!');
    } catch (err) {
      console.error('Error updating FAQ:', err);
      alert('Failed to update FAQ: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (faqId) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('faqs')
        .delete()
        .eq('id', faqId);

      if (deleteError) throw deleteError;

      setFaqs(faqs.filter(f => f.id !== faqId));
      alert('FAQ deleted successfully');
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      alert('Failed to delete FAQ: ' + err.message);
    }
  };

  // Get popular FAQs (top 25% by views or helpful count)
  const popularFaqs = faqs.filter((faq, index, arr) => {
    const threshold = Math.ceil(arr.length * 0.25);
    return index < threshold;
  });

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === 'all') return matchesSearch;
    if (selectedCategory === 'popular') return matchesSearch && popularFaqs.includes(faq);
    if (selectedCategory === 'my-submissions') {
      return submissions.some(s => s.question.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return matchesSearch && faq.category_id === selectedCategory;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return (
          <span className="status-badge pending-badge">
            <Clock size={14} /> Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="status-badge approved-badge">
            <CheckCircle size={14} /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="status-badge rejected-badge">
            <XCircle size={14} /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="faqs-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="faqs-container">
      <div className="faqs-content">
        <div className="faqs-header">
          <div className="header-top">
            <div>
              <h1 className="faqs-title">Frequently Asked Questions</h1>
              <p className="faqs-subtitle">Find answers to common questions about the Knowledge Management System</p>
            </div>
            <button 
              className="submit-question-btn"
              onClick={() => setShowSubmitForm(true)}
            >
              <Plus size={20} />
              {userRole === 'admin' ? 'Add FAQ' : 'Submit Question'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Submit/Add FAQ Modal */}
        {showSubmitForm && (
          <div className="modal-overlay" onClick={() => setShowSubmitForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {userRole === 'admin' ? 'Add New FAQ' : 'Submit a Question'}
                </h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowSubmitForm(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmitQuestion}>
                <div className="form-group">
                  <label className="form-label">Question *</label>
                  <textarea
                    className="form-textarea"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="What would you like to know?"
                    rows="3"
                    required
                  />
                </div>
                
                {userRole === 'admin' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Answer *</label>
                      <textarea
                        className="form-textarea"
                        value={newAnswer}
                        onChange={(e) => setNewAnswer(e.target.value)}
                        placeholder="Provide a detailed answer..."
                        rows="5"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={newCategoryId}
                        onChange={(e) => setNewCategoryId(e.target.value)}
                      >
                        <option value="">No Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="modal-actions">
                  <button 
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowSubmitForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : (userRole === 'admin' ? 'Add FAQ' : 'Submit Question')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit FAQ Modal */}
        {showEditForm && editingFaq && (
          <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Edit FAQ</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowEditForm(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdateFaq}>
                <div className="form-group">
                  <label className="form-label">Question *</label>
                  <textarea
                    className="form-textarea"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    rows="3"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Answer *</label>
                  <textarea
                    className="form-textarea"
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    rows="5"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                  >
                    <option value="">No Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button 
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowEditForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Updating...' : 'Update FAQ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Category Filters */}
        <div className="category-filters">
          <button
            className={`category-btn ${selectedCategory === 'all' ? 'category-btn-active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Questions
          </button>
          <button
            className={`category-btn ${selectedCategory === 'popular' ? 'category-btn-active' : ''}`}
            onClick={() => setSelectedCategory('popular')}
          >
            Popular
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'category-btn-active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
          {submissions.length > 0 && (
            <button
              className={`category-btn ${selectedCategory === 'my-submissions' ? 'category-btn-active' : ''}`}
              onClick={() => setSelectedCategory('my-submissions')}
            >
              My Submissions ({submissions.length})
            </button>
          )}
        </div>

        <div className="faqs-list">
          {/* Show user submissions if selected */}
          {selectedCategory === 'my-submissions' && submissions.length > 0 && (
            <div className="submissions-grid">
              {submissions.map((submission) => (
                <div key={submission.id} className="submission-card-compact">
                  <div className="submission-header">
                    <h3 className="submission-question-compact">{submission.question}</h3>
                    {getStatusBadge(submission.status)}
                  </div>
                  <p className="submission-date-compact">
                    {new Date(submission.created_at).toLocaleString()}
                  </p>
                  {submission.status === 'approved' && (
                    <p className="submission-message success-message">
                      Your question has been approved and published!
                    </p>
                  )}
                  {submission.status === 'rejected' && submission.admin_notes && (
                    <p className="submission-message error-message">
                      Reason: {submission.admin_notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Show regular FAQs */}
          {selectedCategory !== 'my-submissions' && filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => (
              <div key={faq.id} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => toggleFAQ(index, faq)}
                >
                  <span>
                    {faq.question}
                    {popularFaqs.includes(faq) && <span className="popular-badge">Popular</span>}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`chevron-icon ${openIndex === index ? 'chevron-rotate' : ''}`}
                  />
                </button>
                {openIndex === index && (
                  <div className="faq-answer-container">
                    <div className="faq-answer">
                      {faq.answer}
                    </div>
                    
                    {/* Admin Actions */}
                    {userRole === 'admin' && (
                      <div className="faq-admin-actions">
                        <button
                          className="admin-action-btn"
                          onClick={() => handleEditClick(faq)}
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button
                          className="admin-action-btn delete-btn"
                          onClick={() => handleDelete(faq.id)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}

                    <div className="faq-rating">
                      <span className="rating-text">Was this helpful?</span>
                      <div className="rating-buttons">
                        <button
                          className="rating-btn"
                          onClick={() => handleRating(faq, true)}
                        >
                          <ThumbsUp size={16} />
                          Yes {faq.helpful_count > 0 && `(${faq.helpful_count})`}
                        </button>
                        <button
                          className="rating-btn"
                          onClick={() => handleRating(faq, false)}
                        >
                          <ThumbsDown size={16} />
                          No {faq.not_helpful_count > 0 && `(${faq.not_helpful_count})`}
                        </button>
                      </div>
                    </div>

                    <div className="faq-meta">
                      <span className="meta-info">
                        Views: {faq.views_count || 0}
                      </span>
                      {faq.category && (
                        <span className="meta-info">
                          Category: {faq.category.name}
                        </span>
                      )}
                      {faq.creator && (
                        <span className="meta-info">
                          Created by: {faq.creator.full_name}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            selectedCategory !== 'my-submissions' && (
              <div className="no-results">
                <p>No FAQs found matching your search.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}