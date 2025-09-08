/**
 * Professional File Manager - State of the Art Split-Screen Interface
 * Apple/Google/Microsoft quality file management system
 */
class ProfessionalFileManager {
    constructor() {
        this.isOpen = false;
        this.currentPath = '';
        this.files = [];
        this.searchQuery = '';
        this.selectedFiles = new Set();
        this.clipboard = { files: [], operation: null }; // 'copy' or 'cut'
        this.draggedFiles = [];
        this.lastSelectedIndex = -1;
        this.isSelectionMode = false;
        
        this.init();
    }
    
    init() {
        this.createFilePanel();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        console.log('Professional File Manager initialized');
    }
    
    createFilePanel() {
        // Create the main files panel
        const panel = document.createElement('div');
        panel.id = 'files-panel';
        panel.className = `
            fixed top-0 right-0 h-full w-1/2 
            bg-white/95 backdrop-blur-xl border-l border-gray-200/50
            transform translate-x-full transition-transform duration-300 ease-out
            z-30 shadow-2xl
        `;
        
        panel.innerHTML = `
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-200/50">
                <h2 class="text-xl font-semibold text-gray-900">Files</h2>
                <button id="close-files-panel" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            
            <!-- Toolbar -->
            <div class="p-4 border-b border-gray-200/30">
                <div class="flex items-center gap-3 mb-4">
                    <button id="upload-btn" class="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                        Upload
                    </button>
                    <button id="new-folder-btn" class="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        New Folder
                    </button>
                    <button id="selection-mode-btn" class="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span id="selection-mode-text">Select</span>
                    </button>
                    <button id="rag-process-files-btn" class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                        </svg>
                        <span id="rag-process-text">Process for RAG</span>
                    </button>
                </div>
                
                <!-- Search -->
                <div class="relative">
                    <input 
                        type="text" 
                        id="files-search" 
                        placeholder="Search files..." 
                        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                    <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                </div>
            </div>
            
            <!-- Bulk Operations Toolbar (hidden by default) -->
            <div id="bulk-operations" class="hidden px-4 py-3 bg-purple-50 border-b border-purple-200/50">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span id="selection-count" class="text-sm font-medium text-purple-700">0 selected</span>
                        <button id="select-all-btn" class="text-xs text-purple-600 hover:text-purple-800 underline">Select All</button>
                        <button id="clear-selection-btn" class="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="copy-selected-btn" class="p-2 hover:bg-purple-100 rounded-lg transition-colors" title="Copy (Ctrl+C)">
                            <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                            </svg>
                        </button>
                        <button id="cut-selected-btn" class="p-2 hover:bg-purple-100 rounded-lg transition-colors" title="Cut (Ctrl+X)">
                            <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l4.95-4.95m0 0L19 5m-2.05 2.05L13 11m8 8l-4.95-4.95M3 3l4.95 4.95M7.95 7.95L11 11m-7.95 4.95L7 12"/>
                            </svg>
                        </button>
                        <button id="paste-btn" class="p-2 hover:bg-purple-100 rounded-lg transition-colors" title="Paste (Ctrl+V)" disabled>
                            <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                            </svg>
                        </button>
                        <div class="w-px h-6 bg-purple-200 mx-1"></div>
                        <button id="delete-selected-btn" class="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Delete (Del)">
                            <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Breadcrumb -->
            <div id="breadcrumb" class="px-4 py-2 text-sm text-gray-600 border-b border-gray-200/30">
                <span class="hover:text-purple-600 cursor-pointer">Home</span>
            </div>
            
            <!-- RAG Progress Container (hidden by default) -->
            <div id="files-rag-progress-container" class="hidden px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200/50">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-purple-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        <span class="text-sm font-medium text-purple-700">Processing Documents for RAG</span>
                    </div>
                    <span id="files-rag-progress-percentage" class="text-xs text-purple-600 font-medium">0%</span>
                </div>
                <div class="bg-white/60 rounded-full h-2 mb-2">
                    <div id="files-rag-progress-bar" class="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
                <div id="files-rag-progress-text" class="text-xs text-purple-600">
                    Initializing...
                </div>
            </div>
            
            <!-- Files Container with flexible layout -->
            <div class="flex-1 flex flex-col" style="height: calc(100vh - 200px); min-height: 400px;">
                <!-- Files List - scrollable with fixed height -->
                <div id="files-list" class="overflow-y-auto p-4" style="flex: 1 1 40%; min-height: 150px;">
                    <div class="text-center text-gray-500 py-8">
                        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                        </svg>
                        <p>No files yet</p>
                        <p class="text-sm">Upload files or drag them here</p>
                    </div>
                </div>
                
                <!-- File Preview Panel - fixed at bottom with full width (60% height) -->
                <div id="file-preview-panel" class="hidden border-t border-gray-200/50 bg-white/80 backdrop-blur-sm flex flex-col" style="flex: 0 0 80%; min-height: 350px;">
                    <!-- Preview Header -->
                    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 flex-shrink-0">
                        <div class="flex items-center gap-2">
                            <i id="preview-file-icon" class="fas fa-file text-gray-400"></i>
                            <span id="preview-file-name" class="text-sm font-medium text-gray-700">No file selected</span>
                            <span id="preview-file-size" class="text-xs text-gray-500"></span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button id="preview-download-btn" class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Download">
                                <i class="fas fa-download text-gray-400 text-sm"></i>
                            </button>
                            <button id="preview-close-btn" class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Close Preview">
                                <i class="fas fa-times text-gray-400 text-sm"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Preview Content - full width and scrollable -->
                    <div id="file-preview-content" class="flex-1 overflow-y-auto" style="min-height: 0;">
                        <!-- Preview content will be inserted here -->
                    </div>
                </div>
            </div>

            
            <!-- Status Bar -->
            <div id="status-bar" class="px-4 py-2 border-t border-gray-200/30 text-xs text-gray-500 bg-gray-50/50">
                Ready
            </div>
        `;
        
        document.body.appendChild(panel);
        this.panel = panel;
        this.filesPanel = panel;
        
        // Hidden file input for uploads
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        fileInput.id = 'file-input-hidden';
        document.body.appendChild(fileInput);
    }
    
