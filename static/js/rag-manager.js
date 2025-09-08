/**
 * RAG Manager - Professional RAG system frontend integration
 * Handles document processing, progress tracking, and RAG search integration
 */

class RAGManager {
    constructor() {
        this.isProcessing = false;
        this.processButton = null;
        this.progressBar = null;
        this.progressText = null;
        this.ragToggle = null;
        this.statsContainer = null;
        
        this.init();
    }
    
    init() {
        console.log('RAG Manager initializing...');
        this.setupEventListeners();
        this.loadStats();
    }
    
    setupEventListeners() {
        // Socket.IO events for RAG progress
        if (window.socket) {
            window.socket.on('rag_progress', (data) => {
                this.updateProgress(data.progress, data.status);
            });
            
            window.socket.on('rag_sources', (data) => {
                this.displayRAGSources(data.sources);
            });
            
            window.socket.on('rag_error', (data) => {
                this.showError(data.message);
            });
        }
    }
    
    createRAGControls() {
        // Create RAG controls in the file panel
        const ragControlsHTML = `
            <div class="rag-controls bg-white/10 backdrop-blur-xl rounded-2xl p-4 mb-4 border border-white/20">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-lg font-semibold text-white">RAG System</h3>
                    <div class="rag-stats text-sm text-white/70">
                        <span id="rag-doc-count">0 documents</span>
                    </div>
                </div>
                
                <div class="mb-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <div class="flex items-center mb-2">
                        <i class="fas fa-info-circle text-blue-400 mr-2"></i>
                        <span class="text-sm font-medium text-blue-300">How to use RAG:</span>
                    </div>
                    <ol class="text-xs text-blue-200/80 space-y-1 ml-6">
                        <li>1. Upload PDF/TXT/JSON files</li>
                        <li>2. Click "Process Documents"</li>
                        <li>3. Enable "Use RAG Search" in chat</li>
                        <li>4. Ask questions about your documents</li>
                    </ol>
                </div>
                
                <div class="space-y-3">
                    <!-- Process Button -->
                    <button id="rag-process-btn" 
                            class="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 
                                   text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 
                                   disabled:opacity-50 disabled:cursor-not-allowed">
                        <i class="fas fa-cogs mr-2"></i>
                        Process Documents
                    </button>
                    
                    <!-- Progress Bar -->
                    <div id="rag-progress-container" class="hidden">
                        <div class="bg-white/20 rounded-full h-2 mb-2">
                            <div id="rag-progress-bar" 
                                 class="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-300" 
                                 style="width: 0%"></div>
                        </div>
                        <div id="rag-progress-text" class="text-sm text-white/80 text-center">
                            Ready to process...
                        </div>
                    </div>
                    
                    <!-- Clear Database Button -->
                    <button id="rag-clear-btn" 
                            class="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 
                                   font-medium py-2 px-4 rounded-xl transition-all duration-200 border border-red-500/30">
                        <i class="fas fa-trash mr-2"></i>
                        Clear Database
                    </button>
                </div>
            </div>
        `;
        
        return ragControlsHTML;
    }
    
    injectRAGControls() {
        // Find the file panel and inject RAG controls
        const filePanel = document.querySelector('.files-panel-content');
        if (filePanel) {
            // Add RAG controls at the top
            const ragControlsDiv = document.createElement('div');
            ragControlsDiv.innerHTML = this.createRAGControls();
            filePanel.insertBefore(ragControlsDiv.firstElementChild, filePanel.firstChild);
            
            // Setup button event listeners
            this.setupRAGButtons();
        }
    }
    
