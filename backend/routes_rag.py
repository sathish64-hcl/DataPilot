import csv
import html
import io
import ipaddress
import json
import re
import socket
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from common import db, ai, IngestFeedRequest, IngestSourceRequest
from datetime import datetime
from urllib.parse import urljoin, urlparse, urldefrag

router = APIRouter()

INCIDENTS_TABLE_DOC_TITLE = "Incident Command Center - INCIDENTS Table Documentation"
INCIDENTS_TABLE_DOC_CONTENT = (
    "The KAGGLE.INCIDENT_MGMT.INCIDENTS table is the primary incident-management fact table for operational "
    "reliability analysis. It stores one row per incident and supports the Incident Command Center application. "
    "The table is used to answer questions about open incidents, critical incidents, SLA breaches, affected users, "
    "cost impact, root cause patterns, change-linked incidents, and application reliability trends. Important fields "
    "include INCIDENT_ID as the unique incident identifier, APP_NAME for the impacted application, SEVERITY for Critical "
    "High Medium Low priority, STATUS for Open In Progress Resolved lifecycle, CREATED_DATE for incident creation time, "
    "RESOLVED_DATE for closure time, SLA_BREACHED as the service-level breach flag, ROOT_CAUSE for the diagnosed reason, "
    "CATEGORY for Database ETL API Infrastructure or Application grouping, CHANGE_ID for release/change correlation, "
    "USERS_AFFECTED for business impact, and COST_IMPACT for estimated financial impact. Common questions include which "
    "applications violate SLA the most, which incidents are still open, which root causes repeat, what critical incidents "
    "need attention, which changes created incidents, and which applications have the highest user or cost impact. "
    "Recommended joins include APPLICATIONS on APP_ID for application ownership, EMPLOYEES on OWNER_ID for responsible "
    "teams, and CHANGE_REQUESTS on CHANGE_ID for deployment correlation."
)
INCIDENTS_TABLE_DOC_METADATA = {
    "author": "Data Pilot Studio",
    "version": "1.0",
    "updated": "2026-07-04",
    "database": "KAGGLE",
    "schema": "INCIDENT_MGMT",
    "table": "INCIDENTS",
    "tags": ["incident", "incidents", "table documentation", "incident command center", "sla", "root cause"],
}

STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "can", "for", "from", "give", "high", "i",
    "in", "is", "it", "me", "of", "on", "or", "show", "tell", "the", "to", "what", "which",
    "with", "you"
}

TOKEN_EXPANSIONS = {
    "movie": {"movie", "movies", "film", "films", "theater", "theaters", "watchlist"},
    "movies": {"movie", "movies", "film", "films", "theater", "theaters", "watchlist"},
    "film": {"movie", "movies", "film", "films"},
    "rated": {"rated", "rating", "ratings", "rate", "score", "scores", "tomatometer", "audience", "%"},
    "rate": {"rated", "rating", "ratings", "rate", "score", "scores", "tomatometer", "audience", "%"},
    "rating": {"rated", "rating", "ratings", "rate", "score", "scores", "tomatometer", "audience", "%"},
    "top": {"top", "best", "highest", "high", "100%", "99%", "98%", "97%", "96%", "95%"},
    "best": {"top", "best", "highest", "high", "100%", "99%", "98%", "97%", "96%", "95%"},
    "highest": {"top", "best", "highest", "high", "100%", "99%", "98%", "97%", "96%", "95%"},
}


def _row_value(row, name, default=""):
    return row.get(name) if name in row else row.get(name.upper(), row.get(name.lower(), default))


def _ensure_incidents_table_doc():
    docs_res = db.execute_query("SELECT title FROM rag_documents")
    if docs_res.get("success"):
        titles = {str(_row_value(row, "TITLE", "")).lower() for row in docs_res.get("data", [])}
        if INCIDENTS_TABLE_DOC_TITLE.lower() in titles:
            return
    db.add_rag_document(
        INCIDENTS_TABLE_DOC_TITLE,
        "Table Documentation",
        INCIDENTS_TABLE_DOC_CONTENT,
        INCIDENTS_TABLE_DOC_METADATA,
    )