    setupEventListeners() {
        // Files toggle button
        const toggleBtn = document.getElementById('files-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
        
        // Close button
        const closeBtn = document.getElementById('close-files-panel');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Upload button
        const uploadBtn = document.getElementById('upload-btn');
        const fileInput = document.getElementById('file-input-hidden');
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));
        }
        
        // New folder button
        const newFolderBtn = document.getElementById('new-folder-btn');
        if (newFolderBtn) {
            newFolderBtn.addEventListener('click', () => this.createNewFolder());
        }
        
        // Selection mode button
        const selectionModeBtn = document.getElementById('selection-mode-btn');
        if (selectionModeBtn) {
            selectionModeBtn.addEventListener('click', () => this.toggleSelectionMode());
        }
        
        // RAG Process button
        const ragProcessBtn = document.getElementById('rag-process-files-btn');
        if (ragProcessBtn) {
            ragProcessBtn.addEventListener('click', () => this.processFilesForRAG());
        }
        
        // Search
        const searchInput = document.getElementById('files-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
        
        // Bulk Operations Event Listeners
        this.setupBulkOperationListeners();
        
        // Advanced Keyboard Shortcuts
        this.setupAdvancedKeyboardShortcuts();
        
        // Drag and drop on panel
        this.setupDragDrop();
        
        // File Preview Panel Event Listeners
        this.setupPreviewPanelListeners();
    }
    
    setupBulkOperationListeners() {
        // Select All button
        const selectAllBtn = document.getElementById('select-all-btn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAll());
        }
        
        // Clear Selection button
        const clearSelectionBtn = document.getElementById('clear-selection-btn');
        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener('click', () => this.clearSelection());
        }
        
        // Copy button
        const copyBtn = document.getElementById('copy-selected-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copySelectedFiles());
        }
        
        // Cut button
        const cutBtn = document.getElementById('cut-selected-btn');
        if (cutBtn) {
            cutBtn.addEventListener('click', () => this.cutSelectedFiles());
        }
        
        // Paste button
        const pasteBtn = document.getElementById('paste-btn');
        if (pasteBtn) {
            pasteBtn.addEventListener('click', () => this.pasteFiles());
        }
        
        // Delete button
        const deleteBtn = document.getElementById('delete-selected-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteSelectedFiles());
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+F to toggle
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                this.toggle();
            }
            
            // Escape to close
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    setupDragDrop() {
        const panel = this.panel;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            panel.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        
        panel.addEventListener('dragover', () => {
            panel.classList.add('bg-purple-50');
        });
        
        panel.addEventListener('dragleave', (e) => {
            if (!panel.contains(e.relatedTarget)) {
                panel.classList.remove('bg-purple-50');
            }
        });
        
        panel.addEventListener('drop', (e) => {
            panel.classList.remove('bg-purple-50');
            const files = Array.from(e.dataTransfer.files);
            this.handleFileUpload(files);
        });
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

setupDragDrop() {
    const panel = this.panel;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        panel.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    panel.addEventListener('dragover', () => {
        panel.classList.add('bg-purple-50');
    });
    
    panel.addEventListener('dragleave', (e) => {
        if (!panel.contains(e.relatedTarget)) {
            panel.classList.remove('bg-purple-50');
        }
    });
    
    panel.addEventListener('drop', (e) => {
        panel.classList.remove('bg-purple-50');
        const files = Array.from(e.dataTransfer.files);
        this.handleFileUpload(files);
    });
}

toggle() {
    if (this.isOpen) {
        this.close();
    } else {
        this.open();
    }
}

open() {
    if (this.isOpen) return;

    console.log('📂 Opening files panel...');

    // Close profile panel if open
    if (window.profilePanelManager && window.profilePanelManager.isOpen) {
        window.profilePanelManager.close();
    }

    // Show panel
    this.filesPanel.classList.remove('translate-x-full');
    this.filesPanel.classList.add('translate-x-0');

    // Add body class for CSS-based styling
    document.body.classList.add('files-panel-open');
    
    // Update toggle button state
    const toggleBtn = document.getElementById('files-toggle-btn');
    if (toggleBtn) {
        toggleBtn.classList.add('bg-purple-100', 'text-purple-700');
    }
    
    this.isOpen = true;
    
    // Load files with error handling
    this.loadFiles().catch(error => {
        console.log('Initial file load failed, will show empty state');
        this.updateStatus('Ready');
    });
    
    // Initialize RAG controls when panel opens
    if (window.ragManager) {
        window.ragManager.onFilePanelOpen();
    }
    
    console.log('✅ Files panel opened');
}
    
    close() {
        if (!this.isOpen) return;
        
        console.log('📁 Closing files panel...');
        
        // Hide panel
        this.filesPanel.classList.remove('translate-x-0');
        this.filesPanel.classList.add('translate-x-full');
        
        // Remove body class for CSS-based styling
        document.body.classList.remove('files-panel-open');
        
        // Update toggle button state
        const toggleBtn = document.getElementById('files-toggle-btn');
        if (toggleBtn) {
            toggleBtn.classList.remove('bg-purple-100', 'text-purple-700');
        }
        
        this.isOpen = false;
        
        console.log('✅ Files panel closed');
    }
    
    async loadFiles(path = '') {
        try {
            this.updateStatus('Loading files...');
            
            const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.files = data.files || [];
                this.currentPath = path;
                this.renderFiles();
                this.updateBreadcrumb();
                this.updateStatus(`${this.files.length} items`);
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.log('Error loading files:', error.message);
            // Show empty state instead of error
            this.files = [];
            this.currentPath = path;
            this.renderFiles();
            this.updateBreadcrumb();
            this.updateStatus('Ready - Upload files to get started');
        }
    }
    
    renderFiles() {
        const container = document.getElementById('files-list');
        if (!container) return;
        
        if (this.files.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                    <p>No files in this folder</p>
                    <p class="text-sm">Upload files or drag them here</p>
                </div>
            `;
            return;
        }
        
        const filteredFiles = this.searchQuery 
            ? this.files.filter(file => file.name.toLowerCase().includes(this.searchQuery.toLowerCase()))
            : this.files;
        
        container.innerHTML = filteredFiles.map((file, index) => {
            const isSelected = this.selectedFiles.has(file.path);
            const selectionClass = isSelected ? 'bg-purple-100 border-purple-300' : 'hover:bg-gray-50';
            
            return `
                <div class="file-item flex items-center p-3 ${selectionClass} rounded-lg cursor-pointer transition-all duration-200 group border-2 ${isSelected ? 'border-purple-300' : 'border-transparent'}" 
                     data-path="${file.path}" data-type="${file.type}" data-index="${index}"
                     draggable="true">
                    
                    <!-- Selection Checkbox (only in selection mode) -->
                    ${this.isSelectionMode ? `
                        <div class="flex-shrink-0 mr-3">
                            <div class="w-5 h-5 rounded border-2 ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300 hover:border-purple-400'} flex items-center justify-center transition-colors">
                                ${isSelected ? '<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- File Icon -->
                    <div class="flex-shrink-0 mr-3">
                        ${this.getFileIcon(file)}
                    </div>
                    
                    <!-- File Info -->
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium ${isSelected ? 'text-purple-900' : 'text-gray-900'} truncate">${file.name}</p>
                        <p class="text-xs ${isSelected ? 'text-purple-600' : 'text-gray-500'}">${this.formatFileSize(file.size)} • ${this.formatDate(file.modified)}</p>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <button class="action-btn rename-btn p-1 hover:bg-blue-100 rounded text-blue-600" 
                                title="Rename (F2)" data-action="rename" data-path="${file.path}" data-name="${file.name}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button class="action-btn delete-btn p-1 hover:bg-red-100 rounded text-red-600" 
                                title="Delete (Del)" data-action="delete" data-path="${file.path}" data-name="${file.name}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers with selection support
        container.querySelectorAll('.file-item').forEach(item => {
            const filePath = item.dataset.path;
            
            // File item click for selection
            item.addEventListener('click', (e) => {
                // Ne akadályozzuk meg az eseményt, ha action gombra kattintunk
                if (e.target.closest('.action-btn')) {
                    return;
                }
                
                e.preventDefault();
                
                // Only handle selection if in selection mode OR using Ctrl/Shift
                if (this.isSelectionMode || e.ctrlKey || e.metaKey || e.shiftKey) {
                    this.toggleFileSelection(filePath, e);
                } else {
                    // Normal mode: clear selection and open preview for files
                    this.clearSelection();
                    
                    // Open file preview if it's a file (not folder)
                    if (item.dataset.type === 'file') {
                        const fileName = item.querySelector('p').textContent; // Get file name from DOM
                        this.openFilePreview(fileName, filePath);
                    }
                }
            });
            
            // Double click for folder navigation
            item.addEventListener('dblclick', (e) => {
                e.preventDefault();
                if (item.dataset.type === 'folder') {
                    this.loadFiles(filePath);
                }
            });
            
            // Context menu
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.handleContextMenu(e, item);
            });
            
            // Drag start for file moving
            item.addEventListener('dragstart', (e) => {
                this.handleFileDragStart(e, filePath);
            });
            
            // Drop support for folders
            if (item.dataset.type === 'folder') {
                item.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    item.classList.add('bg-blue-100');
                });
                
                item.addEventListener('dragleave', (e) => {
                    item.classList.remove('bg-blue-100');
                });
                
                item.addEventListener('drop', (e) => {
                    e.preventDefault();
                    item.classList.remove('bg-blue-100');
                    
                    // Only handle drop if there's actual data
                    const files = e.dataTransfer.files;
                    const textData = e.dataTransfer.getData('text/plain');
                    
                    if ((files && files.length > 0) || textData) {
                        this.handleFolderDrop(e, filePath);
                    }
                });
            }
        });
        
        // Add action button handlers
        container.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const path = btn.dataset.path;
                const name = btn.dataset.name;
                
                if (action === 'rename') {
                    this.renameItem(path, name);
                } else if (action === 'delete') {
                    this.deleteItem(path, name);
                }
            });
        });
    }
    
    getFileIcon(file) {
        if (file.type === 'folder') {
            return `<svg class="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
            </svg>`;
        }
        
        const ext = file.name.split('.').pop()?.toLowerCase();
        const iconColors = {
            'pdf': 'text-red-500',
            'doc': 'text-blue-600', 'docx': 'text-blue-600',
            'xls': 'text-green-600', 'xlsx': 'text-green-600',
            'ppt': 'text-orange-500', 'pptx': 'text-orange-500',
            'txt': 'text-gray-600', 'md': 'text-gray-600',
            'jpg': 'text-purple-500', 'jpeg': 'text-purple-500', 'png': 'text-purple-500', 'gif': 'text-purple-500',
            'mp4': 'text-pink-500', 'avi': 'text-pink-500', 'mov': 'text-pink-500',
            'mp3': 'text-indigo-500', 'wav': 'text-indigo-500',
            'zip': 'text-yellow-600', 'rar': 'text-yellow-600'
        };
        
        const color = iconColors[ext] || 'text-gray-400';
        
        return `<svg class="w-8 h-8 ${color}" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
        </svg>`;
    }
    
    getFileIconByExtension(extension) {
        const iconMap = {
            'pdf': 'fa-file-pdf',
            'doc': 'fa-file-word', 'docx': 'fa-file-word',
            'xls': 'fa-file-excel', 'xlsx': 'fa-file-excel',
            'ppt': 'fa-file-powerpoint', 'pptx': 'fa-file-powerpoint',
            'txt': 'fa-file-alt', 'md': 'fa-file-alt',
            'json': 'fa-file-code', 'js': 'fa-file-code', 'css': 'fa-file-code', 'html': 'fa-file-code',
            'py': 'fa-file-code', 'java': 'fa-file-code', 'cpp': 'fa-file-code', 'c': 'fa-file-code',
            'jpg': 'fa-file-image', 'jpeg': 'fa-file-image', 'png': 'fa-file-image', 'gif': 'fa-file-image',
            'bmp': 'fa-file-image', 'webp': 'fa-file-image',
            'mp4': 'fa-file-video', 'avi': 'fa-file-video', 'mov': 'fa-file-video',
            'mp3': 'fa-file-audio', 'wav': 'fa-file-audio',
            'zip': 'fa-file-archive', 'rar': 'fa-file-archive'
        };
        
        return iconMap[extension] || 'fa-file';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }
    
    updateBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return;
        
        const parts = this.currentPath.split('/').filter(Boolean);
        const items = ['Home'];
        
        if (parts.length > 0) {
            items.push(...parts);
        }
        
        breadcrumb.innerHTML = items.map((item, index) => {
            const path = index === 0 ? '' : parts.slice(0, index).join('/');
            return `<span class="hover:text-purple-600 cursor-pointer" data-path="${path}">${item}</span>`;
        }).join(' <span class="text-gray-400">/</span> ');
        
        // Add click handlers
        breadcrumb.querySelectorAll('span[data-path]').forEach(span => {
            span.addEventListener('click', () => {
                this.loadFiles(span.dataset.path);
            });
        });
    }
    
    updateStatus(message) {
        const statusBar = document.getElementById('status-bar');
        if (statusBar) {
            statusBar.textContent = message;
        }
    }
    
    handleFileClick(item) {
        const path = item.dataset.path;
        const type = item.dataset.type;
        
        if (type === 'folder') {
            this.loadFiles(path);
        } else {
            // Preview file
            this.previewFile(path);
        }
    }
    
    handleContextMenu(e, item) {
        e.preventDefault();
        // Context menu implementation would go here
        console.log('Context menu for:', item.dataset.path);
    }
    
    async handleFileUpload(files) {
        if (!files || files.length === 0) return;
        
        // Upload files one by one since API expects single file
        const uploadPromises = Array.from(files).map(async (file) => {
            const formData = new FormData();
            formData.append('file', file); // API expects 'file', not 'files'
            
            if (this.currentPath) {
                formData.append('path', this.currentPath);
            }
            
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
        
        try {
            this.updateStatus('Uploading files...');
            
            const results = await Promise.all(uploadPromises);
            
            this.updateStatus(`Uploaded ${files.length} file(s)`);
            this.loadFiles(this.currentPath);
            
            // Add system message to chat
            if (window.addSystemMessage) {
                const fileNames = Array.from(files).map(f => f.name).join(', ');
                window.addSystemMessage(`📎 Uploaded: ${fileNames}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.updateStatus('Upload failed');
        }
    }
    
    async createNewFolder() {
        const name = prompt('Folder name:');
        if (!name) return;
        
        try {
            const response = await fetch('/api/files/folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    path: this.currentPath
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.loadFiles(this.currentPath);
                this.updateStatus('Folder created');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error creating folder:', error);
            this.updateStatus('Error creating folder');
        }
    }
    
    handleSearch(query) {
        this.searchQuery = query;
        this.renderFiles();
    }
    
    async previewFile(path) {
        try {
            const response = await fetch(`/api/files/${encodeURIComponent(path)}/content`);
            const result = await response.json();
            
            if (result.success) {
                // Show preview modal or panel
                console.log('File content:', result.content);
            }
        } catch (error) {
            console.error('Preview error:', error);
        }
    }
    
    async renameItem(path, currentName) {
        const newName = prompt('New name:', currentName);
        if (!newName || newName === currentName) return;
        
        try {
            const response = await fetch(`/api/files/${encodeURIComponent(path)}/rename`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_name: newName })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.loadFiles(this.currentPath);
                this.updateStatus(`Renamed to ${newName}`);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error renaming item:', error);
            this.updateStatus('Error renaming item');
            // Removed alert to avoid blocking UI
        }
    }
    
    async deleteItem(path, name) {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
        
        try {
            const response = await fetch(`/api/files/${encodeURIComponent(path)}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.loadFiles(this.currentPath);
                this.updateStatus(`Deleted ${name}`);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            this.updateStatus('Error deleting item');
            // Removed alert to avoid blocking UI
        }
    }
    
    // ===== PROFESSIONAL SELECTION MANAGEMENT =====
    
    toggleSelectionMode() {
        this.isSelectionMode = !this.isSelectionMode;
        
        const btn = document.getElementById('selection-mode-btn');
        const text = document.getElementById('selection-mode-text');
        
        if (this.isSelectionMode) {
            btn.classList.remove('bg-blue-100', 'text-blue-700');
            btn.classList.add('bg-purple-100', 'text-purple-700');
            text.textContent = 'Cancel';
            
            // Add visual indicator to files panel
            const filesPanel = document.getElementById('files-panel');
            if (filesPanel) {
                filesPanel.classList.add('selection-mode-active');
            }
        } else {
            btn.classList.remove('bg-purple-100', 'text-purple-700');
            btn.classList.add('bg-blue-100', 'text-blue-700');
            text.textContent = 'Select';
            this.clearSelection();
            
            // Remove visual indicator
            const filesPanel = document.getElementById('files-panel');
            if (filesPanel) {
                filesPanel.classList.remove('selection-mode-active');
            }
        }
        
        this.renderFiles();
        console.log('📝 Selection mode:', this.isSelectionMode ? 'ON' : 'OFF');
    }
    
    toggleFileSelection(filePath, event) {
        const fileIndex = this.files.findIndex(f => f.path === filePath);
        
        if (this.isSelectionMode) {
            // Selection mode: simple toggle or range select
            if (event.shiftKey && this.lastSelectedIndex >= 0) {
                // Shift + Click: Range selection
                const start = Math.min(this.lastSelectedIndex, fileIndex);
                const end = Math.max(this.lastSelectedIndex, fileIndex);
                
                for (let i = start; i <= end; i++) {
                    if (this.files[i]) {
                        this.selectedFiles.add(this.files[i].path);
                    }
                }
            } else {
                // Regular click in selection mode: toggle
                if (this.selectedFiles.has(filePath)) {
                    this.selectedFiles.delete(filePath);
                } else {
                    this.selectedFiles.add(filePath);
                }
                this.lastSelectedIndex = fileIndex;
            }
        } else {
            // Normal mode: Ctrl/Cmd for multi-select, otherwise single select
            if (event.ctrlKey || event.metaKey) {
                // Ctrl/Cmd + Click: Toggle individual selection
                if (this.selectedFiles.has(filePath)) {
                    this.selectedFiles.delete(filePath);
                } else {
                    this.selectedFiles.add(filePath);
                }
                this.lastSelectedIndex = fileIndex;
            } else if (event.shiftKey && this.lastSelectedIndex >= 0) {
                // Shift + Click: Range selection
                const start = Math.min(this.lastSelectedIndex, fileIndex);
                const end = Math.max(this.lastSelectedIndex, fileIndex);
                
                for (let i = start; i <= end; i++) {
                    if (this.files[i]) {
                        this.selectedFiles.add(this.files[i].path);
                    }
                }
            } else {
                // Regular click: Single selection (blue highlight)
                this.selectedFiles.clear();
                this.selectedFiles.add(filePath);
                this.lastSelectedIndex = fileIndex;
            }
        }
        
        this.updateSelectionUI();
    }
    
    selectAll() {
        this.selectedFiles.clear();
        this.files.forEach(file => {
            this.selectedFiles.add(file.path);
        });
        this.updateSelectionUI();
    }
    
    clearSelection() {
        this.selectedFiles.clear();
        this.lastSelectedIndex = -1;
        this.updateSelectionUI();
    }
    
    updateSelectionUI() {
        const count = this.selectedFiles.size;
        const bulkOps = document.getElementById('bulk-operations');
        const selectionCount = document.getElementById('selection-count');
        const pasteBtn = document.getElementById('paste-btn');
        
        // Show/hide bulk operations toolbar
        if (count > 0) {
            bulkOps?.classList.remove('hidden');
            this.isSelectionMode = true;
        } else {
            bulkOps?.classList.add('hidden');
            this.isSelectionMode = false;
        }
        
        // Update selection count
        if (selectionCount) {
            selectionCount.textContent = `${count} selected`;
        }
        
        // Update paste button state
        if (pasteBtn) {
            pasteBtn.disabled = this.clipboard.files.length === 0;
            pasteBtn.classList.toggle('opacity-50', this.clipboard.files.length === 0);
        }
        
        // Update file item visual states
        this.renderFiles();
    }
    
    // ===== CLIPBOARD OPERATIONS =====
    
    copySelectedFiles() {
        if (this.selectedFiles.size === 0) return;
        
        this.clipboard = {
            files: Array.from(this.selectedFiles),
            operation: 'copy'
        };
        
        this.updateSelectionUI();
        this.updateStatus(`Copied ${this.selectedFiles.size} items`);
        console.log('📋 Copied files:', this.clipboard.files);
    }
    
    cutSelectedFiles() {
        if (this.selectedFiles.size === 0) return;
        
        this.clipboard = {
            files: Array.from(this.selectedFiles),
            operation: 'cut'
        };
        
        this.updateSelectionUI();
        this.updateStatus(`Cut ${this.selectedFiles.size} items`);
        console.log('✂️ Cut files:', this.clipboard.files);
    }
    
    async pasteFiles() {
        if (this.clipboard.files.length === 0) return;
        
        try {
            const operation = this.clipboard.operation;
            const files = this.clipboard.files;
            
            this.updateStatus(`${operation === 'copy' ? 'Copying' : 'Moving'} ${files.length} items...`);
            
            for (const filePath of files) {
                await this.performFileOperation(filePath, operation);
            }
            
            if (operation === 'cut') {
                this.clipboard = { files: [], operation: null };
            }
            
            this.loadFiles(this.currentPath);
            this.updateStatus(`${operation === 'copy' ? 'Copied' : 'Moved'} ${files.length} items`);
            
        } catch (error) {
            console.error('Paste error:', error);
            this.updateStatus('Error during paste operation');
        }
    }
    
    async performFileOperation(filePath, operation) {
        try {
            const endpoint = operation === 'copy' ? '/api/files/copy' : '/api/files/move';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: [filePath],
                    destination: this.currentPath
                })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || `${operation} operation failed`);
            }
            
            console.log(`✅ ${operation} operation completed:`, result.message);
            return result;
            
        } catch (error) {
            console.error(`❌ ${operation} operation failed:`, error);
            throw error;
        }
    }
    
    // ===== BULK DELETE =====
    
    async deleteSelectedFiles() {
        if (this.selectedFiles.size === 0) return;
        
        const count = this.selectedFiles.size;
        const confirmed = confirm(`Are you sure you want to delete ${count} selected items?`);
        
        if (!confirmed) return;
        
        try {
            this.updateStatus(`Deleting ${count} items...`);
            
            const response = await fetch('/api/files/bulk-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: Array.from(this.selectedFiles)
                })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Bulk delete failed');
            }
            
            this.selectedFiles.clear();
            this.updateSelectionUI();
            this.loadFiles(this.currentPath);
            this.updateStatus(result.message || `Deleted ${count} items`);
            
            console.log('✅ Bulk delete completed:', result.deleted_files);
            
        } catch (error) {
            console.error('❌ Bulk delete error:', error);
            this.updateStatus('Error during bulk delete');
            // Removed alert to avoid blocking UI
        }
    }
    
    // ===== DRAG & DROP FOR FILE MOVING =====
    
    setupFileDragDrop() {
        // This will be called during file rendering to setup drag & drop
        // for moving files between folders
    }
    
    handleFileDragStart(event, filePath) {
        this.draggedFiles = this.selectedFiles.has(filePath) 
            ? Array.from(this.selectedFiles)
            : [filePath];
            
        event.dataTransfer.setData('text/plain', JSON.stringify(this.draggedFiles));
        event.dataTransfer.effectAllowed = 'move';
        
        console.log('🎯 Dragging files:', this.draggedFiles);
    }
    
    async handleFolderDrop(event, targetFolder) {
        event.preventDefault();
        
        try {
            // Check if this is external files (from computer) or internal files (from within app)
            const files = event.dataTransfer.files;
            const textData = event.dataTransfer.getData('text/plain');
            
            if (files && files.length > 0) {
                // External files - upload them to the target folder
                console.log('📁 Uploading external files to folder:', targetFolder, files);
                await this.handleFolderUpload(files, targetFolder);
                
            } else if (textData) {
                // Internal files - move them to target folder
                try {
                    const draggedFiles = JSON.parse(textData);
                    console.log('📁 Moving internal files to folder:', targetFolder, draggedFiles);
                    
                    this.updateStatus(`Moving ${draggedFiles.length} items to ${targetFolder}...`);
                    
                    // Move files to target folder
                    const response = await fetch('/api/files/move', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            files: draggedFiles,
                            destination: targetFolder
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (!result.success) {
                        throw new Error(result.error || 'Move operation failed');
                    }
                    
                    // Clear selection and refresh
                    this.selectedFiles.clear();
                    this.updateSelectionUI();
                    this.loadFiles(this.currentPath);
                    this.updateStatus(result.message || `Moved ${draggedFiles.length} items`);
                    
                    console.log('✅ Files moved successfully:', result.moved_files);
                    
                } catch (jsonError) {
                    console.error('❌ JSON parse error:', jsonError);
                    this.updateStatus('Invalid drag data');
                }
            } else {
                console.log('⚠️ No valid drag data found');
                this.updateStatus('No files to process');
            }
            
        } catch (error) {
            console.error('❌ Drop error:', error);
            this.updateStatus('Error processing drop');
            // Removed alert to avoid blocking UI
        }
    }
    
    // ===== FOLDER UPLOAD =====
    
    async handleFolderUpload(files, targetFolder) {
        try {
            this.updateStatus(`Uploading ${files.length} files to ${targetFolder}...`);
            
            const uploadPromises = Array.from(files).map(file => 
                this.uploadFileToFolder(file, targetFolder)
            );
            
            const results = await Promise.all(uploadPromises);
            const successCount = results.filter(r => r.success).length;
            
            this.loadFiles(this.currentPath);
            this.updateStatus(`Uploaded ${successCount}/${files.length} files to ${targetFolder}`);
            
            console.log('✅ Folder upload completed:', successCount, 'files');
            
        } catch (error) {
            console.error('❌ Folder upload error:', error);
            this.updateStatus('Error uploading files to folder');
        }
    }
    
    async uploadFileToFolder(file, targetFolder) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', targetFolder);
            
            const response = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (!result.success) {
                console.error('❌ Upload failed for', file.name, ':', result.error);
                return { success: false, error: result.error };
            }
            
            console.log('✅ Uploaded', file.name, 'to', targetFolder);
            return { success: true, file: result.file };
            
        } catch (error) {
            console.error('❌ Upload error for', file.name, ':', error);
            return { success: false, error: error.message };
        }
    }
    
    // ===== KEYBOARD SHORTCUTS =====
    
    setupAdvancedKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            
            // Only handle shortcuts when files panel is focused
            const activeElement = document.activeElement;
            const isInFilesPanel = activeElement?.closest('#files-panel');
            
            if (!isInFilesPanel) return;
            
            switch (true) {
                case e.ctrlKey && e.key === 'a':
                    e.preventDefault();
                    this.selectAll();
                    break;
                    
                case e.ctrlKey && e.key === 'c':
                    e.preventDefault();
                    this.copySelectedFiles();
                    break;
                    
                case e.ctrlKey && e.key === 'x':
                    e.preventDefault();
                    this.cutSelectedFiles();
                    break;
                    
                case e.ctrlKey && e.key === 'v':
                    e.preventDefault();
                    this.pasteFiles();
                    break;
                    
                case e.key === 'Delete':
                    e.preventDefault();
                    this.deleteSelectedFiles();
                    break;
                    
                case e.key === 'Escape':
                    this.clearSelection();
                    break;
                    
                case e.key === 'F2':
                    if (this.selectedFiles.size === 1) {
                        const filePath = Array.from(this.selectedFiles)[0];
                        const fileName = filePath.split('/').pop();
                        this.renameItem(filePath, fileName);
                    }
                    break;
            }
        });
    }
    
    // RAG Processing Methods
    async processFilesForRAG() {
        console.log('🧠 Starting RAG processing...');
        
        try {
            // Check if there are RAG-compatible files
            const ragCompatibleFiles = await this.getRagCompatibleFiles();
            
            if (ragCompatibleFiles.length === 0) {
                this.showNotification('No RAG-compatible files found (PDF, TXT, JSON, MD)', 'warning');
                return;
            }
            
            // Update button state
            const ragBtn = document.getElementById('rag-process-files-btn');
            const ragBtnText = document.getElementById('rag-process-text');
            
            if (ragBtn && ragBtnText) {
                ragBtn.disabled = true;
                ragBtn.classList.add('opacity-50', 'cursor-not-allowed');
                ragBtnText.textContent = 'Processing...';
            }
            
            // Show progress container
            this.showRAGProgress();
            
            // Setup progress callback
            const progressCallback = (progress, status) => {
                this.updateRAGProgress(progress, status);
            };
            
            // Setup Socket.IO listener for progress updates
            if (window.socket) {
                window.socket.on('rag_progress', progressCallback);
            }
            
            // Start processing
            const response = await fetch('/api/rag/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.updateRAGProgress(100, 'Processing complete!');
                this.showNotification(
                    `Successfully processed ${result.stats.processed_files} files, created ${result.stats.total_chunks} chunks`,
                    'success'
                );
                
                // Update status
                this.updateStatus(`RAG: ${result.stats.total_chunks} chunks ready`);
                
                // Hide progress after 3 seconds
                setTimeout(() => {
                    this.hideRAGProgress();
                }, 3000);
                
            } else {
                throw new Error(result.error || 'Processing failed');
            }
            
        } catch (error) {
            console.error('RAG processing error:', error);
            this.updateRAGProgress(0, 'Processing failed');
            this.showNotification(`RAG processing failed: ${error.message}`, 'error');
            
            // Hide progress after 2 seconds
            setTimeout(() => {
                this.hideRAGProgress();
            }, 2000);
            
        } finally {
            // Reset button state
            const ragBtn = document.getElementById('rag-process-files-btn');
            const ragBtnText = document.getElementById('rag-process-text');
            
            if (ragBtn && ragBtnText) {
                ragBtn.disabled = false;
                ragBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                ragBtnText.textContent = 'Process for RAG';
            }
            
            // Cleanup Socket.IO listener
            if (window.socket) {
                window.socket.off('rag_progress');
            }
        }
    }
    
    async getRagCompatibleFiles() {
        try {
            const response = await fetch('/api/files');
            const result = await response.json();
            
            if (result.success) {
                const supportedExtensions = ['.pdf', '.txt', '.json', '.md'];
                return result.files.filter(file => 
                    supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
                );
            }
            return [];
        } catch (error) {
            console.error('Failed to get RAG compatible files:', error);
            return [];
        }
    }
    
    showRAGProgress() {
        const progressContainer = document.getElementById('files-rag-progress-container');
        if (progressContainer) {
            progressContainer.classList.remove('hidden');
        }
    }
    
    hideRAGProgress() {
        const progressContainer = document.getElementById('files-rag-progress-container');
        if (progressContainer) {
            progressContainer.classList.add('hidden');
        }
    }
    
    updateRAGProgress(progress, status) {
        const progressBar = document.getElementById('files-rag-progress-bar');
        const progressText = document.getElementById('files-rag-progress-text');
        const progressPercentage = document.getElementById('files-rag-progress-percentage');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = status;
        }
        
        if (progressPercentage) {
            progressPercentage.textContent = `${Math.round(progress)}%`;
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-4 z-50 p-4 rounded-xl shadow-lg max-w-sm transform translate-x-full transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500/90 text-white' :
            type === 'error' ? 'bg-red-500/90 text-white' :
            type === 'warning' ? 'bg-yellow-500/90 text-white' :
            'bg-blue-500/90 text-white'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                    type === 'success' ? 'fa-check-circle' :
                    type === 'error' ? 'fa-exclamation-circle' :
                    type === 'warning' ? 'fa-exclamation-triangle' :
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
    
    // File Preview Panel Methods
    setupPreviewPanelListeners() {
        // Close preview button
        const closeBtn = document.getElementById('preview-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePreview());
        }
        
        // Download button
        const downloadBtn = document.getElementById('preview-download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadPreviewFile());
        }
    }
    
    async openFilePreview(filename, filePath = null) {
        console.log('📄 Opening file preview for:', filename);
        
        try {
            // Show preview panel
            const previewPanel = document.getElementById('file-preview-panel');
            if (previewPanel) {
                previewPanel.classList.remove('hidden');
            }
            
            // Update header info
            this.updatePreviewHeader(filename);
            
            // Get file content
            const actualPath = filePath || filename;
            const response = await fetch(`/api/files/${encodeURIComponent(actualPath)}/content`);
            
            if (!response.ok) {
                throw new Error(`Failed to load file: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Update file size in header if available
                const sizeElement = document.getElementById('preview-file-size');
                if (sizeElement && result.file_info) {
                    sizeElement.textContent = result.file_info.size_formatted || '';
                }
                
                this.displayPreviewContent(filename, result.content, result.file_type);
            } else {
                throw new Error(result.error || 'Failed to load file content');
            }
            
        } catch (error) {
            console.error('Preview error:', error);
            this.showPreviewError(error.message);
        }
    }
    
    updatePreviewHeader(filename) {
        const nameElement = document.getElementById('preview-file-name');
        const iconElement = document.getElementById('preview-file-icon');
        const sizeElement = document.getElementById('preview-file-size');
        
        if (nameElement) {
            nameElement.textContent = filename;
        }
        
        if (iconElement) {
            const extension = filename.split('.').pop().toLowerCase();
            iconElement.className = `fas ${this.getFileIconByExtension(extension)} text-purple-500`;
        }
        
        // Store current file for download
        this.currentPreviewFile = filename;
    }
    
    displayPreviewContent(filename, content, fileType) {
        const contentElement = document.getElementById('file-preview-content');
        if (!contentElement) return;
        
        const extension = filename.split('.').pop().toLowerCase();
        
        // Clear previous content
        contentElement.innerHTML = '';
        
        if (['txt', 'md', 'json', 'js', 'css', 'html', 'py', 'java', 'cpp', 'c'].includes(extension)) {
            // Text-based files
            this.displayTextContent(contentElement, content, extension);
        } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
            // Image files
            this.displayImageContent(contentElement, filename);
        } else if (extension === 'pdf') {
            // PDF files
            this.displayPDFContent(contentElement, filename);
        } else {
            // Unsupported file type
            this.displayUnsupportedContent(contentElement, extension);
        }
    }
    
    displayTextContent(container, content, extension) {
        // Set container to full height with no padding
        container.style.height = '100%';
        container.style.padding = '0';
        
        const pre = document.createElement('pre');
        pre.className = 'whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed';
        
        // Force full height with inline styles
        pre.style.width = '100%';
        pre.style.height = '100%';
        pre.style.margin = '0';
        pre.style.padding = '16px'; // equivalent to p-4
        pre.style.overflow = 'auto';
        pre.style.boxSizing = 'border-box';
        pre.style.minHeight = '100%';
        
        // Syntax highlighting for code files
        if (['js', 'css', 'html', 'py', 'java', 'cpp', 'c', 'json'].includes(extension)) {
            pre.style.backgroundColor = '#f9fafb'; // bg-gray-50
            pre.style.border = '1px solid #e5e7eb'; // border-gray-200
            pre.style.borderRadius = '8px'; // rounded-lg
        } else {
            pre.style.backgroundColor = '#ffffff'; // bg-white
        }
        
        pre.textContent = content;
        container.appendChild(pre);
    }
    
    displayImageContent(container, filename) {
        // Set container to full height with no padding
        container.style.height = '100%';
        container.style.padding = '0';
        
        const img = document.createElement('img');
        img.src = `/api/files/${encodeURIComponent(filename)}/download`;
        img.className = 'max-w-full max-h-full object-contain mx-auto';
        img.alt = filename;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-center justify-center w-full h-full';
        wrapper.style.height = '100%';
        wrapper.appendChild(img);
        
        container.appendChild(wrapper);
    }
    
    displayPDFContent(container, filename) {
        // Clear container and set full height
        container.style.height = '100%';
        container.style.padding = '0';
        
        // PDF viewer container - full height
        const viewerContainer = document.createElement('div');
        viewerContainer.className = 'w-full h-full bg-gray-100 overflow-hidden';
        viewerContainer.style.height = '100%';
        
        // Create iframe for PDF viewing
        const iframe = document.createElement('iframe');
        iframe.className = 'w-full h-full border-0';
        iframe.src = `/api/files/${encodeURIComponent(filename)}/view#view=FitH`;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        
        // Add loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'absolute inset-0 flex items-center justify-center bg-gray-50';
        loadingDiv.innerHTML = `
            <div class="text-center">
                <i class="fas fa-spinner fa-spin text-red-500 text-2xl mb-2"></i>
                <p class="text-sm text-gray-600">Loading PDF...</p>
            </div>
        `;
        
        viewerContainer.style.position = 'relative';
        viewerContainer.appendChild(loadingDiv);
        viewerContainer.appendChild(iframe);
        
        // Remove loading indicator when iframe loads
        iframe.onload = () => {
            setTimeout(() => {
                if (loadingDiv.parentNode) {
                    loadingDiv.remove();
                }
            }, 500);
        };
        
        // Error handling
        iframe.onerror = () => {
            viewerContainer.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-yellow-500 text-2xl mb-2"></i>
                        <p class="text-sm text-gray-600 mb-4">Unable to display PDF in browser</p>
                        <button onclick="window.fileManager.downloadCurrentFile()" 
                                class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                            <i class="fas fa-download mr-2"></i>Download PDF
                        </button>
                    </div>
                </div>
            `;
        };
        
        container.appendChild(viewerContainer);
    }
    
    displayUnsupportedContent(container, extension) {
        // Set container to full height with no padding
        container.style.height = '100%';
        container.style.padding = '0';
        
        const unsupported = document.createElement('div');
        unsupported.className = 'flex items-center justify-center h-full text-center text-gray-500';
        unsupported.style.height = '100%';
        unsupported.innerHTML = `
            <div class="text-center">
                <i class="fas fa-file text-gray-300 text-3xl mb-4"></i>
                <p class="mb-2">Preview not available</p>
                <p class="text-sm text-gray-400 mb-4">File type .${extension} is not supported for preview</p>
                <button onclick="window.fileManager.downloadCurrentFile()" 
                        class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                    <i class="fas fa-download mr-2"></i>Download File
                </button>
            </div>
        `;
        container.appendChild(unsupported);
    }
    
    downloadCurrentFile() {
        if (this.currentPreviewFile) {
            const downloadUrl = `/api/files/${encodeURIComponent(this.currentPreviewFile)}/download`;
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = this.currentPreviewFile;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    
    showPreviewError(message) {
        const contentElement = document.getElementById('file-preview-content');
        if (!contentElement) return;
        
        contentElement.innerHTML = `
            <div class="text-center text-red-500 py-8">
                <i class="fas fa-exclamation-triangle text-2xl mb-4"></i>
                <p class="mb-2">Preview Error</p>
                <p class="text-sm text-gray-600">${message}</p>
            </div>
        `;
    }
    
    closePreview() {
        const previewPanel = document.getElementById('file-preview-panel');
        if (previewPanel) {
            previewPanel.classList.add('hidden');
        }
        this.currentPreviewFile = null;
    }
    
    downloadPreviewFile() {
        if (this.currentPreviewFile) {
            const link = document.createElement('a');
            link.href = `/api/files/${encodeURIComponent(this.currentPreviewFile)}/download`;
            link.download = this.currentPreviewFile;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fileManager = new ProfessionalFileManager();
});
