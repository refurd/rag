// chat-ui.js: UI manipulation functions for chat messages
// Maximum ~200 lines

// Add a message to the chat
function addMessage(role, content, messageId = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message scroll-reveal gpu-accelerated';
    messageDiv.dataset.role = role;
    if (messageId) messageDiv.dataset.id = messageId;
    
    const messageIdValue = messageId || 'msg-' + Date.now();
    const isUser = role === 'user';
    
    messageDiv.innerHTML = `
        <div class="${isUser ? 'ml-8' : 'mr-8'} mb-6">
            <div class="group ${isUser ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white ml-auto' : 'bg-white/80 backdrop-blur-sm border border-gray-200/50'} 
                        rounded-3xl p-6 shadow-soft hover-lift transition-all duration-300 
                        ${isUser ? 'max-w-md' : 'max-w-2xl'}">
                
                <!-- Header -->
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <span class="font-semibold ${isUser ? 'text-white' : 'text-gray-900'}">
                            ${isUser ? 'You' : 'Alfa AI'}
                        </span>
                        ${!isUser ? '<span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">AI</span>' : ''}
                    </div>
                    
                    <div class="flex space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button class="copy-btn p-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="Copy message">
                            <svg class="w-4 h-4 text-gray-400 hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <button class="edit-btn p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Edit">
                            <svg class="w-4 h-4 ${isUser ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-600'}" 
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="delete-btn p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                            <svg class="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="message-content ${isUser ? 'text-white' : 'text-gray-700'} leading-relaxed">${isUser ? content : (window.markdownRenderer ? window.markdownRenderer.render(content) : content)}</div>
                
                <!-- RAG Sources (only for AI messages) -->
                ${!isUser ? '<div class="rag-sources-container hidden mt-4 pt-4 border-t border-gray-200/50"></div>' : ''}
                
                <!-- Edit controls -->
                <div class="edit-controls hidden mt-4 pt-4 border-t ${isUser ? 'border-white/20' : 'border-gray-200'}">
                    <div class="flex space-x-2">
                        <button class="save-edit bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                            Save
                        </button>
                        <button class="cancel-edit bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    chatContainer.appendChild(messageDiv);
    
    // Trigger scroll reveal animation
    setTimeout(() => {
        messageDiv.classList.add('revealed');
        // Observe new elements for scroll animations
        if (window.observeNewElements) {
            window.observeNewElements();
        }
    }, 100);
    
    // Smooth scroll to bottom after adding message
    setTimeout(() => {
        if (window.scrollToBottomFast) {
            window.scrollToBottomFast();
        } else if (window.smoothScrollToBottom) {
            window.smoothScrollToBottom(600);
        }
    }, 50);
    
    // Add event listeners
    setupMessageEventListeners(messageDiv, content, messageIdValue);
    
    // Apply syntax highlighting for AI messages
    if (!isUser && window.markdownRenderer) {
        setTimeout(() => {
            const messageContentDiv = messageDiv.querySelector('.message-content');
            window.markdownRenderer.highlightCode(messageContentDiv);
        }, 50);
    }
    
    return messageIdValue;
}

// Setup event listeners for message buttons
function setupMessageEventListeners(messageDiv, originalContent, messageId) {
    const copyBtn = messageDiv.querySelector('.copy-btn');
    const editBtn = messageDiv.querySelector('.edit-btn');
    const deleteBtn = messageDiv.querySelector('.delete-btn');
    const saveBtn = messageDiv.querySelector('.save-edit');
    const cancelBtn = messageDiv.querySelector('.cancel-edit');
    const contentDiv = messageDiv.querySelector('.message-content');
    const editControls = messageDiv.querySelector('.edit-controls');
    
    // Copy button handler
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const textContent = contentDiv.textContent || contentDiv.innerText;
            
            try {
                await navigator.clipboard.writeText(textContent);
                showCopyFeedback(copyBtn);
            } catch (err) {
                console.error('Failed to copy message:', err);
                
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = textContent;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                showCopyFeedback(copyBtn);
            }
        });
    }
    
    editBtn.addEventListener('click', () => {
        const currentContent = contentDiv.textContent;
        contentDiv.innerHTML = `<textarea class="w-full p-2 border rounded" rows="3">${currentContent}</textarea>`;
        editControls.classList.remove('hidden');
    });
    
    deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this message?')) {
            messageDiv.remove();
        }
    });
    
    saveBtn.addEventListener('click', () => {
        const newContent = contentDiv.querySelector('textarea').value;
        
        // Apply markdown rendering to saved content
        if (window.markdownRenderer) {
            contentDiv.innerHTML = window.markdownRenderer.render(newContent);
            // Apply syntax highlighting
            setTimeout(() => {
                window.markdownRenderer.highlightCode(contentDiv);
            }, 10);
        } else {
            contentDiv.textContent = newContent;
        }
        
        editControls.classList.add('hidden');
        
        if (messageId) {
            socket.emit('update_message', {
                message_id: messageId,
                new_content: newContent
            });
        }
    });
    
    cancelBtn.addEventListener('click', () => {
        // Restore original content with markdown rendering
        if (window.markdownRenderer) {
            contentDiv.innerHTML = window.markdownRenderer.render(originalContent);
            // Apply syntax highlighting
            setTimeout(() => {
                window.markdownRenderer.highlightCode(contentDiv);
            }, 10);
        } else {
            contentDiv.textContent = originalContent;
        }
        editControls.classList.add('hidden');
    });
}

// Show copy feedback animation
function showCopyFeedback(button) {
    const originalContent = button.innerHTML;
    
    // Show success icon
    button.innerHTML = `
        <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
    `;
    
    // Add scale animation
    button.style.transform = 'scale(1.2)';
    
    setTimeout(() => {
        button.style.transform = 'scale(1)';
        button.innerHTML = originalContent;
    }, 1500);
}

// Make it globally available
window.showCopyFeedback = showCopyFeedback;

// Add system message for file uploads
function addSystemMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const systemMessageDiv = document.createElement('div');
    systemMessageDiv.className = 'message scroll-reveal gpu-accelerated system-message';
    systemMessageDiv.dataset.role = 'system';
    
    systemMessageDiv.innerHTML = `
        <div class="flex justify-center mb-4">
            <div class="bg-purple-50/80 backdrop-blur-sm border border-purple-200/50 rounded-2xl px-4 py-2 shadow-sm">
                <div class="flex items-center space-x-2">
                    <div class="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg class="w-2.5 h-2.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p class="text-sm text-purple-800 font-medium">${message}</p>
                </div>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(systemMessageDiv);
    
    // Trigger scroll reveal animation
    setTimeout(() => {
        systemMessageDiv.classList.add('revealed');
    }, 100);
    
    // Auto-remove system message after 5 seconds
    setTimeout(() => {
        if (systemMessageDiv.parentNode) {
            systemMessageDiv.style.opacity = '0';
            systemMessageDiv.style.transform = 'translateY(-10px)';
            systemMessageDiv.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                if (systemMessageDiv.parentNode) {
                    systemMessageDiv.remove();
                }
            }, 300);
        }
    }, 5000);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Make it globally available