def _query_terms(query: str):
    raw_terms = re.findall(r"[a-zA-Z0-9%']+", (query or "").lower())
    terms = set()
    for term in raw_terms:
        cleaned = term.strip("'")
        if len(cleaned) < 2 or cleaned in STOP_WORDS:
            continue
        terms.add(cleaned)
        if cleaned.endswith("s") and len(cleaned) > 3:
            terms.add(cleaned[:-1])
        terms.update(TOKEN_EXPANSIONS.get(cleaned, set()))
    return terms


def _is_incident_doc_query(query: str):
    query_lower = (query or "").lower()
    return (
        any(token in query_lower for token in ("incident", "incidents", "incident_command", "incident command"))
        and any(token in query_lower for token in ("table", "documentation", "document", "field", "fields", "schema", "explain"))
    )


def _parse_metadata(value):
    try:
        return json.loads(value or "{}")
    except Exception:
        return {}


def _score_document(doc, query: str):
    title = str(_row_value(doc, "TITLE", ""))
    source_type = str(_row_value(doc, "SOURCE_TYPE", ""))
    content = str(_row_value(doc, "CONTENT", ""))
    metadata = _parse_metadata(_row_value(doc, "METADATA", "{}"))
    haystack = f"{title} {source_type} {content} {json.dumps(metadata, default=str)}".lower()
    title_text = title.lower()
    terms = _query_terms(query)
    if not terms:
        return 0

    score = 0
    for term in terms:
        if term in haystack:
            score += 1 + min(haystack.count(term), 6)
        if term in title_text:
            score += 4

    query_lower = (query or "").lower()
    wants_incident_docs = _is_incident_doc_query(query)
    if wants_incident_docs:
        if any(token in haystack for token in ("incidents", "incident_id", "sla_breached", "root_cause", "cost_impact", "incident command center")):
            score += 35
        if source_type.lower() in ("table documentation", "data dictionary", "runbook"):
            score += 18
        if metadata.get("table", "").upper() == "INCIDENTS":
            score += 25
        if any(token in haystack for token in ("nbcnews", "headline", "world news", "politics", "sports", "culture")):
            score -= 20

    if any(token in query_lower for token in ("movie", "film", "rate", "rated", "rating", "tomato")):
        if any(token in haystack for token in ("rotten", "tomatoes", "watchlist", "tomatometer", "movie", "film")):
            score += 8
        if any(token in haystack for token in ("snowflake", "warehouse", "customer", "pipeline", "governance")):
            score -= 8

    if source_type.lower() in ("web page", "batch web page", "uploaded html", "pasted text"):
        score += 2

    return score


def _plain_text_from_html(value: str) -> str:
    value = re.sub(r"(?is)<(script|style).*?>.*?</\1>", " ", value)
    value = re.sub(r"(?s)<[^>]+>", " ", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def _chunk_text(text: str, chunk_size: int = 1400):
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text or "") if p.strip()]
    if not paragraphs and text.strip():
        paragraphs = [text.strip()]

    chunks = []
    current_chunk = ""
    for paragraph in paragraphs:
        if len(paragraph) > chunk_size:
            if current_chunk:
                chunks.append(current_chunk)
                current_chunk = ""
            for idx in range(0, len(paragraph), chunk_size):
                chunks.append(paragraph[idx:idx + chunk_size])
            continue

        if len(current_chunk) + len(paragraph) + 2 <= chunk_size:
            current_chunk = f"{current_chunk}\n\n{paragraph}" if current_chunk else paragraph
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = paragraph

    if current_chunk:
        chunks.append(current_chunk)
    return chunks


def _detect_format(filename: str = "", requested_format: str = "auto"):
    selected = (requested_format or "auto").lower()
    if selected != "auto":
        return selected
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext in ("xlsx", "xls"):
        return "excel"
    if ext in ("csv", "tsv"):
        return "csv"
    if ext == "json":
        return "json"
    if ext in ("html", "htm"):
        return "html"
    if ext in ("txt", "md", "log", "sql", "yaml", "yml", "xml"):
        return "text"
    return "raw"


