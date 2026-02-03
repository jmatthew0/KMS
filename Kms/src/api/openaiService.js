// Smart keyword-based AI assistant (No API required!)
export const askAIWithContext = async (userMessage, documents = []) => {
  console.log('🤖 Smart Assistant Started');
  console.log('📝 User Message:', userMessage);
  console.log('📚 Documents Available:', documents.length);
  
  try {
    const lowerMessage = userMessage.toLowerCase();
    
    // Search for relevant documents
    const searchTerms = lowerMessage
      .split(' ')
      .filter(term => term.length > 2)
      .filter(term => !['the', 'and', 'for', 'with', 'this', 'that', 'from', 'what', 'how', 'can', 'you'].includes(term));
    
    console.log('🔍 Search Terms:', searchTerms);
    
    const relevantDocs = documents
      .map(doc => {
        const searchableText = `
          ${doc.title} 
          ${doc.content} 
          ${doc.category || ''} 
          ${doc.author || ''} 
          ${doc.tags ? doc.tags.join(' ') : ''}
        `.toLowerCase();
        
        const matchCount = searchTerms.filter(term => 
          searchableText.includes(term)
        ).length;
        
        // Boost relevance for title matches
        const titleMatches = searchTerms.filter(term => 
          doc.title.toLowerCase().includes(term)
        ).length * 2;
        
        return { ...doc, relevance: matchCount + titleMatches };
      })
      .filter(doc => doc.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);

    console.log('✅ Relevant Docs Found:', relevantDocs.length);

    let response = '';
    
    // Greetings and casual conversation
    if (/^(hi|hello|hey|yo|sup|whats up|good morning|good afternoon|good evening)/i.test(lowerMessage)) {
      response = generateGreeting();
    } else if (/^(thanks|thank you|thx|tysm)/i.test(lowerMessage)) {
      response = "You're welcome! Happy to help! 😊 Feel free to ask me anything else about the KMS.";
    } else if (/^(bye|goodbye|see you|later|cya)/i.test(lowerMessage)) {
      response = "Goodbye! Come back anytime if you need help with the KMS. Have a great day! 👋";
    } else if (lowerMessage.includes('your name') || lowerMessage.includes('who are you')) {
      response = "I'm KMS Assistant, your helpful guide for this Knowledge Management System! I can help you find documents, answer questions about features, and guide you through using the system. What would you like to know?";
    } else if (lowerMessage.includes('what can you do') || lowerMessage.includes('how can you help')) {
      response = "I can help you with:\n• Finding and searching documents\n• Understanding how to upload and manage documents\n• Learning about categories and organization\n• Navigating the KMS features\n• Answering questions about approvals and permissions\n\nJust ask me anything! What would you like help with?";
    } else if (lowerMessage.length < 3) {
      response = "I'm here to help! Try asking me something like:\n• 'How do I upload a document?'\n• 'What categories are available?'\n• 'How does search work?'\n\nOr just say hi! 👋";
    } else if (lowerMessage.includes('how') && (lowerMessage.includes('upload') || lowerMessage.includes('add') || lowerMessage.includes('create'))) {
      response = generateUploadHelp(relevantDocs);
    } else if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
      response = generateSearchHelp(relevantDocs);
    } else if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
      response = generateDeleteHelp(relevantDocs);
    } else if (lowerMessage.includes('share') || lowerMessage.includes('permission')) {
      response = generateShareHelp(relevantDocs);
    } else if (lowerMessage.includes('category') || lowerMessage.includes('categories')) {
      response = generateCategoryHelp(relevantDocs, documents);
    } else if (lowerMessage.includes('approve') || lowerMessage.includes('approval') || lowerMessage.includes('pending')) {
      response = generateApprovalHelp(relevantDocs);
    } else if (lowerMessage.includes('user') && lowerMessage.includes('manage')) {
      response = generateUserManagementHelp(relevantDocs);
    } else if (lowerMessage.includes('help') || lowerMessage.includes('use') || lowerMessage.includes('work')) {
      response = generateGeneralHelp(relevantDocs);
    } else if (relevantDocs.length > 0) {
      response = generateDocumentResponse(relevantDocs, userMessage);
    } else {
      response = generateNoResultsHelp(userMessage, documents);
    }

    return {
      message: response,
      sources: relevantDocs.map(d => ({ 
        title: d.title, 
        id: d.id,
        category: d.category 
      })),
      hasContext: relevantDocs.length > 0
    };
  } catch (error) {
    console.error("❌ Error:", error);
    return { 
      message: "Sorry, something went wrong. Please try rephrasing your question.",
      sources: [],
      hasContext: false
    };
  }
};

