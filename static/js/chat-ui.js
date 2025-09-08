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
    
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
    
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
