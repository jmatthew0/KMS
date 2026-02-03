import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { getPublishedDocuments } from '../api/documentsService';
import { askAIWithContext } from '../api/openaiService';
import { useDarkMode } from '../context/DarkModeContext';
import '../Css/KMSChatWidget.css';

const KMSChatWidget = () => {
  const { isDarkMode } = useDarkMode(); // Use your existing dark mode context
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your KMS Assistant. Ask me about documents, how to use the system, or anything else!',
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docsLoaded, setDocsLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  // Load documents when widget opens for the first time
  useEffect(() => {
    if (isOpen && !docsLoaded) {
      loadDocuments();
    }
  }, [isOpen]);

  const loadDocuments = async () => {
    try {
      const { data, error } = await getPublishedDocuments();
      if (data && !error) {
        const transformedDocs = data.map(doc => ({
          id: doc.id,
          title: doc.title,
          content: doc.content || doc.summary || '',
          category: doc.category?.name || 'Uncategorized',
          author: doc.creator?.full_name || 'Unknown',
          tags: doc.document_tags?.map(dt => dt.tag?.name).filter(Boolean) || []
        }));
        setDocuments(transformedDocs);
        setDocsLoaded(true);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocsLoaded(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { message, sources, hasContext } = await askAIWithContext(userMessage, documents);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: message,
        sources: sources || [],
        hasContext 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, something went wrong. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="kms-chat-button"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className={`kms-chat-window ${isDarkMode ? 'dark-mode' : ''}`}>
          <div className="kms-chat-header">
            <div className="kms-chat-header-content">
              <Bot size={24} />
              <div>
                <h3 className="kms-chat-title">KMS Assistant</h3>
                <p className="kms-chat-subtitle">
                  {docsLoaded ? `${documents.length} documents loaded` : 'Loading documents...'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="kms-chat-close"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          <div className="kms-chat-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`kms-message-row ${msg.role}`}
              >
                {msg.role === 'assistant' && (
                  <div className="kms-avatar bot">
                    <Bot size={18} />
                  </div>
                )}
                <div className="kms-message-content">
                  <div className={`kms-message-bubble ${msg.role}`}>
                    <p>{msg.content}</p>
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="kms-message-sources">
                      <p>📄 Sources:</p>
                      {msg.sources.map((source, i) => (
                        <div key={i}>
                          • {source.title} {source.category && `(${source.category})`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="kms-avatar user">
                    <User size={18} />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="kms-loading">
                <div className="kms-avatar bot">
                  <Bot size={18} />
                </div>
                <div className="kms-loading-bubble">
                  <Loader2 size={18} className="animate-spin" style={{ color: '#2563eb' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="kms-chat-input-area">
            <div className="kms-input-wrapper">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="kms-input"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="kms-send-button"
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="kms-input-hint">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default KMSChatWidget;