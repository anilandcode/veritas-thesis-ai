import re
import math
from typing import List, Dict, Any, Set

# Standard technical stopwords to optimize VSM token vector dimensions
STOPWORDS = {
    'the', 'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 
    'has', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'to', 'with', 
    'have', 'this', 'these', 'those', 'must', 'should', 'can', 'will', 'highly',
    'we', 'our', 'us', 'they', 'their', 'them', 'who', 'whom', 'which', 'what',
    'would', 'could', 'been', 'was', 'were', 'about', 'more', 'there', 'some'
}

def tokenize(text: str) -> List[str]:
    """
    Cleans text, converts to lowercase, and extracts alphanumeric tokens >= 3 chars.
    Filters out common technical stopwords.
    """
    if not text:
        return []
    cleaned = text.lower().replace("-", " ")
    # Find all words with 3 or more alphabetic characters
    tokens = re.findall(r'\b[a-z]{3,}\b', cleaned)
    return [t for t in tokens if t not in STOPWORDS]

def compute_tf(tokens: List[str]) -> Dict[str, float]:
    """
    Computes simple Term Frequencies (raw token occurrence counts).
    """
    tf = {}
    for t in tokens:
        tf[t] = tf.get(t, 0.0) + 1.0
    return tf

def calculate_cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    """
    Computes cosine similarity between two weight vectors representing word TF-IDF scores.
    """
    intersection = set(vec1.keys()) & set(vec2.keys())
    if not intersection:
        return 0.0
        
    dot_product = sum(vec1[x] * vec2[x] for x in intersection)
    
    sum1 = sum(v ** 2 for v in vec1.values())
    sum2 = sum(v ** 2 for v in vec2.values())
    
    magnitude = math.sqrt(sum1) * math.sqrt(sum2)
    if not magnitude:
        return 0.0
        
    return dot_product / magnitude

def check_text_similarity(test_text: str, cached_papers: List[Any]) -> Dict[str, Any]:
    """
    Performs vector-similarity comparison between a test block of text 
    (e.g., student draft paragraph or swarmed candidate claim) and cached paper abstracts.
    Utilizes a local Vector Space Model (VSM) with TF-IDF weights.
    """
    if not test_text or not test_text.strip() or not cached_papers:
        return {
            "highest_similarity": 0.0,
            "matching_paper_title": None,
            "matching_paper_doi": None,
            "plagiarism_risk": "Low"
        }
        
    test_tokens = tokenize(test_text)
    if not test_tokens:
        return {
            "highest_similarity": 0.0,
            "matching_paper_title": None,
            "matching_paper_doi": None,
            "plagiarism_risk": "Low"
        }
        
    # Represent papers in the corpus
    corpus_docs = []
    vocab: Set[str] = set(test_tokens)
    
    for paper in cached_papers:
        # Index both title and abstract to create a high-fidelity semantic block
        doc_text = f"{paper.title or ''} {paper.abstract or ''}"
        tokens = tokenize(doc_text)
        if tokens:
            corpus_docs.append({
                "paper": paper,
                "tokens": tokens,
                "tf": compute_tf(tokens)
            })
            vocab.update(tokens)
            
    if not corpus_docs:
        return {
            "highest_similarity": 0.0,
            "matching_paper_title": None,
            "matching_paper_doi": None,
            "plagiarism_risk": "Low"
        }
        
    # Compute Document Frequencies (DF) across the corpus + test_text
    N = len(corpus_docs) + 1 # Total docs includes cached papers + the text being tested
    df = {}
    for term in vocab:
        count = 0.0
        for doc in corpus_docs:
            if term in doc["tf"]:
                count += 1.0
        if term in test_tokens:
            count += 1.0
        df[term] = count
        
    # Compute Inverse Document Frequencies (IDF)
    idf = {}
    for term in vocab:
        # Standard smoothed IDF formula to prevent division by zero or negative weights
        idf[term] = math.log(1.0 + (N / (1.0 + df[term])))
        
    # Represent test_text as a TF-IDF weight vector
    test_tf = compute_tf(test_tokens)
    test_vector = {term: count * idf[term] for term, count in test_tf.items()}
    
    highest_similarity = 0.0
    matching_paper = None
    
    # Calculate similarity metrics for each research paper cached in database
    for doc in corpus_docs:
        doc_vector = {term: count * idf[term] for term, count in doc["tf"].items()}
        similarity = calculate_cosine_similarity(test_vector, doc_vector)
        
        if similarity > highest_similarity:
            highest_similarity = similarity
            matching_paper = doc["paper"]
            
    # Enforce standard academic plagiarism risk boundaries
    # High: Direct Copy-Paste (>= 60% overlap)
    # Moderate: Paraphrase Risk (>= 30% overlap)
    # Low: Valid unique synthesis (< 30% overlap)
    if highest_similarity >= 0.60:
        risk = "High"
    elif highest_similarity >= 0.30:
        risk = "Moderate"
    else:
        risk = "Low"
        
    return {
        "highest_similarity": float(highest_similarity),
        "matching_paper_title": matching_paper.title if matching_paper else None,
        "matching_paper_doi": matching_paper.doi if matching_paper else None,
        "plagiarism_risk": risk
    }