def _extract_text_from_bytes(filename: str, content: bytes, requested_format: str = "auto"):
    fmt = _detect_format(filename, requested_format)
    decoded = content.decode("utf-8", errors="ignore")

    if fmt == "json":
        parsed = json.loads(decoded)
        return json.dumps(parsed, indent=2, default=str), "JSON"

    if fmt == "csv":
        delimiter = "\t" if filename.lower().endswith(".tsv") else ","
        rows = list(csv.reader(io.StringIO(decoded), delimiter=delimiter))
        preview = [" | ".join(row) for row in rows[:500]]
        return "\n".join(preview), "CSV"

    if fmt == "excel":
        try:
            import pandas as pd
            sheets = pd.read_excel(io.BytesIO(content), sheet_name=None)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Excel parsing failed. Install openpyxl if needed. Details: {exc}")
        sheet_text = []
        for sheet_name, frame in sheets.items():
            sheet_text.append(f"Sheet: {sheet_name}\n{frame.head(500).to_csv(index=False)}")
        return "\n\n".join(sheet_text), "Excel"

    if fmt == "html":
        return _plain_text_from_html(decoded), "HTML"

    return decoded, fmt.upper() if fmt else "File"


def _clamp_int(value, minimum: int, maximum: int, default: int):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = default
    return max(minimum, min(maximum, parsed))


def _validate_public_url(url: str):
    parsed = urlparse(url or "")
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise HTTPException(status_code=400, detail="Only public http/https URLs can be ingested.")
    host = parsed.hostname.lower()
    if host in ("localhost",) or host.endswith(".local"):
        raise HTTPException(status_code=400, detail="Local/private hosts cannot be ingested.")

    addresses = []
    try:
        addresses.append(ipaddress.ip_address(host))
    except ValueError:
        try:
            addresses.extend({ipaddress.ip_address(item[4][0]) for item in socket.getaddrinfo(host, None)})
        except socket.gaierror:
            return

    for address in addresses:
        if (
            address.is_private
            or address.is_loopback
            or address.is_link_local
            or address.is_multicast
            or address.is_reserved
            or address.is_unspecified
        ):
            raise HTTPException(status_code=400, detail="Local/private network URLs cannot be ingested.")


async def _fetch_web_page(url: str):
    _validate_public_url(url)
    try:
        import httpx
        async with httpx.AsyncClient(follow_redirects=True, timeout=20) as client:
            response = await client.get(url, headers={"User-Agent": "DataPilot Document Hub"})
            response.raise_for_status()
            raw = response.text
            final_url = str(response.url)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to read web page: {exc}")

    title_match = re.search(r"(?is)<title[^>]*>(.*?)</title>", raw)
    title = _plain_text_from_html(title_match.group(1)) if title_match else final_url
    return {"url": final_url, "title": title, "html": raw, "text": _plain_text_from_html(raw)}


def _extract_child_links(base_url: str, raw_html: str, root_host: str):
    links = []
    for href in re.findall(r"(?is)<a\s+[^>]*href=[\"']([^\"'#]+)[\"']", raw_html or ""):
        href = href.strip()
        if not href or href.startswith(("mailto:", "tel:", "javascript:")):
            continue
        absolute = urldefrag(urljoin(base_url, href))[0]
        parsed = urlparse(absolute)
        if parsed.scheme not in ("http", "https") or parsed.netloc.lower() != root_host:
            continue
        if re.search(r"\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|mp4|mov|avi|css|js)$", parsed.path, re.I):
            continue
        links.append(absolute)
    return list(dict.fromkeys(links))


async def _crawl_web_pages(start_url: str, crawl_depth: int = 0, max_pages: int = 10):
    depth = _clamp_int(crawl_depth, 0, 2, 0)
    page_limit = _clamp_int(max_pages, 1, 25, 10)
    root_host = urlparse(start_url).netloc.lower()
    queue = [(urldefrag(start_url)[0], 0)]
    seen = set()
    pages = []
    failures = []

    while queue and len(pages) < page_limit:
        url, current_depth = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)

        try:
            page = await _fetch_web_page(url)
            page["depth"] = current_depth
            pages.append(page)
        except HTTPException as exc:
            failures.append({"url": url, "error": str(exc.detail)})
            continue

        if current_depth >= depth:
            continue

        for child_url in _extract_child_links(page["url"], page["html"], root_host):
            if child_url not in seen and len(queue) + len(pages) < page_limit:
                queue.append((child_url, current_depth + 1))

    if not pages:
        detail = failures[0]["error"] if failures else "No readable pages were found."
        raise HTTPException(status_code=400, detail=detail)

    return pages, failures


async def _extract_text_from_url(url: str):
    page = await _fetch_web_page(url)
    return page["title"], page["text"]


