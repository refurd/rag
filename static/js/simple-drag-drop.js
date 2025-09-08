/**
 * Simple Drag & Drop Handler for Chat Area
 */
class SimpleDragDropHandler {
    constructor() {
        this.isDragging = false;
        this.chatDropZone = null;
        this.filesDropZone = null;
        this.currentDropTarget = null;
        
        this.init();
    }
    
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.chatContainer = document.getElementById('chat-container');
        this.textarea = document.getElementById('user-input');
        this.filesPanel = document.getElementById('files-panel');
        this.footer = document.querySelector('footer'); // Footer element for chat drag & drop
        
        if (!this.textarea || !this.footer) {
            console.log('Chat elements not found yet, will retry...');
            setTimeout(() => this.setup(), 100);
            return;
        }
        
        this.createDropZones();
        this.setupEventListeners();
        console.log('Simple drag & drop handler initialized');
        console.log('Footer element:', this.footer);
        console.log('Files panel:', this.filesPanel);
    }
    
    createDropZones() {
        // Chat drop zone
        this.chatDropZone = document.createElement('div');
        this.chatDropZone.id = 'chat-drop-zone';
        this.chatDropZone.className = `
            absolute inset-0 z-50 bg-blue-600/20 backdrop-blur-sm
            opacity-0 pointer-events-none transition-opacity duration-300
            flex items-end justify-center pb-4
        `;
        
        this.chatDropZone.innerHTML = `
            <div class="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-blue-200/50 text-center max-w-sm mx-4">
                <div class="w-12 h-12 mx-auto mb-3 text-blue-600">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.697-.413l-3.178 1.061a1 1 0 01-1.273-1.273l1.061-3.178A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"/>
                    </svg>
                </div>
                <h3 class="text-base font-semibold text-gray-900 mb-1">Attach to chat</h3>
                <p class="text-sm text-gray-600">Files will be analyzed with your message</p>
            </div>
        `;
        
        // Files panel drop zone
        this.filesDropZone = document.createElement('div');
        this.filesDropZone.id = 'files-drop-zone';
        this.filesDropZone.className = `
            absolute inset-0 z-50 bg-purple-600/20 backdrop-blur-sm
            opacity-0 pointer-events-none transition-opacity duration-300
            flex items-center justify-center
        `;
        
        this.filesDropZone.innerHTML = `
            <div class="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-200/50 text-center max-w-sm mx-4">
                <div class="w-12 h-12 mx-auto mb-3 text-purple-600">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                </div>
                <h3 class="text-base font-semibold text-gray-900 mb-1">Upload to files</h3>
                <p class="text-sm text-gray-600">Files will be saved to file manager</p>
            </div>
        `;
        
        // Append to respective containers
        if (this.footer) {
            this.footer.style.position = 'relative';
            this.footer.appendChild(this.chatDropZone);
        }
        
        if (this.filesPanel) {
            this.filesPanel.style.position = 'relative';
            this.filesPanel.appendChild(this.filesDropZone);
        }
    }
    
    setupEventListeners() {
        // Setup chat area drag & drop
        this.setupChatDragDrop();
        
        // Setup files panel drag & drop
        this.setupFilesPanelDragDrop();
    }
    
    setupChatDragDrop() {
        if (!this.footer) return;
        
        let chatDragCounter = 0;
        
        console.log('🎯 Setting up footer drag & drop');
        
        // Footer drag events
        this.footer.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            chatDragCounter++;
            console.log('📥 Footer dragenter, counter:', chatDragCounter);
            if (chatDragCounter === 1) {
                this.showChatDropZone();
            }
        });
        
        this.footer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        
        this.footer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            chatDragCounter--;
            console.log('📤 Footer dragleave, counter:', chatDragCounter);
            if (chatDragCounter === 0) {
                this.hideChatDropZone();
            }
        });
        
        this.footer.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            chatDragCounter = 0;
            console.log('🎯 Footer drop!');
            this.hideChatDropZone();
            
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                this.handleChatFileDrop(files);
            }
        });
    }
    
    setupFilesPanelDragDrop() {
        if (!this.filesPanel) {
            console.log('❌ Files panel not found!');
            return;
        }
        
        let filesDragCounter = 0;
        console.log('📁 Setting up files panel drag & drop');
        
        // Files panel drag events
        this.filesPanel.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            filesDragCounter++;
            console.log('📥 Files panel dragenter, counter:', filesDragCounter);
            if (filesDragCounter === 1) {
                this.showFilesDropZone();
            }
        });
        
        this.filesPanel.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        
        this.filesPanel.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            filesDragCounter--;
            console.log('📤 Files panel dragleave, counter:', filesDragCounter);
            if (filesDragCounter === 0) {
                this.hideFilesDropZone();
            }
        });
        
        this.filesPanel.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            filesDragCounter = 0;
            console.log('📁 Files panel drop!');
            this.hideFilesDropZone();
            
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                this.handleFileUpload(files);
            }
        });
    }
    
    showChatDropZone() {
        if (this.chatDropZone) {
            this.chatDropZone.classList.remove('opacity-0', 'pointer-events-none');
            this.chatDropZone.classList.add('opacity-100');
            
            // Add dynamic padding to chat area
            const chatArea = document.querySelector('.flex-1.overflow-hidden');
            if (chatArea) {
                chatArea.classList.add('pb-24');
            }
        }
    }
    
    hideChatDropZone() {
        if (this.chatDropZone) {
            this.chatDropZone.classList.add('opacity-0', 'pointer-events-none');
            this.chatDropZone.classList.remove('opacity-100');
            
            // Remove dynamic padding from chat area
            const chatArea = document.querySelector('.flex-1.overflow-hidden');
            if (chatArea) {
                chatArea.classList.remove('pb-24');
            }
        }
    }
    
    showFilesDropZone() {
        console.log('🔴 Showing files drop zone');
        if (this.filesDropZone) {
            this.filesDropZone.classList.remove('opacity-0', 'pointer-events-none');
            this.filesDropZone.classList.add('opacity-100');
            console.log('✅ Files drop zone shown');
        } else {
            console.log('❌ Files drop zone not found!');
        }
    }
    
    hideFilesDropZone() {
        console.log('🔵 Hiding files drop zone');
        if (this.filesDropZone) {
            this.filesDropZone.classList.add('opacity-0', 'pointer-events-none');
            this.filesDropZone.classList.remove('opacity-100');
            console.log('✅ Files drop zone hidden');
        }
    }
    
    async handleChatFileDrop(files) {
        console.log('💬 Chat file drop:', files.length, 'files');
        
        // Upload files first
        console.log('📤 Uploading files...');
        await this.handleFileUpload(files);
        
        // Process files for chat context
        console.log('🔄 Processing files for chat...');
        for (const file of files) {
            console.log('📄 Processing file:', file.name);
            await this.processFileForChat(file);
        }
        console.log('✅ Chat file drop complete');
    }
    
    async processFileForChat(file) {
        try {
            // Read file content
            const content = await this.readFileContent(file);
            
            // Add file attachment to chat input
            this.addFileAttachment(file, content);
            
        } catch (error) {
            console.error('Error processing file for chat:', error);
        }
    }
    
    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            // Read as text for most file types
            if (file.type.startsWith('text/') || 
                file.name.endsWith('.md') || 
                file.name.endsWith('.json') || 
                file.name.endsWith('.csv')) {
                reader.readAsText(file);
            } else {
                // For other files, just store metadata
                resolve(`[File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}]`);
            }
        });
    }
    
    addFileAttachment(file, content) {
        console.log('📎 Adding file attachment:', file.name);
        const chatInput = document.getElementById('user-input');
        if (!chatInput) {
            console.error('❌ Chat input not found!');
            return;
        }
        
        // Create file attachment UI
        const attachmentContainer = this.getOrCreateAttachmentContainer();
        console.log('📦 Attachment container:', attachmentContainer);
        
        const attachment = document.createElement('div');
        attachment.className = 'file-attachment flex items-center bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2';
        attachment.innerHTML = `
            <div class="flex-shrink-0 mr-2">
                <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-blue-900 truncate">${file.name}</p>
                <p class="text-xs text-blue-600">${this.formatFileSize(file.size)} • Ready for analysis</p>
            </div>
            <button class="remove-attachment flex-shrink-0 ml-2 p-1 hover:bg-blue-200 rounded">
                <svg class="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
            </button>
        `;
        
        // Store file content in data attribute
        attachment.dataset.fileContent = content;
        attachment.dataset.fileName = file.name;
        
        // Add remove handler
        attachment.querySelector('.remove-attachment').addEventListener('click', () => {
            attachment.remove();
            this.updateChatContext();
        });
        
        attachmentContainer.appendChild(attachment);
        this.updateChatContext();
    }
    
    getOrCreateAttachmentContainer() {
        let container = document.getElementById('file-attachments');
        if (!container) {
            container = document.createElement('div');
            container.id = 'file-attachments';
            container.className = 'file-attachments-container mb-2';
            
            const chatInput = document.getElementById('user-input');
            if (chatInput && chatInput.parentNode) {
                chatInput.parentNode.insertBefore(container, chatInput);
            }
        }
        return container;
    }
    
    updateChatContext() {
        // Store file contexts globally for chat to access
        const attachments = document.querySelectorAll('.file-attachment');
        window.chatFileContext = Array.from(attachments).map(att => ({
            fileName: att.dataset.fileName,
            content: att.dataset.fileContent
        }));
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    async handleFileUpload(files) {
        if (!files || files.length === 0) return;
        
        try {
            // Show upload progress
            this.showUploadProgress(files.length);
            
            // Upload files one by one
            const uploadPromises = Array.from(files).map(async (file) => {
                const formData = new FormData();
                formData.append('file', file); // API expects 'file', not 'files'
                formData.append('path', ''); // Upload to root directory
                
                const response = await fetch('/api/files/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.error || 'Upload failed');
                }
                
                return result;
            });
            
            // Wait for all uploads to complete
            await Promise.all(uploadPromises);
            
            // Add system message to chat
            if (window.addSystemMessage) {
                const fileNames = Array.from(files).map(f => f.name).join(', ');
                window.addSystemMessage(`📎 Uploaded: ${fileNames}`);
                
                // Suggest RAG processing for supported files
                const supportedExtensions = ['.pdf', '.txt', '.json', '.md'];
                const hasRAGSupportedFiles = Array.from(files).some(file => 
                    supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
                );
                
                if (hasRAGSupportedFiles) {
                    setTimeout(() => {
                        window.addSystemMessage(`🧠 Tip: Process these documents in the Files panel to enable RAG search!`);
                    }, 1000);
                }
            }
            
            // Refresh file manager if open
            if (window.fileManager && window.fileManager.isOpen) {
                window.fileManager.loadFiles(window.fileManager.currentPath);
            }
            
            this.hideUploadProgress();
            
        } catch (error) {
            console.error('Upload error:', error);
            this.hideUploadProgress();
            
            // Show error message
            if (window.addSystemMessage) {
                window.addSystemMessage(`❌ Upload failed: ${error.message}`);
            }
        }
    }
    
    showUploadProgress(fileCount) {
        // Create or update progress indicator
        let progress = document.getElementById('upload-progress');
        if (!progress) {
            progress = document.createElement('div');
            progress.id = 'upload-progress';
            progress.className = `
                fixed bottom-4 right-4 z-50
                bg-white/95 backdrop-blur-xl rounded-lg p-4 shadow-lg border border-gray-200/50
                flex items-center gap-3
            `;
            document.body.appendChild(progress);
        }
        
        progress.innerHTML = `
            <div class="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
            <span class="text-sm text-gray-700">Uploading ${fileCount} file${fileCount > 1 ? 's' : ''}...</span>
        `;
        
        progress.classList.remove('opacity-0', 'pointer-events-none');
    }
    
    hideUploadProgress() {
        const progress = document.getElementById('upload-progress');
        if (progress) {
            progress.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => {
                if (progress.parentNode) {
                    progress.parentNode.removeChild(progress);
                }
            }, 300);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.simpleDragDropHandler = new SimpleDragDropHandler();
});
