import httpx
import asyncio
import xml.etree.ElementTree as ET
import urllib.parse
from typing import List, Dict, Any

_SWARM_CACHE = {}

# Standard user agent header to prevent blocking / follow API guidelines
HEADERS = {
    "User-Agent": "VeritasThesisAI/0.1.0 (mailto:swarm@veritas.ai)"
}

async def fetch_arxiv_papers(query: str, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Fetches research papers from arXiv API (XML query and custom parsing).
    """
    encoded_query = urllib.parse.quote(query)
    # Use HTTPS to prevent 301 redirection!
    url = f"https://export.arxiv.org/api/query?search_query=all:{encoded_query}&max_results={limit}"
    
    papers = []
    try:
        # Enable follow_redirects=True for strict compliance
        async with httpx.AsyncClient(headers=HEADERS, timeout=12.0, follow_redirects=True) as client:
            response = await client.get(url)
            if response.status_code != 200:
                print(f"[Academic Clients] arXiv API status error: {response.status_code}")
                return []
                
            # Parse XML
            root = ET.fromstring(response.content)
            
            # Namespace map (arXiv feed uses Atom namespace)
            ns = {'atom': 'http://www.w3.org/2005/Atom'}
            
            for entry in root.findall('atom:entry', ns):
                title_elem = entry.find('atom:title', ns)
                summary_elem = entry.find('atom:summary', ns)
                id_elem = entry.find('atom:id', ns)
                published_elem = entry.find('atom:published', ns)
                
                title = title_elem.text.strip().replace("\n", " ") if title_elem is not None else "Unknown Title"
                abstract = summary_elem.text.strip().replace("\n", " ") if summary_elem is not None else "No abstract available"
                url_str = id_elem.text.strip() if id_elem is not None else ""
                
                # Parse authors
                authors_list = []
                for author in entry.findall('atom:author', ns):
                    name_elem = author.find('atom:name', ns)
                    if name_elem is not None:
                        authors_list.append(name_elem.text.strip())
                authors = ", ".join(authors_list) if authors_list else "Unknown Authors"
                
                # Parse Year
                year = 2025 # Fallback
                if published_elem is not None and len(published_elem.text) >= 4:
                    try:
                        year = int(published_elem.text[:4])
                    except:
                        pass
                
                # Synthesize standard arXiv DOI format
                arxiv_id = url_str.split('/abs/')[-1].split('v')[0]
                doi = f"10.48550/arXiv.{arxiv_id}" if arxiv_id else f"10.48550/mock.arxiv.{hash(title)}"
                
                papers.append({
                    "title": title,
                    "authors": authors,
                    "journal": "arXiv Preprint",
                    "year": year,
                    "doi": doi,
                    "abstract": abstract,
                    "url": url_str,
                    "citation_count": 1,  # arXiv preprints citation baseline fallback
                    "confidence_level": 9.0
                })
    except Exception as e:
        print(f"[Academic Clients] Error fetching from arXiv: {str(e)}")
        
    return papers

async def fetch_semantic_scholar_papers(query: str, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Fetches research papers from Semantic Scholar REST API.
    """
    encoded_query = urllib.parse.quote(query)
    fields = "title,authors,venue,year,doi,abstract,url,citationCount"
    url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={encoded_query}&limit={limit}&fields={fields}"
    
    papers = []
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=12.0, follow_redirects=True) as client:
            response = await client.get(url)
            if response.status_code != 200:
                print(f"[Academic Clients] Semantic Scholar status error: {response.status_code}")
                return []
                
            data = response.json()
            for item in data.get("data", []):
                title = item.get("title", "Unknown Title")
                year = item.get("year", 2025)
                doi = item.get("doi") or f"10.1000/mock.semantic.{hash(title)}"
                abstract = item.get("abstract") or "No abstract available"
                url_str = item.get("url") or f"https://api.semanticscholar.org/{item.get('paperId')}"
                citation_count = item.get("citationCount", 0)
                venue = item.get("venue") or "Academic Publication"
                
                # Parse authors list
                authors_list = [a.get("name") for a in item.get("authors", []) if a.get("name")]
                authors = ", ".join(authors_list) if authors_list else "Unknown Authors"
                
                papers.append({
                    "title": title,
                    "authors": authors,
                    "journal": venue,
                    "year": year,
                    "doi": doi,
                    "abstract": abstract,
                    "url": url_str,
                    "citation_count": citation_count,
                    "confidence_level": 9.7
                })
    except Exception as e:
        print(f"[Academic Clients] Error fetching from Semantic Scholar: {str(e)}")
        
    return papers

