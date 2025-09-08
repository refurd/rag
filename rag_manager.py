#!/usr/bin/env python3
"""
RAG (Retrieval-Augmented Generation) Manager
State-of-the-art RAG rendszer LangChain + ChromaDB + Sentence Transformers használatával
"""

import os
import json
import logging
from typing import List, Tuple, Optional, Dict, Any
from pathlib import Path
import traceback

# RAG dependencies
try:
    from langchain_community.document_loaders import PyPDFLoader, TextLoader, JSONLoader
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain_community.embeddings import HuggingFaceEmbeddings
    from langchain_community.vectorstores import Chroma
    from langchain.docstore.document import Document
    from langchain.schema import Document as LangChainDocument
except ImportError as e:
    print(f"RAG dependencies not installed: {e}")
    print("Run: pip install -r requirements.txt")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGManager:
    """
    Professional RAG Manager for document processing and retrieval
    """
    
    def __init__(self, base_dir: str = None):
        """Initialize RAG Manager with directory structure"""
        if base_dir is None:
            base_dir = os.path.join(os.path.dirname(__file__), "_databricks")
        
        self.base_dir = Path(base_dir)
        self.uploads_dir = self.base_dir / "uploads"
        self.vector_db_dir = self.base_dir / "vector_db"
        self.config_dir = self.base_dir / "config"
        
        # Create directories if they don't exist
        for dir_path in [self.uploads_dir, self.vector_db_dir, self.config_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
        
        # Configuration
        self.config = {
            "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
            "chunk_size": 1000,
            "chunk_overlap": 200,
            "top_k": 5,
            "collection_name": "documents"
        }
        
        # Initialize components
        self.embeddings = None
        self.vectorstore = None
        self.text_splitter = None
        
        self._initialize_components()
    
    def _initialize_components(self):
        """Initialize RAG components"""
        try:
            # Initialize embeddings
            logger.info(f"Loading embedding model: {self.config['embedding_model']}")
            self.embeddings = HuggingFaceEmbeddings(
                model_name=self.config["embedding_model"],
                model_kwargs={'device': 'cpu'}  # Use CPU for compatibility
            )
            
            # Initialize text splitter
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.config["chunk_size"],
                chunk_overlap=self.config["chunk_overlap"],
                length_function=len,
                separators=["\n\n", "\n", " ", ""]
            )
            
            # Initialize or load vector store
            self._load_or_create_vectorstore()
            
            logger.info("RAG Manager initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize RAG components: {e}")
            logger.error(traceback.format_exc())
            raise
    
    def _load_or_create_vectorstore(self):
        """Load existing vector store or create new one"""
        try:
            if (self.vector_db_dir / "chroma.sqlite3").exists():
                logger.info("Loading existing vector store")
                self.vectorstore = Chroma(
                    persist_directory=str(self.vector_db_dir),
                    embedding_function=self.embeddings,
                    collection_name=self.config["collection_name"]
                )
            else:
                logger.info("Creating new vector store")
                self.vectorstore = Chroma(
                    persist_directory=str(self.vector_db_dir),
                    embedding_function=self.embeddings,
                    collection_name=self.config["collection_name"]
                )
        except Exception as e:
            logger.error(f"Failed to load/create vector store: {e}")
            raise
    
    def get_supported_file_types(self) -> List[str]:
        """Get list of supported file types"""
        return ['.pdf', '.txt', '.json', '.md']
    
    def process_documents(self, progress_callback=None) -> Dict[str, Any]:
        """
        Process all documents in uploads directory
        Returns processing statistics
        """
        stats = {
            "total_files": 0,
            "processed_files": 0,
            "failed_files": 0,
            "total_chunks": 0,
            "errors": []
        }
        
        try:
            # Get all files in uploads directory
            supported_extensions = self.get_supported_file_types()
            files = [
                f for f in self.uploads_dir.iterdir() 
                if f.is_file() and f.suffix.lower() in supported_extensions
            ]
            
            stats["total_files"] = len(files)
            
            if not files:
                logger.info("No supported files found in uploads directory")
                return stats
            
            documents = []
            
            for i, file_path in enumerate(files):
                try:
                    if progress_callback:
                        progress = (i / len(files)) * 100
                        progress_callback(progress, f"Processing {file_path.name}")
                    
                    logger.info(f"Processing file: {file_path.name}")
                    
                    # Load document based on file type
                    docs = self._load_document(file_path)
                    
                    if docs:
                        # Add metadata
                        for doc in docs:
                            doc.metadata.update({
                                "source": file_path.name,
                                "file_path": str(file_path),
                                "file_size": file_path.stat().st_size,
                                "file_type": file_path.suffix.lower()
                            })
                        
                        documents.extend(docs)
                        stats["processed_files"] += 1
                        logger.info(f"Successfully loaded {len(docs)} documents from {file_path.name}")
                    
                except Exception as e:
                    error_msg = f"Failed to process {file_path.name}: {str(e)}"
                    logger.error(error_msg)
                    stats["failed_files"] += 1
                    stats["errors"].append(error_msg)
            
            if documents:
                # Split documents into chunks
                if progress_callback:
                    progress_callback(80, "Splitting documents into chunks")
                
                logger.info(f"Splitting {len(documents)} documents into chunks")
                chunks = self.text_splitter.split_documents(documents)
                stats["total_chunks"] = len(chunks)
                
                # Add to vector store
                if progress_callback:
                    progress_callback(90, "Adding chunks to vector database")
                
                logger.info(f"Adding {len(chunks)} chunks to vector store")
                self.vectorstore.add_documents(chunks)
                self.vectorstore.persist()
                
                if progress_callback:
                    progress_callback(100, "Processing complete")
                
                logger.info(f"Successfully processed {stats['processed_files']} files, created {stats['total_chunks']} chunks")
            
        except Exception as e:
            error_msg = f"Document processing failed: {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            stats["errors"].append(error_msg)
        
        return stats
    
    def _load_document(self, file_path: Path) -> List[LangChainDocument]:
        """Load a single document based on file type"""
        try:
            if file_path.suffix.lower() == '.pdf':
                loader = PyPDFLoader(str(file_path))
            elif file_path.suffix.lower() == '.txt':
                loader = TextLoader(str(file_path), encoding='utf-8')
            elif file_path.suffix.lower() == '.md':
                loader = TextLoader(str(file_path), encoding='utf-8')
            elif file_path.suffix.lower() == '.json':
                # For JSON files, try to extract text content
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Convert JSON to text
                if isinstance(data, dict):
                    text_content = json.dumps(data, indent=2, ensure_ascii=False)
                elif isinstance(data, list):
                    text_content = json.dumps(data, indent=2, ensure_ascii=False)
                else:
                    text_content = str(data)
                
                # Create document manually
                return [LangChainDocument(
                    page_content=text_content,
                    metadata={"source": file_path.name}
                )]
            else:
                logger.warning(f"Unsupported file type: {file_path.suffix}")
                return []
            
            return loader.load()
            
        except Exception as e:
            logger.error(f"Failed to load document {file_path}: {e}")
            raise
    
    def search_documents(self, query: str, top_k: int = None) -> List[Dict[str, Any]]:
        """
        Search for relevant documents
        Returns list of relevant chunks with metadata
        """
        if not self.vectorstore:
            logger.warning("Vector store not initialized")
            return []
        
        if top_k is None:
            top_k = self.config["top_k"]
        
        try:
            logger.info(f"Searching for: '{query}' (top_k={top_k})")
            
            # Perform similarity search
            docs = self.vectorstore.similarity_search(query, k=top_k)
            
            # Format results
            results = []
            for i, doc in enumerate(docs):
                results.append({
                    "rank": i + 1,
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "source": doc.metadata.get("source", "Unknown"),
                    "relevance_score": 1.0 - (i / len(docs))  # Simple relevance scoring
                })
            
            logger.info(f"Found {len(results)} relevant documents")
            return results
            
        except Exception as e:
            logger.error(f"Search failed: {e}")
            logger.error(traceback.format_exc())
            return []
    
    def get_database_stats(self) -> Dict[str, Any]:
        """Get vector database statistics"""
        try:
            if not self.vectorstore:
                return {"status": "not_initialized", "count": 0}
            
            # Get collection info
            collection = self.vectorstore._collection
            count = collection.count()
            
            return {
                "status": "ready",
                "document_count": count,
                "embedding_model": self.config["embedding_model"],
                "chunk_size": self.config["chunk_size"],
                "collection_name": self.config["collection_name"]
            }
            
        except Exception as e:
            logger.error(f"Failed to get database stats: {e}")
            return {"status": "error", "error": str(e)}
    
    def clear_database(self):
        """Clear all documents from vector database"""
        try:
            if self.vectorstore:
                # Delete the collection
                self.vectorstore.delete_collection()
                
                # Recreate empty vector store
                self._load_or_create_vectorstore()
                
                logger.info("Vector database cleared successfully")
                return True
                
        except Exception as e:
            logger.error(f"Failed to clear database: {e}")
            return False
    
    def is_ready(self) -> bool:
        """Check if RAG system is ready"""
        return (
            self.embeddings is not None and 
            self.vectorstore is not None and 
            self.text_splitter is not None
        )

# Global RAG manager instance
rag_manager = None

def get_rag_manager() -> RAGManager:
    """Get global RAG manager instance"""
    global rag_manager
    if rag_manager is None:
        try:
            rag_manager = RAGManager()
        except Exception as e:
            logger.error(f"Failed to initialize RAG manager: {e}")
            return None
    return rag_manager