// Helper functions for generating responses
function generateGreeting() {
  const greetings = [
    "Hi there! 👋 I'm your KMS Assistant. How can I help you today?",
    "Hello! 😊 I'm here to help you with the Knowledge Management System. What would you like to know?",
    "Hey! Welcome! I can help you find documents, answer questions, or guide you through the system. What do you need?",
    "Hi! Great to see you! Ask me anything about documents, categories, or how to use the KMS!"
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function generateUploadHelp(docs) {
  if (docs.length > 0) {
    return `To upload a document, click the "Upload Document" button on the Documents Portal page. You can organize your documents using categories and tags for easy retrieval.\n\nI found these related documents that might help: ${docs.map(d => d.title).join(', ')}`;
  }
  return `To upload a document:\n1. Go to the Documents Portal\n2. Click the "Upload Document" button\n3. Fill in the title, content, and select a category\n4. Add relevant tags to make it easier to find later\n5. Choose whether to publish immediately or save as draft\n\nYour document will be ready for others to view once published!`;
}

function generateSearchHelp(docs) {
  if (docs.length > 0) {
    return `You can search for documents using the search bar at the top of the Documents Portal. Try searching by title, content, category, or tags.\n\nBased on your question, these documents might be relevant: ${docs.map(d => `"${d.title}"`).join(', ')}`;
  }
  return `To search for documents:\n• Use the search bar on the Documents Portal\n• Filter by category using the category buttons\n• Search by keywords in titles or content\n• Use tags to find related documents\n\nTip: Try using specific keywords related to what you're looking for!`;
}

function generateDeleteHelp(docs) {
  return `To delete a document:\n1. Go to the Documents Portal\n2. Find your document\n3. Click on it to view details\n4. Look for the delete or trash icon\n5. Confirm the deletion\n\nNote: You can only delete documents you created, unless you're an admin.`;
}

function generateShareHelp(docs) {
  return `To share a document:\n1. Open the document you want to share\n2. Look for the "Share" button\n3. Set permissions (view or edit)\n4. You can share with specific users or generate a shareable link\n\nRemember: Only published documents can be shared with others!`;
}

function generateCategoryHelp(docs, allDocs) {
  const categories = [...new Set(allDocs.map(d => d.category).filter(Boolean))];
  const categoryList = categories.length > 0 ? categories.join(', ') : 'No categories yet';
  
  return `Categories help organize your documents for easy browsing.\n\nAvailable categories in your system: ${categoryList}\n\nYou can filter documents by category using the category buttons on the Documents Portal page.`;
}

function generateApprovalHelp(docs) {
  return `Document approval workflow:\n• When you create a document, it can be saved as a draft or submitted for approval\n• Admins can review pending documents in the "Pending Approval" section\n• Once approved, the document becomes published and visible to all users\n• If rejected, the creator can revise and resubmit\n\nCheck the status of your documents in your profile or the Documents Portal.`;
}

function generateUserManagementHelp(docs) {
  return `User management features (Admin only):\n• View and manage all users in the system\n• Assign roles and permissions\n• Monitor user activity\n• Enable or disable user accounts\n\nAccess the User Management section from the admin sidebar to manage users.`;
}

function generateGeneralHelp(docs) {
  if (docs.length > 0) {
    return `I found ${docs.length} document(s) that might help answer your question:\n\n${docs.map((d, i) => `${i + 1}. "${d.title}" - ${d.content.substring(0, 150)}...`).join('\n\n')}\n\nWould you like to know more about any of these?`;
  }
  return `Welcome to the KMS (Knowledge Management System)!\n\nHere's what you can do:\n• Documents Portal: Upload, view, and manage documents\n• Search: Find documents by keywords, categories, or tags\n• Categories: Organize documents by topic\n• FAQs: Common questions and answers\n• Profile: Manage your account settings\n\nWhat would you like to do?`;
}

function generateDocumentResponse(docs, question) {
  const topDoc = docs[0];
  const excerpt = topDoc.content.substring(0, 200);
  
  return `Based on your question, I found "${topDoc.title}" which might help.\n\n${excerpt}...\n\n${docs.length > 1 ? `I also found ${docs.length - 1} other related document(s): ${docs.slice(1).map(d => d.title).join(', ')}` : ''}`;
}

function generateNoResultsHelp(question, allDocs) {
  const totalDocs = allDocs.length;
  return `I couldn't find any documents matching "${question}".\n\nTips for better results:\n• Try using different keywords\n• Check for typos\n• Use more general terms\n• Browse by category\n\nWe currently have ${totalDocs} document(s) in the system. You can browse them in the Documents Portal or try asking about:\n• How to upload documents\n• How to search for documents\n• Available categories\n• General help`;
}

// Simple version (backward compatibility)
export const askAI = async (userMessage) => {
  const { message } = await askAIWithContext(userMessage, []);
  return message;
};