    setupRAGButtons() {
        this.processButton = document.getElementById('rag-process-btn');
        this.progressBar = document.getElementById('rag-progress-bar');
        this.progressText = document.getElementById('rag-progress-text');
        this.progressContainer = document.getElementById('rag-progress-container');
        
        // Process button
        if (this.processButton) {
            this.processButton.addEventListener('click', () => {
                this.processDocuments();
            });
        }
        
        // Clear button
        const clearButton = document.getElementById('rag-clear-btn');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearDatabase();
            });
        }
    }
    
    async processDocuments() {
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            this.processButton.disabled = true;
            this.processButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
            this.progressContainer.classList.remove('hidden');
            this.updateProgress(0, 'Starting document processing...');
            
            const response = await fetch('/api/rag/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.updateProgress(100, 'Processing complete!');
                this.showSuccess(`Successfully processed ${result.stats.processed_files} files, created ${result.stats.total_chunks} chunks`);
                this.loadStats(); // Refresh stats
                
                // Reset button to normal state
                this.processButton.classList.remove('animate-pulse');
                this.processButton.innerHTML = '<i class="fas fa-cogs mr-2"></i>Process Documents';
                
                // Hide progress after 3 seconds
                setTimeout(() => {
                    this.progressContainer.classList.add('hidden');
                }, 3000);
            } else {
                throw new Error(result.error || 'Processing failed');
            }
            
        } catch (error) {
            console.error('RAG processing error:', error);
            this.showError(`Processing failed: ${error.message}`);
            this.updateProgress(0, 'Processing failed');
        } finally {
            this.isProcessing = false;
            this.processButton.disabled = false;
            this.processButton.innerHTML = '<i class="fas fa-cogs mr-2"></i>Process Documents';
        }
    }
    
    async clearDatabase() {
        if (!confirm('Are you sure you want to clear the RAG database? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch('/api/rag/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Database cleared successfully');
                this.loadStats(); // Refresh stats
            } else {
                throw new Error(result.error || 'Clear failed');
            }
            
        } catch (error) {
            console.error('RAG clear error:', error);
            this.showError(`Clear failed: ${error.message}`);
        }
    }
    
    async loadStats() {
        try {
            const response = await fetch('/api/rag/stats');
            const result = await response.json();
            
            if (result.success) {
                this.updateStats(result.stats);
                this.checkForUnprocessedFiles(result.stats);
            }
        } catch (error) {
            console.error('Failed to load RAG stats:', error);
        }
    }
    
    async checkForUnprocessedFiles(stats) {
        try {
            // Get list of files in uploads
            const filesResponse = await fetch('/api/files');
            const filesResult = await filesResponse.json();
            
            if (filesResult.success) {
                const supportedExtensions = ['.pdf', '.txt', '.json', '.md'];
                const ragSupportedFiles = filesResult.files.filter(file => 
                    supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
                );
                
                // If there are RAG-supported files but no documents in database
                if (ragSupportedFiles.length > 0 && (!stats.document_count || stats.document_count === 0)) {
                    this.showUnprocessedFilesNotification(ragSupportedFiles.length);
                }
            }
        } catch (error) {
            console.error('Failed to check for unprocessed files:', error);
        }
    }
    
    showUnprocessedFilesNotification(fileCount) {
        const processBtn = document.getElementById('rag-process-btn');
        if (processBtn) {
            // Add pulsing animation to process button
            processBtn.classList.add('animate-pulse');
            processBtn.innerHTML = `<i class="fas fa-exclamation-triangle mr-2 text-yellow-300"></i>Process ${fileCount} Documents`;
            
            // Show notification
            this.showNotification(
                `You have ${fileCount} unprocessed documents. Click "Process Documents" to enable RAG search!`,
                'info'
            );
        }
    }
    
    updateStats(stats) {
        const docCountElement = document.getElementById('rag-doc-count');
        if (docCountElement) {
            const count = stats.document_count || 0;
            docCountElement.textContent = `${count} documents`;
        }
    }
    
    updateProgress(progress, status) {
        if (this.progressBar) {
            this.progressBar.style.width = `${progress}%`;
        }
        
        if (this.progressText) {
            this.progressText.textContent = status;
        }
    }
    
    displayRAGSources(sources) {
        // Create or update RAG sources display
        let sourcesContainer = document.getElementById('rag-sources-display');
        
        if (!sourcesContainer) {
            sourcesContainer = document.createElement('div');
            sourcesContainer.id = 'rag-sources-display';
            sourcesContainer.className = 'rag-sources bg-blue-500/10 backdrop-blur-xl rounded-2xl p-4 mb-4 border border-blue-500/20';
            
            // Insert after the last user message
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.appendChild(sourcesContainer);
            }
        }
        
        const sourcesHTML = `
            <div class="flex items-center mb-3">
                <i class="fas fa-search text-blue-400 mr-2"></i>
                <h4 class="text-sm font-semibold text-blue-300">RAG Sources Used</h4>
            </div>
            <div class="space-y-2">
                ${sources.map((source, index) => `
                    <div class="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-xs font-medium text-blue-300">${source.source}</span>
                            <span class="text-xs text-white/60">Score: ${(source.relevance_score * 100).toFixed(0)}%</span>
                        </div>
                        <p class="text-xs text-white/80 line-clamp-2">${source.content}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        sourcesContainer.innerHTML = sourcesHTML;
        
        // Scroll to show sources
        sourcesContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (sourcesContainer.parentNode) {
                sourcesContainer.remove();
            }
        }, 10000);
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg max-w-sm transform translate-x-full transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500/90 text-white' :
            type === 'error' ? 'bg-red-500/90 text-white' :
            'bg-blue-500/90 text-white'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                    type === 'success' ? 'fa-check-circle' :
                    type === 'error' ? 'fa-exclamation-circle' :
                    'fa-info-circle'
                } mr-2"></i>
                <span class="text-sm font-medium">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(full)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }
    
    // Method to be called when file panel opens
    onFilePanelOpen() {
        // Inject RAG controls if not already present
        if (!document.getElementById('rag-process-btn')) {
            this.injectRAGControls();
        }
        this.loadStats();
    }
}

// Global RAG manager instance
window.ragManager = new RAGManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RAGManager;
}
