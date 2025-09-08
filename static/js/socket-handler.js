// socket-handler.js: Socket.IO event handlers
// Maximum ~200 lines

// Handle incoming stream messages from server
function handleStreamMessage(data) {
    console.log('Stream event received:', data);
    
    if (!data.message_id) return;
    
    // Look for existing message with this ID
    let targetMessage = document.querySelector(`[data-id="${data.message_id}"]`);
    
    // If no existing message found, use the aiMessageDiv we created
    if (!targetMessage && window.currentAIMessage) {
        console.log('Using current AI message for new stream');
        targetMessage = window.currentAIMessage;
        targetMessage.dataset.id = data.message_id;
    }
    
    if (!targetMessage) {
        console.error('No target message found for ID:', data.message_id);
        return;
    }
    
    // Find the content div
    let contentDiv = targetMessage.querySelector('#ai-response');
    if (!contentDiv) {
        console.log('Creating new content div');
        contentDiv = document.createElement('div');
        contentDiv.id = 'ai-response';
        contentDiv.className = 'whitespace-pre-wrap';
        targetMessage.appendChild(contentDiv);
    }
    
    // Append content character by character for streaming effect
    if (data.content) {
        console.log('Appending content:', data.content);
        
        // Store the new content to be streamed
        if (!contentDiv.pendingContent) {
            contentDiv.pendingContent = '';
        }
        contentDiv.pendingContent += data.content;
        
        // Start streaming if not already streaming
        if (!contentDiv.isStreaming) {
            streamTextToElement(contentDiv);
        }
        
        // Auto-scroll to keep the latest content visible
        // Fast scroll during streaming to keep up
        if (window.scrollToBottomFast) {
            window.scrollToBottomFast();
        }
    }
    
    // Handle completion
    if (data.done) {
        console.log('Stream completed');
        window.isWaitingForResponse = false;
        document.getElementById('typing-indicator').classList.add('hidden');
        
        // Apply markdown rendering to the completed message
        if (window.markdownRenderer && contentDiv) {
            const fullContent = contentDiv.textContent;
            contentDiv.innerHTML = window.markdownRenderer.render(fullContent);
            
            // Apply syntax highlighting
            setTimeout(() => {
                window.markdownRenderer.highlightCode(contentDiv);
            }, 10);
        }
        
        // Setup event listeners for the completed streaming message
        if (targetMessage && !targetMessage.hasEventListeners) {
            setupStreamingMessageEventListeners(targetMessage);
            targetMessage.hasEventListeners = true;
        }
        
        window.currentAIMessage = null; // Reset for next message
    }
}

// Stream text character by character to an element with real-time markdown
function streamTextToElement(element) {
    element.isStreaming = true;
    const currentLength = element.textContent.length;
    const targetLength = element.pendingContent.length;
    
    if (currentLength < targetLength) {
        const newContent = element.pendingContent.substring(0, currentLength + 1);
        
        // Only render markdown every 10 characters or at word boundaries to avoid performance issues
        const shouldRender = (currentLength % 10 === 0) || 
                           newContent.endsWith(' ') || 
                           newContent.endsWith('\n') ||
                           shouldRenderAsMarkdown(newContent);
        
        if (shouldRender && shouldRenderAsMarkdown(newContent)) {
            if (window.markdownRenderer) {
                element.innerHTML = window.markdownRenderer.render(newContent);
                // Apply syntax highlighting less frequently
                if (currentLength % 20 === 0) {
                    setTimeout(() => {
                        window.markdownRenderer.highlightCode(element);
                    }, 5);
                }
            } else {
                element.textContent = newContent;
            }
        } else {
            element.textContent = newContent;
        }
        
        setTimeout(() => streamTextToElement(element), 30); // 30ms delay between characters
    } else {
        element.isStreaming = false;
        
        // Final render with full markdown
        if (window.markdownRenderer) {
            element.innerHTML = window.markdownRenderer.render(element.pendingContent);
            setTimeout(() => {
                window.markdownRenderer.highlightCode(element);
            }, 10);
        }
    }
}

