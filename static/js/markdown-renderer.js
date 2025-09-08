// markdown-renderer.js: State-of-the-art markdown and code rendering
// Maximum ~200 lines

class MarkdownRenderer {
    constructor() {
        this.marked = null;
        this.DOMPurify = null;
        this.Prism = null;
        this.copyButtonId = 0;
        
        this.init();
    }
    
    init() {
        // Wait for libraries to load
        if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        this.marked = marked;
        this.DOMPurify = DOMPurify;
        this.Prism = window.Prism;
        
        this.setupMarked();
        console.log('Markdown renderer initialized');
    }
    
    setupMarked() {
        // Configure marked with GitHub Flavored Markdown
        this.marked.setOptions({
            gfm: true,
            breaks: true,
            sanitize: false, // We'll use DOMPurify instead
            highlight: null // We'll handle this manually with Prism
        });
        
        // Custom renderer for better control
        const renderer = new this.marked.Renderer();
        
        // Custom code block renderer
        renderer.code = (code, language) => {
            const validLang = language && this.isValidLanguage(language) ? language : this.detectLanguage(code);
            const escapedCode = this.escapeHtml(code);
            const copyId = `copy-btn-${++this.copyButtonId}`;
            
            return `
                <div class="code-block-container relative group mb-4">
                    <div class="flex items-center justify-between bg-gray-800 text-gray-300 px-4 py-2 rounded-t-lg text-sm">
                        <span class="font-medium">${validLang}</span>
                        <button class="copy-btn opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-700 p-1 rounded" 
                                data-copy-id="${copyId}" title="Copy code">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                        </button>
                    </div>
                    <pre class="!mt-0 !mb-0 rounded-t-none overflow-x-auto"><code class="language-${validLang}" data-copy-target="${copyId}">${escapedCode}</code></pre>
                </div>
            `;
        };
        
        // Custom inline code renderer
        renderer.codespan = (code) => {
            return `<code class="inline-code bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">${this.escapeHtml(code)}</code>`;
        };
        
        // Custom link renderer with security
        renderer.link = (href, title, text) => {
            const titleAttr = title ? ` title="${this.escapeHtml(title)}"` : '';
            return `<a href="${this.escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-purple-600 hover:text-purple-800 underline"${titleAttr}>${text}</a>`;
        };
        
        // Custom blockquote renderer
        renderer.blockquote = (quote) => {
            return `<blockquote class="border-l-4 border-purple-300 pl-4 py-2 my-4 bg-gray-50 italic text-gray-700">${quote}</blockquote>`;
        };
        
        // Custom table renderer
        renderer.table = (header, body) => {
            return `
                <div class="table-container overflow-x-auto my-4">
                    <table class="min-w-full border-collapse border border-gray-300">
                        <thead class="bg-gray-50">${header}</thead>
                        <tbody>${body}</tbody>
                    </table>
                </div>
            `;
        };
        
        renderer.tablerow = (content) => {
            return `<tr class="border-b border-gray-200">${content}</tr>`;
        };
        
        renderer.tablecell = (content, flags) => {
            const tag = flags.header ? 'th' : 'td';
            const align = flags.align ? ` style="text-align: ${flags.align}"` : '';
            const classes = flags.header ? 'px-4 py-2 font-semibold text-left' : 'px-4 py-2';
            return `<${tag} class="${classes}"${align}>${content}</${tag}>`;
        };
        
        this.marked.setOptions({ renderer });
    }
    
    isValidLanguage(lang) {
        // Common programming languages supported by Prism
        const supportedLangs = [
            'javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'php', 'ruby', 'go', 'rust',
            'typescript', 'html', 'css', 'scss', 'json', 'xml', 'yaml', 'markdown', 'bash',
            'shell', 'sql', 'r', 'matlab', 'swift', 'kotlin', 'dart', 'scala', 'haskell',
            'clojure', 'elixir', 'erlang', 'lua', 'perl', 'powershell', 'dockerfile', 'nginx'
        ];
        return supportedLangs.includes(lang.toLowerCase());
    }
    
