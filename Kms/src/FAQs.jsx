import React, { useState } from 'react';
import './FAQs.css';
import { ChevronDown } from 'lucide-react';

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How do I upload documents?',
      answer: 'Click the "Upload" button in the Documents Portal, select your files, and they will be automatically uploaded to the system.'
    },
    {
      question: 'What file formats are supported?',
      answer: 'The KMS supports all common file formats including PDF, DOCX, XLSX, PPTX, TXT, ZIP, and more.'
    },
    {
      question: 'How can I search for documents?',
      answer: 'Use the search bar at the top of the Documents Portal to search by document name. You can also filter by category using the filter buttons.'
    },
    {
      question: 'Can I download documents?',
      answer: 'Yes, click the "Download" button on any document card to download it to your device.'
    },
    {
      question: 'How do I share documents with others?',
      answer: 'Currently, all uploaded documents are accessible to authorized users in your organization. Individual sharing features will be available soon.'
    },
    {
      question: 'What is the maximum file size I can upload?',
      answer: 'The maximum file size for uploads is 50MB per file. For larger files, please contact your system administrator.'
    },
    {
      question: 'How do I organize my documents?',
      answer: 'Documents are automatically organized by category. You can filter documents by Finance, HR, Marketing, Product, IT, and Training categories.'
    },
    {
      question: 'Can I edit documents after uploading?',
      answer: 'Document editing features are currently in development. For now, you can download, edit, and re-upload the updated version.'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faqs-container">
      <div className="faqs-content">
        <div className="faqs-header">
          <h1 className="faqs-title">Frequently Asked Questions</h1>
          <p className="faqs-subtitle">Find answers to common questions about the Knowledge Management System</p>
        </div>

        <div className="faqs-list">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <button
                className="faq-question"
                onClick={() => toggleFAQ(index)}
              >
                <span>{faq.question}</span>
                <ChevronDown
                  size={20}
                  className={`chevron-icon ${openIndex === index ? 'chevron-rotate' : ''}`}
                />
              </button>
              {openIndex === index && (
                <div className="faq-answer">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}