// Check if content should be rendered as markdown
function shouldRenderAsMarkdown(content) {
    // Only render as markdown if we have complete markdown structures
    const completePatterns = [
        /```[\w]*\n[\s\S]*?```/g,  // Complete code blocks
        /^#{1,6}\s.+$/gm,          // Complete headers
        /^\*\s.+$/gm,              // Complete list items
        /^\d+\.\s.+$/gm,           // Complete numbered list items
        /\*\*[^*\n]+\*\*/g,         // Complete bold text
        /\[[^\]]+\]\([^)]+\)/g     // Complete links
    ];
    
    // Also check for code block start
    const codeBlockStart = /```\w*\n/g;
    
    return completePatterns.some(pattern => pattern.test(content)) || 
           (codeBlockStart.test(content) && content.length > 10);
}

// Handle message updates from server
function handleMessageUpdate(data) {
    const messageElement = document.querySelector(`[data-id="${data.message_id}"]`);
    if (messageElement) {
        const contentDiv = messageElement.querySelector('.message-content, #ai-response');
        if (contentDiv) {
            // Apply markdown rendering to updated content
            if (window.markdownRenderer) {
                contentDiv.innerHTML = window.markdownRenderer.render(data.new_content);
                // Apply syntax highlighting
                setTimeout(() => {
                    window.markdownRenderer.highlightCode(contentDiv);
                }, 10);
            } else {
                contentDiv.textContent = data.new_content;
            }
            // Smooth scroll after message update
            setTimeout(() => {
                if (window.scrollToBottomFast) {
                    window.scrollToBottomFast();
                }
            }, 100);
        }
    }
}

// Handle connection established
function handleConnection(data) {
    console.log('Connected to server with ID:', data.user_id);
    window.userId = data.user_id;
    
    // Trigger custom event for scroll helper
    document.dispatchEvent(new CustomEvent('socketConnected'));
    
    // Clear any existing messages except the welcome message
    const messages = document.querySelectorAll('.message:not(.welcome-message)');
    messages.forEach(el => el.remove());
    
    // Load any existing messages from the server
    if (data.messages && data.messages.length > 0) {
        data.messages.forEach(msg => {
            if (msg.role === 'user') {
                addMessage('user', msg.content, msg.id);
            } else if (msg.role === 'assistant') {
                loadAssistantMessage(msg);
            }
        });
        
        // Smooth scroll to bottom after loading messages
        setTimeout(() => {
            if (window.scrollToBottomSlow) {
                window.scrollToBottomSlow(); // Slower, more elegant scroll after loading
            }
        }, 200);
    } else {
        // Even if no messages, scroll to bottom
        setTimeout(() => {
            if (window.scrollToBottomSlow) {
                window.scrollToBottomSlow();
            }
        }, 200);
    }
}

// Load assistant message from server
function loadAssistantMessage(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message scroll-reveal gpu-accelerated';
    messageDiv.dataset.role = 'assistant';
    messageDiv.dataset.id = msg.id;
    
    messageDiv.innerHTML = `
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
                <div class="message-content text-gray-700 leading-relaxed">${window.markdownRenderer ? window.markdownRenderer.render(msg.content) : msg.content}</div>
                
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
    
    chatContainer.appendChild(messageDiv);
    
    // Trigger scroll reveal animation
    setTimeout(() => {
        messageDiv.classList.add('revealed');
        // Observe new elements for scroll animations
        if (window.observeNewElements) {
            window.observeNewElements();
        }
        
        // Apply syntax highlighting to loaded messages
        if (window.markdownRenderer) {
            const messageContentDiv = messageDiv.querySelector('.message-content');
            window.markdownRenderer.highlightCode(messageContentDiv);
        }
    }, 100);
    
    setupLoadedMessageEventListeners(messageDiv, msg);
}