window.addSystemMessage = addSystemMessage;

// Create AI message container for streaming
function createAIMessageContainer() {
    const aiMessageDiv = document.createElement('div');
    aiMessageDiv.className = 'message scroll-reveal gpu-accelerated';
    aiMessageDiv.dataset.role = 'assistant';
    
    aiMessageDiv.innerHTML = `
        <div class="mr-8 mb-6">
            <div class="group bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-soft hover-lift transition-all duration-300 max-w-2xl">
                
                <!-- Header -->
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <span class="font-semibold text-gray-900">Alfa AI</span>
                        <span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">AI</span>
                    </div>
                    
                    <div class="flex space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button class="copy-btn p-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="Copy message">
                            <svg class="w-4 h-4 text-gray-400 hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <button class="edit-btn p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Edit">
                            <svg class="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="regenerate-btn p-1.5 rounded-lg hover:bg-purple-50 transition-colors" title="Regenerate">
                            <svg class="w-4 h-4 text-gray-400 hover:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Content -->
                <div id="ai-response" class="text-gray-700 leading-relaxed min-h-[1.5rem]"></div>
                
                <!-- RAG Sources -->
                <div class="rag-sources-container hidden mt-4 pt-4 border-t border-gray-200/50"></div>
                
                <!-- Edit controls -->
                <div class="edit-controls hidden mt-4 pt-4 border-t border-gray-200">
                    <div class="flex space-x-2">
                        <button class="save-edit bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                            Save
                        </button>
                        <button class="cancel-edit bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    chatContainer.appendChild(aiMessageDiv);
    
    // Trigger scroll reveal animation
    setTimeout(() => {
        aiMessageDiv.classList.add('revealed');
        // Observe new elements for scroll animations
        if (window.observeNewElements) {
            window.observeNewElements();
        }
    }, 100);
    
    return aiMessageDiv;
}

// Show error message in chat
function showErrorMessage(errorText) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message bg-red-100 p-4 rounded-lg shadow mb-4';
    errorDiv.innerHTML = `
        <div class="font-semibold text-red-600">Error</div>
        <div class="text-red-800">${errorText}</div>
    `;
    chatContainer.appendChild(errorDiv);
    errorDiv.scrollIntoView({ behavior: 'smooth' });
}

// Clear all messages from chat
function clearAllMessages() {
    document.querySelectorAll('.message').forEach(el => el.remove());
}

// Display RAG sources for a message
function displayRAGSources(messageId, sources) {
    console.log('🔍 Displaying RAG sources for message:', messageId, sources);
    
    // Find the message by ID
    const messageElement = document.querySelector(`[data-id="${messageId}"]`);
    if (!messageElement) {
        console.error('Message element not found for ID:', messageId);
        return;
    }
    
    // Find the RAG sources container
    const sourcesContainer = messageElement.querySelector('.rag-sources-container');
    if (!sourcesContainer) {
        console.error('RAG sources container not found in message');
        return;
    }
    
    // Create sources HTML
    const sourcesHTML = `
        <div class="rag-sources">
            <div class="flex items-center mb-3">
                <i class="fas fa-book-open text-purple-500 mr-2"></i>
                <span class="text-sm font-medium text-gray-600">Sources used:</span>
            </div>
            <div class="space-y-2">
                ${sources.map((source, index) => `
                    <div class="rag-source-item bg-gray-50/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 hover:bg-gray-100/80 transition-colors group">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <div class="flex items-center mb-1">
                                    <i class="fas fa-file-alt text-gray-400 mr-2 text-xs"></i>
                                    <span class="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors cursor-pointer" 
                                          onclick="openFilePreview('${source.source}')" 
                                          title="Click to preview file">
                                        ${source.source}
                                    </span>
                                    <span class="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                        ${Math.round(source.relevance_score * 100)}% match
                                    </span>
                                </div>
                                <p class="text-xs text-gray-600 leading-relaxed line-clamp-2">
                                    ${source.content}
                                </p>
                            </div>
                            <button class="opacity-0 group-hover:opacity-100 ml-3 p-1 hover:bg-gray-200 rounded transition-all" 
                                    onclick="copySourceContent('${source.content.replace(/'/g, "\\'")}')"
                                    title="Copy source content">
                                <i class="fas fa-copy text-gray-400 text-xs"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Insert the sources HTML
    sourcesContainer.innerHTML = sourcesHTML;
    sourcesContainer.classList.remove('hidden');
    
    // Add smooth reveal animation
    setTimeout(() => {
        sourcesContainer.style.opacity = '0';
        sourcesContainer.style.transform = 'translateY(10px)';
        sourcesContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        requestAnimationFrame(() => {
            sourcesContainer.style.opacity = '1';
            sourcesContainer.style.transform = 'translateY(0)';
        });
    }, 100);
}

// Open file preview using the file manager
function openFilePreview(filename) {
    console.log('📄 Opening file preview for:', filename);
    
    // Check if file manager exists and open it
    if (window.fileManager) {
        // Open files panel if not already open
        if (!window.fileManager.isOpen) {
            window.fileManager.open();
        }
        
        // Open file preview
        setTimeout(() => {
            window.fileManager.openFilePreview(filename);
        }, 300); // Small delay to ensure panel is open
        
    } else {
        // Fallback notification if file manager not available
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-4 z-50 p-4 rounded-xl shadow-lg max-w-sm bg-blue-500/90 text-white transform translate-x-full transition-transform duration-300';
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-info-circle mr-2"></i>
                <span class="text-sm font-medium">File preview: ${filename}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }
}

// Copy source content to clipboard
function copySourceContent(content) {
    navigator.clipboard.writeText(content).then(() => {
        console.log('📋 Source content copied to clipboard');
        
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-4 z-50 p-4 rounded-xl shadow-lg max-w-sm bg-green-500/90 text-white transform translate-x-full transition-transform duration-300';
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-check-circle mr-2"></i>
                <span class="text-sm font-medium">Source content copied!</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 2 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy source content:', err);
    });
}

// Make functions globally available
window.displayRAGSources = displayRAGSources;
window.openFilePreview = openFilePreview;
window.copySourceContent = copySourceContent;
