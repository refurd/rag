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
            
            <!-- Files List -->
            <div id="files-list" class="flex-1 overflow-y-auto p-4">
                <div class="text-center text-gray-500 py-8">
                    <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                    <p>No files yet</p>
                    <p class="text-sm">Upload files or drag them here</p>
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
                    // Normal mode: just clear any existing selection
                    this.clearSelection();
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fileManager = new ProfessionalFileManager();
});
