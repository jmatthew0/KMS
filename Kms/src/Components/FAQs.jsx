import React, { useState } from 'react';
import '../Css/FAQs.css';
import { ChevronDown, Search, ThumbsUp, ThumbsDown, Plus, X } from 'lucide-react';

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [ratings, setRatings] = useState({});
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [userSubmittedFAQs, setUserSubmittedFAQs] = useState([]);

  const defaultFaqs = [
    {
      question: 'How do I upload documents?',
      answer: 'Click the "Upload" button in the Documents Portal, select your files, and they will be automatically uploaded to the system.',
      category: 'general',
      popular: true
    },
    {
      question: 'What file formats are supported?',
      answer: 'The KMS supports all common file formats including PDF, DOCX, XLSX, PPTX, TXT, ZIP, and more.',
      category: 'general',
      popular: true
    },
    {
      question: 'How can I search for documents?',
      answer: 'Use the search bar at the top of the Documents Portal to search by document name. You can also filter by category using the filter buttons.',
      category: 'general',
      popular: true
    },
    {
      question: 'Can I download documents?',
      answer: 'Yes, click the "Download" button on any document card to download it to your device.',
      category: 'general',
      popular: false
    },
    {
      question: 'How do I share documents with others?',
      answer: 'Currently, all uploaded documents are accessible to authorized users in your organization. Individual sharing features will be available soon.',
      category: 'general',
      popular: false
    },
    {
      question: 'What is the maximum file size I can upload?',
      answer: 'The maximum file size for uploads is 50MB per file. For larger files, please contact your system administrator.',
      category: 'technical',
      popular: true
    },
    {
      question: 'How do I organize my documents?',
      answer: 'Documents are automatically organized by category. You can filter documents by Finance, HR, Marketing, Product, IT, and Training categories.',
      category: 'general',
      popular: false
    },
    {
      question: 'Can I edit documents after uploading?',
      answer: 'Document editing features are currently in development. For now, you can download, edit, and re-upload the updated version.',
      category: 'general',
      popular: false
    }
  ];

  const allFaqs = [...defaultFaqs, ...userSubmittedFAQs];

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'popular', label: 'Popular Questions' },
    { id: 'general', label: 'General' },
    { id: 'technical', label: 'Technical' },
    { id: 'user-submitted', label: 'User Submitted' }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleRating = (index, isHelpful) => {
    setRatings({ ...ratings, [index]: isHelpful });
  };

  const handleSubmitQuestion = (e) => {
    e.preventDefault();
    if (newQuestion.trim()) {
      const submittedFAQ = {
        question: newQuestion,
        answer: 'Thank you for your question! Our team will review and provide an answer soon.',
        category: 'user-submitted',
        popular: false
      };
      setUserSubmittedFAQs([...userSubmittedFAQs, submittedFAQ]);
      setNewQuestion('');
      setShowSubmitForm(false);
    }
  };

  const filteredFAQs = allFaqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === 'all') return matchesSearch;
    if (selectedCategory === 'popular') return matchesSearch && faq.popular;
    return matchesSearch && faq.category === selectedCategory;
  });

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
              Submit Question
            </button>
          </div>
        </div>

        {/* Submit Question Modal */}
        {showSubmitForm && (
          <div className="modal-overlay" onClick={() => setShowSubmitForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Submit a Question</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowSubmitForm(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmitQuestion}>
                <div className="form-group">
                  <label className="form-label">Your Question</label>
                  <textarea
                    className="form-textarea"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="What would you like to know?"
                    rows="4"
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowSubmitForm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-submit"
                  >
                    Submit Question
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
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'category-btn-active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
              {category.id === 'user-submitted' && userSubmittedFAQs.length > 0 && (
                <span className="category-count">{userSubmittedFAQs.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="faqs-list">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => toggleFAQ(index)}
                >
                  <span>
                    {faq.question}
                    {faq.popular && <span className="popular-badge">Popular</span>}
                    {faq.category === 'user-submitted' && <span className="user-submitted-badge">User Submitted</span>}
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
                    <div className="faq-rating">
                      <span className="rating-text">Was this helpful?</span>
                      <div className="rating-buttons">
                        <button
                          className={`rating-btn ${ratings[index] === true ? 'rating-btn-active' : ''}`}
                          onClick={() => handleRating(index, true)}
                        >
                          <ThumbsUp size={16} />
                          Yes
                        </button>
                        <button
                          className={`rating-btn ${ratings[index] === false ? 'rating-btn-active' : ''}`}
                          onClick={() => handleRating(index, false)}
                        >
                          <ThumbsDown size={16} />
                          No
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No FAQs found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}