import faiss
import pickle
import numpy as np
import os

# Disable ALL multiprocessing BEFORE importing anything else
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

from sentence_transformers import SentenceTransformer
# Removed gpt4all import - not using LLM in Docker deployment

# Use absolute paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
VECTOR_STORE_PATH = os.path.join(SCRIPT_DIR, "vector_store")

print("Loading sentence transformer model...")
model = SentenceTransformer("all-mpnet-base-v2", device="cpu")
# Force single-threaded encoding
model.encode("test", batch_size=1, show_progress_bar=False)
print("Model loaded successfully!")

index = faiss.read_index(os.path.join(VECTOR_STORE_PATH, "index.faiss"))
with open(os.path.join(VECTOR_STORE_PATH, "texts.pkl"), "rb") as f:
    texts = pickle.load(f)

def answer_question(question: str) -> dict:
    try:
        print(f"Received question: {question}")
        
        print("Encoding question...")
        # Force single-threaded, single-batch encoding
        query_embedding = model.encode(
            [question], 
            batch_size=1, 
            show_progress_bar=False,
            convert_to_numpy=True
        )
        print(f"Embedding shape: {query_embedding.shape}")
        
        print("Searching index...")
        distances, indices = index.search(np.array(query_embedding).astype('float32'), k=3)
        print(f"Found indices: {indices}")

        # Get context and prepare citations
        context_parts = []
        citations = []
        
        for idx, (doc_idx, distance) in enumerate(zip(indices[0], distances[0])):
            text = texts[doc_idx]
            context_parts.append(text)
            
            # Extract document title from the text (first line usually)
            doc_title = text.split('\n')[0].strip('#').strip()
            if len(doc_title) > 100:
                doc_title = doc_title[:100] + "..."
            
            citations.append({
                "index": idx + 1,
                "title": doc_title,
                "relevance": float(1 / (1 + distance)),  # Convert distance to similarity score
                "preview": text[:200] + "..." if len(text) > 200 else text
            })
        
        context = "\n\n".join(context_parts)
        print(f"Context length: {len(context)}")

        answer_text = f"**Based on the documentation:**\n\n{context}\n\n---\n\n*Relevant sections found for: {question}*"
        
        return {
            "answer": answer_text,
            "citations": citations
        }
    except Exception as e:
        print(f"Error in answer_question: {e}")
        import traceback
        traceback.print_exc()
        return {
            "answer": f"Error processing question: {str(e)}",
            "citations": []
        }

