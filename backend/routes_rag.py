from fastapi import APIRouter, HTTPException, UploadFile, File
from common import db, ai, IngestFeedRequest
from datetime import datetime

router = APIRouter()

@router.get("/api/rag/search")
async def search_rag(query: str = ""):
    docs_res = db.execute_query("SELECT title, source_type, content, metadata FROM rag_documents")
    if not docs_res.get("success"):
         raise HTTPException(status_code=500, detail="Failed to load knowledge database.")
         
    docs = docs_res.get("data", [])
    
    # Match query keywords locally to RAG chunks
    matched_chunks = []
    q = query.lower()
    for doc in docs:
        if any(kw in doc["CONTENT"].lower() or kw in doc["TITLE"].lower() for kw in q.split()):
            # Parse json metadata safely
            meta = {}
            try:
                import json
                meta = json.loads(doc["METADATA"])
            except:
                pass
            doc["parsed_metadata"] = meta
            matched_chunks.append(doc)
            
    # Default to all if no match found
    if not matched_chunks:
        matched_chunks = docs
        
    answer_res = ai.answer_rag(query, matched_chunks)
    
    return {
        "answer": answer_res.get("answer", ""),
        "citations": answer_res.get("citations", []),
        "source_chunks": matched_chunks
    }

def parse_rss_feed(url: str):
    """Parse an RSS/Atom feed URL and return a list of article entries."""
    try:
        import feedparser
        d = feedparser.parse(url)
        entries = []
        for entry in d.entries[:15]:
            title = entry.get("title", "No Title")
            link = entry.get("link", "")
            summary = entry.get("summary", "") or entry.get("description", "")
            date = entry.get("published", "") or entry.get("updated", "")
            entries.append({
                "title": title,
                "content": summary,
                "link": link,
                "date": date
            })
        return entries
    except Exception as e:
        print(f"feedparser failed or not installed ({e}). Falling back to xml.etree.ElementTree parser.")
        
    try:
        import urllib.request
        import xml.etree.ElementTree as ET
        
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        entries = []
        
        for item in root.findall(".//item")[:15]:
            title = item.findtext("title", "No Title")
            link = item.findtext("link", "")
            description = item.findtext("description", "")
            date = item.findtext("pubDate", "")
            entries.append({
                "title": title,
                "content": description,
                "link": link,
                "date": date
            })
            
        if not entries:
            namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
            for entry in (root.findall(".//atom:entry", namespaces) or root.findall(".//entry"))[:15]:
                title = entry.findtext("atom:title", namespaces) or entry.findtext("title", "")
                link_elem = entry.find("atom:link", namespaces) or entry.find("link")
                link = link_elem.get("href") if link_elem is not None else ""
                summary = entry.findtext("atom:summary", namespaces) or entry.findtext("summary", "") or entry.findtext("atom:content", namespaces) or entry.findtext("content", "")
                date = entry.findtext("atom:updated", namespaces) or entry.findtext("updated", "")
                entries.append({
                    "title": title,
                    "content": summary,
                    "link": link,
                    "date": date
                })
        return entries
    except Exception as ex:
        print(f"Fallback RSS parser failed: {ex}")
        raise ValueError(f"Failed to parse RSS feed: {str(ex)}")

@router.post("/api/rag/ingest/feed")
async def ingest_feed(req: IngestFeedRequest):
    if not req.url:
        raise HTTPException(status_code=400, detail="URL is required.")
    
    try:
        articles = parse_rss_feed(req.url)
        if not articles:
            raise HTTPException(status_code=400, detail="No feed entries found at the provided URL.")
        
        success_count = 0
        ingested_titles = []
        for article in articles:
            meta = {
                "url": article["link"],
                "published_date": article["date"],
                "ingested_at": str(datetime.now())
            }
            content = article["content"]
            import re
            content = re.sub('<[^<]+?>', '', content)
            
            success = db.add_rag_document(
                title=article["title"],
                source_type=req.source_name or "Website",
                content=content,
                metadata=meta
            )
            if success:
                success_count += 1
                ingested_titles.append(article["title"])
                
        return {
            "success": True,
            "message": f"Successfully ingested {success_count} articles from feed.",
            "ingested_count": success_count,
            "titles": ingested_titles
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest RSS feed: {str(e)}")

@router.post("/api/rag/ingest/file")
async def ingest_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text_content = content.decode("utf-8", errors="ignore")
        
        paragraphs = [p.strip() for p in text_content.split("\n\n") if p.strip()]
        
        chunks = []
        current_chunk = ""
        for p in paragraphs:
            if len(current_chunk) + len(p) < 1000:
                current_chunk += "\n\n" + p if current_chunk else p
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = p
        if current_chunk:
            chunks.append(current_chunk)
            
        if not chunks:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
            
        success_count = 0
        for i, chunk in enumerate(chunks):
            title = f"{file.filename} (Chunk {i+1}/{len(chunks)})" if len(chunks) > 1 else file.filename
            meta = {
                "filename": file.filename,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "ingested_at": str(datetime.now())
            }
            success = db.add_rag_document(
                title=title,
                source_type="Uploaded File",
                content=chunk,
                metadata=meta
            )
            if success:
                success_count += 1
                
        return {
            "success": True,
            "message": f"Successfully uploaded and indexed '{file.filename}' into {success_count} search chunks.",
            "chunks_count": success_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest file: {str(e)}")

@router.get("/api/rag/documents")
async def get_rag_documents():
    return {"documents": db.get_rag_documents_list()}

@router.post("/api/rag/documents/clear")
async def clear_rag_documents_endpoint():
    success = db.clear_rag_documents()
    if success:
        return {"success": True, "message": "RAG Knowledge Base reset to default schemas and runbooks."}
    else:
        raise HTTPException(status_code=500, detail="Failed to clear RAG database.")