// Setup event listeners for loaded messages
function setupLoadedMessageEventListeners(messageDiv, msg) {
    const copyBtn = messageDiv.querySelector('.copy-btn');
    const editBtn = messageDiv.querySelector('.edit-btn');
    const regenerateBtn = messageDiv.querySelector('.regenerate-btn');
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
                if (window.showCopyFeedback) {
                    window.showCopyFeedback(copyBtn);
                }
            } catch (err) {
                console.error('Failed to copy message:', err);
                
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = textContent;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (window.showCopyFeedback) {
                    window.showCopyFeedback(copyBtn);
                }
            }
        });
    }
    
    editBtn.addEventListener('click', () => {
        const currentContent = contentDiv.textContent;
        contentDiv.innerHTML = `<textarea class="w-full p-2 border rounded" rows="3">${currentContent}</textarea>`;
        editControls.classList.remove('hidden');
    });
    
    regenerateBtn.addEventListener('click', () => {
        if (confirm('Regenerate this response? The current response will be replaced.')) {
            const messages = Array.from(document.querySelectorAll('.message'));
            const currentIndex = messages.findIndex(m => m.dataset.id === msg.id);
            let lastUserMessage = null;
            
            for (let i = currentIndex - 1; i >= 0; i--) {
                if (messages[i].dataset.role === 'user') {
                    lastUserMessage = messages[i];
                    break;
                }
            }
            
            if (lastUserMessage) {
                const content = lastUserMessage.querySelector('.message-content')?.textContent || '';
                messageDiv.remove();
                
                socket.emit('send_message', {
                    user_id: window.userId,
                    message: content,
                    regenerate: true
                });
            }
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
        
        socket.emit('update_message', {
            message_id: msg.id,
            new_content: newContent
        });
    });
    
    cancelBtn.addEventListener('click', () => {
        // Restore original content with markdown rendering
        if (window.markdownRenderer) {
            contentDiv.innerHTML = window.markdownRenderer.render(msg.content);
            // Apply syntax highlighting
            setTimeout(() => {
                window.markdownRenderer.highlightCode(contentDiv);
            }, 10);
        } else {
            contentDiv.textContent = msg.content;
        }
        editControls.classList.add('hidden');
    });
}

// Setup event listeners for streaming messages
function setupStreamingMessageEventListeners(messageDiv) {
    const copyBtn = messageDiv.querySelector('.copy-btn');
    const editBtn = messageDiv.querySelector('.edit-btn');
    const regenerateBtn = messageDiv.querySelector('.regenerate-btn');
    const contentDiv = messageDiv.querySelector('#ai-response');
    
    // Copy button handler
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const textContent = contentDiv.textContent || contentDiv.innerText;
            
            try {
                await navigator.clipboard.writeText(textContent);
                if (window.showCopyFeedback) {
                    window.showCopyFeedback(copyBtn);
                }
            } catch (err) {
                console.error('Failed to copy message:', err);
                
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = textContent;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (window.showCopyFeedback) {
                    window.showCopyFeedback(copyBtn);
                }
            }
        });
    }
    
    // Edit button handler
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const currentContent = contentDiv.textContent;
            contentDiv.innerHTML = `<textarea class="w-full p-2 border rounded" rows="3">${currentContent}</textarea>`;
            // Note: Edit controls would need to be added to streaming messages if needed
        });
    }
    
    // Regenerate button handler
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', () => {
            if (confirm('Regenerate this response? The current response will be replaced.')) {
                // Find the last user message to regenerate from
                const messages = Array.from(document.querySelectorAll('.message'));
                const currentIndex = messages.findIndex(m => m === messageDiv);
                
                if (currentIndex > 0) {
                    const previousMessage = messages[currentIndex - 1];
                    const userContent = previousMessage.querySelector('.message-content');
                    
                    if (userContent) {
                        // Remove current AI message and regenerate
                        messageDiv.remove();
                        
                        // Send message to regenerate
                        if (window.socket) {
                            window.socket.emit('user_message', {
                                message: userContent.textContent
                            });
                        }
                    }
                }
            }
        });
    }
}

// Handle errors
function handleError(data) {
    console.error('Error:', data.message);
    window.isWaitingForResponse = false;
    document.getElementById('typing-indicator').classList.add('hidden');
    showErrorMessage(data.message);
}
