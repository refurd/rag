/**
 * Drag & Drop Handler for File Uploads
 * Supports dropping files into chat area
 */
class DragDropHandler {
    constructor() {
        this.isDragging = false;
        this.dragCounter = 0;
        this.dropZone = null;
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.chatContainer = document.getElementById('chat-messages');
        this.textarea = document.getElementById('user-input');
        
        if (!this.chatContainer || !this.textarea) {
            console.error('Required elements not found for drag-drop');
            return;
        }
        
        this.createDropZone();
        this.setupEventListeners();
        console.log('Drag & drop handler initialized');
    }
    
    createDropZone() {
        // Create overlay drop zone
        this.dropZone = document.createElement('div');
        this.dropZone.id = 'drop-zone-overlay';
        this.dropZone.className = `
            fixed inset-0 z-50 hidden
            bg-purple-500/20 backdrop-blur-sm
            flex items-center justify-center
            transition-all duration-300
        `.replace(/\s+/g, ' ').trim();
        
        this.dropZone.innerHTML = `
            <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border-2 border-dashed border-purple-400 max-w-md mx-4 text-center transform scale-95 hover:scale-100 transition-transform duration-300">
                <div class="mb-6">
                    <div class="w-20 h-20 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
                        <svg class="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">Húzd ide a fájlt</h3>
                    <p class="text-gray-600 text-sm leading-relaxed">
                        Támogatott formátumok: PDF, DOC, TXT, képek, videók és még sok más
                        <br>
                        <span class="text-purple-600 font-medium">Maximális méret: 50MB</span>
                    </p>
                </div>
                
                <div class="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0s;"></div>
                    <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0.1s;"></div>
                    <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.dropZone);
    }
    
    setupEventListeners() {
        // Prevent default drag behaviors on document
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, this.preventDefaults.bind(this), false);
        });
        
        // Highlight drop zone when item is dragged over page
        ['dragenter', 'dragover'].forEach(eventName => {
            document.addEventListener(eventName, this.handleDragEnter.bind(this), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, this.handleDragLeave.bind(this), false);
        });
        
        // Handle dropped files
        document.addEventListener('drop', this.handleDrop.bind(this), false);
        
        // Textarea specific events for better UX
        this.textarea.addEventListener('dragenter', this.handleTextareaDragEnter.bind(this));
        this.textarea.addEventListener('dragleave', this.handleTextareaDragLeave.bind(this));
        this.textarea.addEventListener('drop', this.handleTextareaDrop.bind(this));
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleDragEnter(e) {
        this.dragCounter++;
        
        if (this.dragCounter === 1) {
            this.showDropZone();
        }
    }
    
    handleDragLeave(e) {
        this.dragCounter--;
        
        if (this.dragCounter === 0) {
            this.hideDropZone();
        }
    }
    
    handleTextareaDragEnter(e) {
        this.textarea.classList.add('border-purple-400', 'bg-purple-50/50');
    }
    
    handleTextareaDragLeave(e) {
        this.textarea.classList.remove('border-purple-400', 'bg-purple-50/50');
    }
    
    handleTextareaDrop(e) {
        this.textarea.classList.remove('border-purple-400', 'bg-purple-50/50');
        this.handleDrop(e);
    }
    
    handleDrop(e) {
        this.dragCounter = 0;
        this.hideDropZone();
        
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            // Determine target path based on drop location
            const targetPath = this.getDropTargetPath(e.target);
            this.handleFiles(files, targetPath);
        }
    }
    
    showDropZone() {
        this.dropZone.classList.remove('hidden');
        // Trigger animation
        setTimeout(() => {
            this.dropZone.style.opacity = '1';
            const content = this.dropZone.querySelector('div');
            if (content) {
                content.style.transform = 'scale(1)';
            }
        }, 10);
    }
    
    hideDropZone() {
        this.dropZone.style.opacity = '0';
        const content = this.dropZone.querySelector('div');
        if (content) {
            content.style.transform = 'scale(0.95)';
        }
        
        setTimeout(() => {
            this.dropZone.classList.add('hidden');
        }, 300);
    }
    
    async handleFiles(files, targetPath = '') {
        const fileArray = Array.from(files);
        
        // Show upload progress
        this.showUploadProgress(fileArray.length);
        
        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];
            
            try {
                await this.uploadFile(file, i + 1, fileArray.length, targetPath);
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                this.showError(`Hiba a fájl feltöltésekor: ${file.name}`);
            }
        }
        
        this.hideUploadProgress();
    }
    
    async uploadFile(file, current, total, targetPath = '') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', targetPath);
        
        const response = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            this.showSuccess(`✅ ${file.name} sikeresen feltöltve`);
            
            // Add file reference to chat
            this.addFileToChat(result.file);
            
            // Refresh file manager if open
            if (window.splitScreenManager && window.splitScreenManager.isFilesPanelOpen) {
                window.splitScreenManager.loadFiles(window.splitScreenManager.currentPath || '');
            }
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    }
    
    addFileToChat(fileInfo) {
        // Create a system message about the uploaded file
        const message = `📎 Fájl feltöltve: **${fileInfo.name}** (${fileInfo.size_formatted})`;
        
        if (window.addSystemMessage) {
            window.addSystemMessage(message);
        } else {
            // Fallback: add to textarea as reference
            const currentText = this.textarea.value;
            const fileRef = `[Fájl: ${fileInfo.name}] `;
            
            if (!currentText.includes(fileRef)) {
                this.textarea.value = fileRef + currentText;
                
                // Trigger textarea resize
                if (window.textareaHandler) {
                    window.textareaHandler.adjustHeight();
                }
            }
        }
    }
    
    showUploadProgress(fileCount) {
        // Create or update progress indicator
        let progressEl = document.getElementById('upload-progress');
        
        if (!progressEl) {
            progressEl = document.createElement('div');
            progressEl.id = 'upload-progress';
            progressEl.className = `
                fixed top-24 right-6 z-40
                bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-gray-200
                transform translate-x-full transition-transform duration-300
            `.replace(/\s+/g, ' ').trim();
            
            document.body.appendChild(progressEl);
        }
        
        progressEl.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-purple-600 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-900">Fájlok feltöltése...</p>
                    <p class="text-xs text-gray-600">${fileCount} fájl</p>
                </div>
            </div>
        `;
        
        // Show with animation
        setTimeout(() => {
            progressEl.style.transform = 'translateX(0)';
        }, 10);
    }
    
