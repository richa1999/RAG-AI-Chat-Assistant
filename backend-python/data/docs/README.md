# Sample Documents for RAG System

This directory contains sample documents for testing the RAG (Retrieval-Augmented Generation) chatbot.

## Available Documents

1. **sample_product_guide.md** - SmartHome Hub user guide covering setup, features, and troubleshooting
2. **sample_company_policies.md** - TechCorp employee handbook with policies on work hours, benefits, and conduct
3. **sample_technical_docs.md** - CloudStore API documentation with endpoints, authentication, and examples

## Usage

### Using Markdown Files (Current Setup)

The ingest script now supports markdown (.md) and text (.txt) files directly. Simply run:

```bash
/Users/richasr/Desktop/Personal/RAG-AI-Chat-Assistant/.venv/bin/python ingest.py
```

### Converting to PDF (Optional)

If you prefer to use PDFs, you can convert the markdown files using various tools:

**Option 1: Using Pandoc**
```bash
pandoc sample_product_guide.md -o sample_product_guide.pdf
```

**Option 2: Using Python (markdown2pdf)**
```bash
pip install markdown-pdf
markdown-pdf sample_product_guide.md
```

**Option 3: Online Converter**
- Visit https://www.markdowntopdf.com
- Upload markdown file
- Download PDF

## Testing Your RAG System

After ingestion, you can test with questions like:

**For Product Guide:**
- "How do I connect devices to the SmartHome Hub?"
- "What should I do if my hub won't connect to WiFi?"
- "How do I create automation rules?"

**For Company Policies:**
- "How many vacation days do employees get?"
- "What is the remote work policy?"
- "When are the company holidays?"

**For Technical Docs:**
- "How do I upload a file using the CloudStore API?"
- "What are the rate limits for the API?"
- "How do I authenticate API requests?"

## Adding Your Own Documents

1. Place your documents in this directory
2. Supported formats: PDF, MD, TXT
3. Run the ingest script to index them
4. The vector store will be updated with your content