async def _index_crawled_site(url: str, source_label: str, title_override: str = "", crawl_depth: int = 0, max_pages: int = 10, batch: bool = False):
    pages, failures = await _crawl_web_pages(url, crawl_depth, max_pages)
    total_chunks = 0
    indexed_titles = []

    for idx, page in enumerate(pages):
        title = title_override if title_override and idx == 0 else page["title"]
        chunks = _index_chunks(
            title,
            source_label,
            page["text"],
            {
                "url": page["url"],
                "format": "web",
                "crawl_depth": crawl_depth,
                "page_depth": page["depth"],
                "batch": batch,
            }
        )
        total_chunks += chunks
        indexed_titles.append(title)

    return {
        "chunks": total_chunks,
        "pages": len(pages),
        "titles": indexed_titles,
        "failures": failures,
    }


def _index_chunks(title: str, source_type: str, text: str, metadata: dict):
    chunks = _chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=400, detail="No readable text was found to index.")

    success_count = 0
    for i, chunk in enumerate(chunks):
        chunk_title = f"{title} (Chunk {i + 1}/{len(chunks)})" if len(chunks) > 1 else title
        chunk_meta = {
            **metadata,
            "chunk_index": i,
            "total_chunks": len(chunks),
            "ingested_at": str(datetime.now())
        }
        if db.add_rag_document(title=chunk_title, source_type=source_type, content=chunk, metadata=chunk_meta):
            success_count += 1
    return success_count