    hideUploadProgress() {
        const progressEl = document.getElementById('upload-progress');
        if (progressEl) {
            progressEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                progressEl.remove();
            }, 300);
        }
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `
            fixed top-24 right-6 z-50
            bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-lg border
            transform translate-x-full transition-all duration-300
            ${type === 'success' ? 'border-green-200' : type === 'error' ? 'border-red-200' : 'border-gray-200'}
        `.replace(/\s+/g, ' ').trim();
        
        const iconColor = type === 'success' ? 'text-green-600' : type === 'error' ? 'text-red-600' : 'text-blue-600';
        const bgColor = type === 'success' ? 'bg-green-100' : type === 'error' ? 'bg-red-100' : 'bg-blue-100';
        
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 ${bgColor} rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${type === 'success' ? 
                            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />' :
                            type === 'error' ?
                            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />' :
                            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'
                        }
                    </svg>
                </div>
                <p class="text-sm font-medium text-gray-900">${message}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show with animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    setupFilesPanelDropZone() {
        // Wait for files panel to be created
        document.addEventListener('filesPanelOpened', () => {
            const filesDropZone = document.getElementById('files-drop-zone');
            if (filesDropZone) {
                this.setupFilesPanelDragEvents(filesDropZone);
            }
        });
    }
    
    setupFilesPanelDragEvents(dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults.bind(this), false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                dropZone.classList.add('bg-purple-50/50', 'border-purple-200', 'border-2', 'border-dashed');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                dropZone.classList.remove('bg-purple-50/50', 'border-purple-200', 'border-2', 'border-dashed');
            }, false);
        });
        
        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                const targetPath = window.splitScreenManager?.currentPath || '';
                this.handleFiles(files, targetPath);
            }
        }, false);
    }
    
    getDropTargetPath(target) {
        // Check if dropped in files panel
        const filesPanel = document.getElementById('files-panel');
        if (filesPanel && filesPanel.contains(target)) {
            return window.splitScreenManager?.currentPath || '';
        }
        
        // Default to root for chat area drops
        return '';
    }
}

// Initialize drag & drop handler
let dragDropHandler;
document.addEventListener('DOMContentLoaded', () => {
    dragDropHandler = new DragDropHandler();
    window.dragDropHandler = dragDropHandler;
});
