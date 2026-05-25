import os
import re
from typing import List
import httpx
from app.config import settings

async def synthesize_academic_queries(title: str, description: str) -> List[str]:
    """
    Synthesizes highly relevant, professional academic search query strings 
    based on a thesis title and description.
    """
    print(f"[Query Synthesizer] Analyzing thesis title: '{title}'...")
    
    # 1. Production Path: Use Gemini API if configured
    if settings.GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            prompt = (
                f"You are an expert academic research swarm coordinator.\n"
                f"Given a thesis title and short description, synthesize exactly 3 distinct, highly targeted academic "
                f"search query strings to fetch papers from APIs (like arXiv or Semantic Scholar).\n"
                f"The queries must use standard academic search syntax (e.g., Boolean terms, exact phrases).\n"
                f"Keep queries concise (2-4 words maximum each). Do not include numbering, explanations, or quotes in your output.\n\n"
                f"Thesis Title: {title}\n"
                f"Description: {description}\n\n"
                f"Format output as a plain list of 3 lines, one query per line."
            )
            
            payload = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    text = response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                    queries = [q.strip().strip('"').strip('- ') for q in text.split("\n") if q.strip()]
                    # Filter and ensure we have 3 queries
                    valid_queries = [q for q in queries if len(q) > 2][:3]
                    if len(valid_queries) == 3:
                        print(f"[Query Synthesizer] Swarm generated via Gemini: {valid_queries}")
                        return valid_queries
        except Exception as e:
            print(f"[Query Synthesizer] Gemini synthesis failed, falling back to NLP extractor: {str(e)}")

    # 2. Local Fallback Path: High-fidelity NLP Keyword Extractor
    return extract_keywords_heuristically(title, description)

def extract_keywords_heuristically(title: str, description: str) -> List[str]:
    """
    Cleans up noise, filters stopwords, extracts technical noun phrases, 
    and synthesizes 3 distinct highly targeted academic query strings.
    """
    stopwords = {
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 
        'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'to', 'was', 'were', 
        'will', 'with', 'the', 'role', 'impact', 'effect', 'study', 'evaluation', 
        'analysis', 'investigation', 'on', 'of', 'using', 'towards', 'through'
    }
    
    # Extract clean alphabetic words
    def clean_text(text: str) -> List[str]:
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        return [w for w in words if w not in stopwords]
    
    title_words = clean_text(title)
    desc_words = clean_text(description)
    
    # Heuristic Query 1: Prime Title Noun Phrase (Top 2-3 unique words from Title)
    query_1 = " ".join(title_words[:3]) if title_words else "academic research"
    
    # Heuristic Query 2: Core Topic Concept (Combination of Title & Description words)
    combined = []
    seen = set()
    # Interleave words to get diverse topics
    for w in title_words + desc_words:
        if w not in seen:
            seen.add(w)
            combined.append(w)
    
    query_2 = " ".join(combined[:3]) if len(combined) >= 3 else query_1
    
    # Heuristic Query 3: Target Application / Outcome (Top words from description)
    # If the title is "Socratic AI in Education", desc is "plagiarism drop retention", query 3 focus on plagiarism
    query_3 = " ".join(desc_words[:3]) if len(desc_words) >= 3 else "active learning synthesis"
    
    # Format and clean up duplicates/short queries
    raw_queries = [query_1, query_2, query_3]
    unique_queries = []
    for q in raw_queries:
        cleaned_query = q.strip().title()
        if cleaned_query and cleaned_query not in unique_queries:
            unique_queries.append(cleaned_query)
            
    # Fallback to make sure we always return 3 queries
    while len(unique_queries) < 3:
        unique_queries.append(f"{title.split(' ')[0]} Literature")
        
    print(f"[Query Synthesizer] Swarm generated via NLP heuristics: {unique_queries}")
    return unique_queries[:3]