@router.get("/api/rag/search")
async def search_rag(query: str = ""):
    _ensure_incidents_table_doc()
    docs_res = db.execute_query("SELECT rowid, title, source_type, content, metadata FROM rag_documents")
    if not docs_res.get("success"):
         raise HTTPException(status_code=500, detail="Failed to load knowledge database.")
         
    docs = docs_res.get("data", [])

    scored_chunks = []
    for doc in docs:
        score = _score_document(doc, query)
        if score > 0:
            doc["parsed_metadata"] = _parse_metadata(_row_value(doc, "METADATA", "{}"))
            doc["RELEVANCE_SCORE"] = score
            scored_chunks.append(doc)

    matched_chunks = sorted(
        scored_chunks,
        key=lambda item: (item.get("RELEVANCE_SCORE", 0), _row_value(item, "ROWID", _row_value(item, "rowid", 0))),
        reverse=True
    )[:10]
    if _is_incident_doc_query(query):
        incident_chunks = [
            chunk for chunk in matched_chunks
            if any(
                token in f"{_row_value(chunk, 'TITLE', '')} {_row_value(chunk, 'CONTENT', '')} {_row_value(chunk, 'METADATA', '')}".lower()
                for token in ("incident_id", "sla_breached", "root_cause", "cost_impact", "incident command center", "kaggle.incident_mgmt.incidents")
            )
        ]
        if incident_chunks:
            matched_chunks = incident_chunks[:10]

    if not matched_chunks:
        return {
            "answer": "I could not find relevant indexed content for that question. The page may not have been learned correctly, or the question may need a source-specific keyword such as a movie title, page name, or rating term.",
            "citations": [],
            "source_chunks": [],
            "retrieval_status": "no_match",
            "ai_metadata": {}
        }
        
    answer_res = ai.answer_rag(query, matched_chunks)
    
    return {
        "answer": answer_res.get("answer", ""),
        "citations": answer_res.get("citations", []),
        "source_chunks": matched_chunks,
        "retrieval_status": "matched",
        "ai_metadata": answer_res.get("ai_metadata", {})
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


@router.post("/api/rag/ingest/source")
async def ingest_source(req: IngestSourceRequest):
    source_type = (req.source_type or "").lower()
    requested_format = req.format or "auto"

    if source_type == "web":
        if not req.url:
            raise HTTPException(status_code=400, detail="URL is required.")
        crawl_result = await _index_crawled_site(
            req.url,
            "Web Page" if not req.crawl_depth else "Crawled Web Page",
            req.title or "",
            req.crawl_depth or 0,
            req.max_pages or 10
        )
        return {
            "success": True,
            "message": f"Indexed {crawl_result['pages']} web pages into {crawl_result['chunks']} searchable chunks.",
            "chunks_count": crawl_result["chunks"],
            "pages_count": crawl_result["pages"],
            "titles": crawl_result["titles"],
            "failures": crawl_result["failures"]
        }
    elif source_type == "text":
        if not req.content:
            raise HTTPException(status_code=400, detail="Text content is required.")
        doc_title = req.title or "Pasted Document"
        text = req.content
        source_label = "Pasted Text"
        metadata = {"format": requested_format}
    else:
        raise HTTPException(status_code=400, detail="source_type must be 'web' or 'text'.")

    success_count = _index_chunks(doc_title, source_label, text, metadata)
    return {
        "success": True,
        "message": f"Indexed {doc_title} into {success_count} searchable chunks.",
        "chunks_count": success_count
    }


@router.post("/api/rag/ingest/file")
async def ingest_file(file: UploadFile = File(...), file_format: str = Form("auto")):
    try:
        content = await file.read()
        text_content, detected_format = _extract_text_from_bytes(file.filename, content, file_format)
        success_count = _index_chunks(
            file.filename,
            f"Uploaded {detected_format}",
            text_content,
            {"filename": file.filename, "format": detected_format}
        )
                
        return {
            "success": True,
            "message": f"Successfully uploaded and indexed '{file.filename}' into {success_count} search chunks.",
            "chunks_count": success_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest file: {str(e)}")


@router.post("/api/rag/ingest/batch")
async def ingest_batch(
    urls: str = Form(""),
    file_format: str = Form("auto"),
    crawl_depth: int = Form(0),
    max_pages: int = Form(10),
    files: list[UploadFile] = File(default=[])
):
    url_list = [item.strip() for item in re.split(r"[\n,]+", urls or "") if item.strip()]
    if not url_list and not files:
        raise HTTPException(status_code=400, detail="Add at least one URL or one file.")

    results = []
    total_chunks = 0
    total_pages = 0
    page_cap = _clamp_int(max_pages, 1, 25, 10)

    for url in url_list:
        remaining_pages = page_cap - total_pages
        if remaining_pages <= 0:
            results.append({"source": url, "type": "web", "success": False, "error": f"Skipped because the batch page cap of {page_cap} was reached."})
            continue
        try:
            crawl_result = await _index_crawled_site(
                url,
                "Batch Web Page" if not crawl_depth else "Batch Crawled Web Page",
                "",
                crawl_depth,
                remaining_pages,
                batch=True
            )
            total_chunks += crawl_result["chunks"]
            total_pages += crawl_result["pages"]
            results.append({
                "source": url,
                "type": "web",
                "success": True,
                "chunks": crawl_result["chunks"],
                "pages": crawl_result["pages"],
                "title": crawl_result["titles"][0] if crawl_result["titles"] else url,
                "failures": crawl_result["failures"]
            })
        except Exception as exc:
            detail = getattr(exc, "detail", str(exc))
            results.append({"source": url, "type": "web", "success": False, "error": str(detail)})

    for file in files:
        try:
            content = await file.read()
            text_content, detected_format = _extract_text_from_bytes(file.filename, content, file_format)
            chunks = _index_chunks(
                file.filename,
                f"Batch Uploaded {detected_format}",
                text_content,
                {"filename": file.filename, "format": detected_format, "batch": True}
            )
            total_chunks += chunks
            results.append({"source": file.filename, "type": "file", "success": True, "chunks": chunks, "format": detected_format})
        except Exception as exc:
            detail = getattr(exc, "detail", str(exc))
            results.append({"source": file.filename, "type": "file", "success": False, "error": str(detail)})

    success_count = len([row for row in results if row["success"]])
    failure_count = len(results) - success_count
    return {
        "success": success_count > 0,
        "message": f"Batch indexed {success_count} sources into {total_chunks} chunks. {failure_count} failed.",
        "source_count": len(results),
        "success_count": success_count,
        "failure_count": failure_count,
        "chunks_count": total_chunks,
        "pages_count": total_pages,
        "max_pages": page_cap,
        "results": results
    }

@router.get("/api/rag/documents")
async def get_rag_documents():
    _ensure_incidents_table_doc()
    return {"documents": db.get_rag_documents_list()}

@router.post("/api/rag/documents/clear")
async def clear_rag_documents_endpoint():
    success = db.clear_rag_documents()
    if success:
        return {"success": True, "message": "RAG Knowledge Base reset to default schemas and runbooks."}
    else:
        raise HTTPException(status_code=500, detail="Failed to clear RAG database.")
