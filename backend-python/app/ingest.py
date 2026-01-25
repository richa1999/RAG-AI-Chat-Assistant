import os
import pickle
import faiss
import numpy as np
from pypdf import PdfReader

# Disable all parallelism to avoid segmentation faults on macOS
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

from sentence_transformers import SentenceTransformer

# Use absolute path to avoid directory issues
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
DATA_PATH = os.path.join(BACKEND_DIR, "data", "docs")
STORE_PATH = os.path.join(SCRIPT_DIR, "vector_store")

print(f"Loading model...")
model = SentenceTransformer("all-mpnet-base-v2", device="cpu")
texts = []

print(f"Reading documents from: {DATA_PATH}")
for file in os.listdir(DATA_PATH):
    file_path = os.path.join(DATA_PATH, file)
    
    # Skip README and hidden files
    if file.startswith('.') or file == 'README.md':
        continue
        
    print(f"Processing: {file}")
    if file.endswith(".pdf"):
        reader = PdfReader(file_path)
        for page in reader.pages:
            text = page.extract_text()
            if text and text.strip():
                texts.append(text.strip())
    elif file.endswith(".md") or file.endswith(".txt"):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            if content and content.strip():
                texts.append(content.strip())

print(f"Found {len(texts)} text chunks")

if not texts:
    print("❌ No documents found to index!")
    exit(1)

print("Generating embeddings...")
# Disable multiprocessing and batch processing to avoid segmentation faults
embeddings = model.encode(
    texts, 
    show_progress_bar=True,
    batch_size=1,
    convert_to_numpy=True,
    normalize_embeddings=False
)

# Ensure embeddings is a 2D array
if len(embeddings.shape) == 1:
    embeddings = embeddings.reshape(1, -1)

dimension = embeddings.shape[1]
print(f"Embedding dimension: {dimension}")

print("Building FAISS index...")
index = faiss.IndexFlatL2(dimension)
index.add(np.array(embeddings).astype('float32'))

os.makedirs(STORE_PATH, exist_ok=True)
faiss.write_index(index, os.path.join(STORE_PATH, "index.faiss"))

with open(os.path.join(STORE_PATH, "texts.pkl"), "wb") as f:
    pickle.dump(texts, f)

print(f"✅ Successfully indexed {len(texts)} documents!")
print(f"Vector store saved to: {STORE_PATH}")
