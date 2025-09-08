// message-sender.js: Handle message sending functionality
// Maximum ~150 lines

// Handle sending a message
function sendMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    if (message === '' || window.isWaitingForResponse) return;

    // Add user message to chat
    const userMessageId = addMessage('user', message);
    
    // Reset textarea using handler if available
    if (window.textareaHandler) {
        window.textareaHandler.reset();
    } else {
        userInput.value = '';
    }
    
    window.isWaitingForResponse = true;
    document.getElementById('typing-indicator').classList.remove('hidden');

    // Create AI message container for streaming
    window.currentAIMessage = createAIMessageContainer();
    const aiResponse = window.currentAIMessage.querySelector('#ai-response');
    
    // Setup event listeners for AI message buttons
    setupAIMessageEventListeners(window.currentAIMessage);

    // Prepare message with file context if available
    let messageWithContext = message;
    let fileContext = [];
    
    if (window.chatFileContext && window.chatFileContext.length > 0) {
        fileContext = window.chatFileContext;
        
        // Add file context to message
        const fileContextText = fileContext.map(file => 
            `\n\n--- File: ${file.fileName} ---\n${file.content}\n--- End of ${file.fileName} ---`
        ).join('');
        
        messageWithContext = `${message}${fileContextText}`;
        
        // Clear file attachments after sending
        const attachmentContainer = document.getElementById('file-attachments');
        if (attachmentContainer) {
            attachmentContainer.remove();
        }
        window.chatFileContext = [];
    }
    
    // Check RAG toggle state
    const ragToggle = document.getElementById('rag-toggle');
    const useRAG = ragToggle ? ragToggle.checked : false;
    
    // Emit message to server
    socket.emit('send_message', {
        user_id: window.userId,
        message: messageWithContext,
        message_id: userMessageId,
        file_context: fileContext.length > 0 ? fileContext : null,
        use_rag: useRAG
    });
}

// Setup event listeners for AI message buttons
function setupAIMessageEventListeners(aiMessageDiv) {
    const editBtn = aiMessageDiv.querySelector('.edit-btn');
    const regenerateBtn = aiMessageDiv.querySelector('.regenerate-btn');
    const saveBtn = aiMessageDiv.querySelector('.save-edit');
    const cancelBtn = aiMessageDiv.querySelector('.cancel-edit');
    const contentDiv = aiMessageDiv.querySelector('#ai-response');
    const editControls = aiMessageDiv.querySelector('.edit-controls');
    
    let originalContent = '';
    
    editBtn.addEventListener('click', () => {
        const currentContent = contentDiv.textContent;
        contentDiv.innerHTML = `<textarea class="w-full p-2 border rounded" rows="3">${currentContent}</textarea>`;
        editControls.classList.remove('hidden');
    });
    
    regenerateBtn.addEventListener('click', () => {
        if (confirm('Regenerate this response? The current response will be replaced.')) {
            aiMessageDiv.remove();
            const lastUserMessage = chatContainer.querySelector('.message[data-role="user"]:last-child .message-content');
            if (lastUserMessage) {
                socket.emit('send_message', {
                    user_id: window.userId,
                    message: lastUserMessage.textContent,
                    regenerate: true
                });
            }
        }
    });
    
    saveBtn.addEventListener('click', () => {
        const newContent = contentDiv.querySelector('textarea').value;
        contentDiv.textContent = newContent;
        editControls.classList.add('hidden');
        
        socket.emit('update_message', {
            message_id: aiMessageDiv.dataset.id,
            new_content: newContent
        });
    });
    
    cancelBtn.addEventListener('click', () => {
        contentDiv.textContent = originalContent;
        editControls.classList.add('hidden');
    });
}

// Initialize event listeners for input and send button
function initializeMessageSender() {
    const sendButton = document.getElementById('send-button');
    
    // Only add click listener to send button
    // Enter key handling is done by textarea-handler.js
    sendButton.addEventListener('click', sendMessage);
}
