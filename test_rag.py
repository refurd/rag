#!/usr/bin/env python3
"""
RAG System Test Script
Test the complete RAG workflow
"""

from rag_manager import get_rag_manager
import sys

def test_rag_system():
    print("🧠 Testing RAG System...")
    print("=" * 50)
    
    # Initialize RAG manager
    print("1. Initializing RAG manager...")
    rag = get_rag_manager()
    if not rag:
        print("❌ Failed to initialize RAG manager")
        return False
    print("✅ RAG manager initialized")
    
    # Check database stats
    print("\n2. Checking database stats...")
    stats = rag.get_database_stats()
    print(f"   Status: {stats.get('status', 'unknown')}")
    print(f"   Document count: {stats.get('document_count', 0)}")
    print(f"   Embedding model: {stats.get('embedding_model', 'unknown')}")
    
    if stats.get('document_count', 0) == 0:
        print("\n3. Processing documents...")
        process_stats = rag.process_documents()
        print(f"   Processed files: {process_stats['processed_files']}")
        print(f"   Total chunks: {process_stats['total_chunks']}")
        print(f"   Failed files: {process_stats['failed_files']}")
        if process_stats['errors']:
            print(f"   Errors: {process_stats['errors']}")
    else:
        print("✅ Documents already processed")
    
    # Test search
    print("\n4. Testing search...")
    test_queries = [
        "Aivory Artificial Intelligence Services Kft",
        "adószámla",
        "folyószámla egyenleg",
        "iparűzési adó"
    ]
    
    for query in test_queries:
        print(f"\n   Query: '{query}'")
        results = rag.search_documents(query, top_k=2)
        print(f"   Results: {len(results)} found")
        
        for i, result in enumerate(results):
            print(f"   {i+1}. Source: {result['source']}")
            print(f"      Relevance: {result['relevance_score']:.3f}")
            print(f"      Preview: {result['content'][:100]}...")
    
    print("\n" + "=" * 50)
    print("🎉 RAG system test completed!")
    return True

if __name__ == "__main__":
    success = test_rag_system()
    sys.exit(0 if success else 1)
