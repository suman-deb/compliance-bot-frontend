from openai import AzureOpenAI
import os
from dotenv import load_dotenv
load_dotenv()
OPENAI_KEY = os.getenv("OPENAI_KEY")
OPENAI_ENDPOINT = os.getenv("OPENAI_ENDPOINT")
DEPLOYMENT_NAME = os.getenv("OPENAI_DEPLOYMENT_NAME", "gpt-4o-mini")

if not OPENAI_KEY or not OPENAI_ENDPOINT:
    raise ValueError("Missing OPENAI_KEY or OPENAI_ENDPOINT")

client = AzureOpenAI(
    api_key=OPENAI_KEY,
    api_version="2024-02-01",
    azure_endpoint=OPENAI_ENDPOINT
)

def generate_answer(question, docs):
    if not docs:
        return "No relevant documents found to answer your question."
    
    context = "\n\n".join(docs)
    prompt = f"""
        You are a regulatory compliance assistant.
        Answer strictly based on the context below.
        If the context doesn't contain the answer, say "I don't have enough information to answer this question."
        
        Context:
            {context}
        
        Question:
            {question}
        Answer: """
    try:
        response = client.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": "You are a helpful regulatory compliance assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=800
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI error: {e}")
        return f"Error generating answer: {str(e)}"