    detectLanguage(code) {
        // Simple language detection based on common patterns
        const patterns = {
            'python': [/^from\s+\w+\s+import/m, /^import\s+\w+/m, /def\s+\w+\(/m, /if\s+__name__\s*==\s*['"]__main__['"]/m],
            'javascript': [/^const\s+\w+\s*=/m, /^let\s+\w+\s*=/m, /^var\s+\w+\s*=/m, /function\s+\w+\(/m, /=>/m],
            'html': [/<\/?[a-z][\s\S]*>/i, /<!DOCTYPE/i],
            'css': [/\{[^}]*\}/m, /@media/m, /\.[a-zA-Z][\w-]*\s*\{/m],
            'json': [/^\s*[{\[]/m, /"\w+"\s*:/m],
            'bash': [/^#!/m, /\$\w+/m, /echo\s+/m],
            'sql': [/SELECT\s+/i, /FROM\s+/i, /WHERE\s+/i, /INSERT\s+INTO/i],
            'java': [/public\s+class\s+\w+/m, /public\s+static\s+void\s+main/m],
            'cpp': [/#include\s*<\w+>/m, /int\s+main\s*\(/m, /std::/m],
            'php': [/<\?php/m, /\$\w+/m]
        };
        
        for (const [lang, langPatterns] of Object.entries(patterns)) {
            if (langPatterns.some(pattern => pattern.test(code))) {
                return lang;
            }
        }
        
        return 'text';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    render(markdownText) {
        if (!this.marked || !this.DOMPurify) {
            return '<p class="text-gray-500">Loading markdown renderer...</p>';
        }
        
        try {
            // Parse markdown
            const rawHtml = this.marked.parse(markdownText);
            
            // Sanitize HTML
            const cleanHtml = this.DOMPurify.sanitize(rawHtml, {
                ALLOWED_TAGS: [
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'u', 's',
                    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
                    'tbody', 'tr', 'th', 'td', 'div', 'span', 'button', 'svg', 'path'
                ],
                ALLOWED_ATTR: [
                    'href', 'title', 'alt', 'src', 'class', 'style', 'target', 'rel',
                    'data-copy-id', 'data-copy-target', 'stroke-linecap', 'stroke-linejoin',
                    'stroke-width', 'fill', 'stroke', 'viewBox', 'd'
                ]
            });
            
            return cleanHtml;
        } catch (error) {
            console.error('Markdown rendering error:', error);
            return `<p class="text-red-500">Error rendering markdown: ${error.message}</p>`;
        }
    }
    
    // Apply syntax highlighting after DOM insertion
    highlightCode(container) {
        if (!this.Prism) return;
        
        const codeBlocks = container.querySelectorAll('pre code[class*="language-"]');
        codeBlocks.forEach(block => {
            this.Prism.highlightElement(block);
        });
        
        // Setup copy buttons
        this.setupCopyButtons(container);
    }
    
    setupCopyButtons(container) {
        const copyButtons = container.querySelectorAll('.copy-btn');
        copyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const copyId = button.getAttribute('data-copy-id');
                const codeElement = container.querySelector(`[data-copy-target="${copyId}"]`);
                
                if (codeElement) {
                    const code = codeElement.textContent;
                    this.copyToClipboard(code, button);
                }
            });
        });
    }
    
    async copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            
            // Visual feedback
            const originalContent = button.innerHTML;
            button.innerHTML = `
                <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            `;
            
            setTimeout(() => {
                button.innerHTML = originalContent;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
            
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }
}

// Initialize when DOM is ready
let markdownRenderer;
document.addEventListener('DOMContentLoaded', () => {
    markdownRenderer = new MarkdownRenderer();
    // Make it globally available
    window.markdownRenderer = markdownRenderer;
});

// Export for use in other modules
window.MarkdownRenderer = MarkdownRenderer;