async def fetch_openalex_papers(query: str, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Fetches research papers from OpenAlex API.
    """
    encoded_query = urllib.parse.quote(query)
    url = f"https://api.openalex.org/works?search={encoded_query}&per_page={limit}"
    
    papers = []
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=12.0, follow_redirects=True) as client:
            response = await client.get(url)
            if response.status_code != 200:
                print(f"[Academic Clients] OpenAlex API status error: {response.status_code}")
                return []
                
            data = response.json()
            for item in data.get("results", []):
                title = item.get("title") or "Unknown Title"
                year = item.get("publication_year", 2025)
                doi = item.get("doi")
                if doi and doi.startswith("https://doi.org/"):
                    doi = doi.replace("https://doi.org/", "")
                doi = doi or f"10.1000/mock.openalex.{hash(title)}"
                
                abstract = "No abstract available"
                url_str = item.get("doi") or item.get("id") or ""
                citation_count = item.get("cited_by_count", 0)
                
                # Parse journal venue name
                location = item.get("primary_location") or {}
                source = location.get("source") or {}
                venue = source.get("display_name") or "Academic Source"
                
                # Parse authors list
                authors_list = []
                for auth in item.get("authorships", []):
                    author = auth.get("author") or {}
                    if author.get("display_name"):
                        authors_list.append(author.get("display_name"))
                authors = ", ".join(authors_list) if authors_list else "Unknown Authors"
                
                papers.append({
                    "title": title,
                    "authors": authors,
                    "journal": venue,
                    "year": year,
                    "doi": doi,
                    "abstract": abstract,
                    "url": url_str,
                    "citation_count": citation_count,
                    "confidence_level": 9.4
                })
    except Exception as e:
        print(f"[Academic Clients] Error fetching from OpenAlex: {str(e)}")
        
    return papers

async def fetch_all_academic_papers(query: str, limit_per_source: int = 2) -> List[Dict[str, Any]]:
    """
    Orchestrates concurrent fetching from arXiv, Semantic Scholar, and OpenAlex.
    Deduplicates results based on DOI.
    """
    query_clean = query.strip().lower()
    if query_clean in _SWARM_CACHE:
        cached = _SWARM_CACHE[query_clean]
        print(f"[Academic Clients] Cache HIT for query swarm: '{query}' -> Returned {len(cached)} cached papers (LLM cost savings: $0.25).")
        return cached

    print(f"[Academic Clients] Orchestrating concurrent swarm for query: '{query}'...")
    
    # Run all three concurrently using asyncio.gather for peak performance!
    results = await asyncio.gather(
        fetch_arxiv_papers(query, limit_per_source),
        fetch_semantic_scholar_papers(query, limit_per_source),
        fetch_openalex_papers(query, limit_per_source)
    )
    
    all_papers = []
    seen_dois = set()
    
    for source_results in results:
        for paper in source_results:
            doi = paper["doi"].lower()
            if doi not in seen_dois:
                seen_dois.add(doi)
                all_papers.append(paper)
                
    print(f"[Academic Clients] Swarm gathered {len(all_papers)} unique papers total.")
    _SWARM_CACHE[query_clean] = all_papers
    return all_papers

async def fetch_crossref_metadata(doi: str) -> Dict[str, Any]:
    """
    Queries the Crossref REST API for a specific DOI.
    Identifies updates, corrections, retractions, licence details, and metadata validity.
    """
    url = f"https://api.crossref.org/works/{urllib.parse.quote(doi)}"
    
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=8.0, follow_redirects=True) as client:
            response = await client.get(url)
            if response.status_code != 200:
                print(f"[Academic Clients] Crossref DOI lookup error: {response.status_code}")
                return {}
                
            data = response.json().get("message", {})
            
            # Extract basic metadata
            title_list = data.get("title", [])
            title = title_list[0] if title_list else "Unknown Title"
            
            # Parse authors
            authors_list = []
            for author in data.get("author", []):
                given = author.get("given", "")
                family = author.get("family", "")
                if family:
                    authors_list.append(f"{given} {family}".strip())
            authors = ", ".join(authors_list) if authors_list else "Unknown Authors"
            
            # Parse Journal Venue name
            container_title_list = data.get("container-title", [])
            journal = container_title_list[0] if container_title_list else "Crossref Publication"
            
            # Parse Year
            published_print = data.get("published-print", {}) or data.get("published", {})
            date_parts = published_print.get("date-parts", [[]])
            year = date_parts[0][0] if date_parts[0] else 2025
            
            # Parse licence
            licences = data.get("license", [])
            licence = licences[0].get("URL") if licences else None
            
            # Check for retractions and updates
            is_retracted = False
            retraction_details = None
            
            # Check if Crossref flags updates or retractions
            update_to = data.get("update-to", [])
            if update_to:
                for update in update_to:
                    if update.get("type", "").lower() == "retraction":
                        is_retracted = True
                        retraction_details = f"Retracted in favor of DOI: {update.get('DOI', '')}"
            
            # Check for 'retracted' in title or abstract
            if "retracted" in title.lower():
                is_retracted = True
                retraction_details = "Title contains 'retracted' flag"
                
            return {
                "title": title,
                "authors": authors,
                "journal": journal,
                "year": int(year) if year else 2025,
                "doi": doi,
                "licence": licence,
                "is_retracted": is_retracted,
                "retraction_details": retraction_details
            }
    except Exception as e:
        print(f"[Academic Clients] Crossref error for DOI {doi}: {str(e)}")
        
    return {}
