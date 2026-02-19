import os
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv

# Load .env only if it exists (local development)
load_dotenv()

SEARCH_ENDPOINT = os.getenv("SEARCH_ENDPOINT")
SEARCH_KEY = os.getenv("SEARCH_KEY")
SEARCH_INDEX_NAME = os.getenv("SEARCH_INDEX_NAME", "indexbot")

if not SEARCH_ENDPOINT or not SEARCH_KEY:
    raise ValueError("Missing SEARCH_ENDPOINT or SEARCH_KEY environment variable")

client = SearchClient(
    endpoint = SEARCH_ENDPOINT,
    index_name = SEARCH_INDEX_NAME,
    credential = AzureKeyCredential(SEARCH_KEY)
)

def retrieve_docs(query, top=5):
    try:
        results = client.search(
            search_text=query,
            top=top
        )
        #docs = [r["content"] for r in results]
        docs = []
        for r in results:
            if "content" in r:
                docs.append(r["content"])
        return docs
    except Exception as e:
        print(f"Search error: {e}")
        return []