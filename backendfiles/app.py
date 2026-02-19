from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from search import retrieve_docs
from rag import generate_answer
from pydantic import BaseModel
import os
from azure.storage.blob import BlobServiceClient
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS - MUST BE BEFORE ROUTES
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://witty-field-023718703.2.azurestaticapps.net",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    question: str

@app.get("/")
def read_root():
    return {"message": "Compliance Bot API is running"}

@app.post("/ask")
async def ask(request: QuestionRequest):
    docs = retrieve_docs(request.question)
    answer = generate_answer(request.question, docs)
    return {"answer": answer}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        container_name = "regulatory-documents"
        
        if not connection_string:
            return {"error": "Storage not configured"}
        
        blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        blob_client = blob_service_client.get_blob_client(
            container=container_name,
            blob=file.filename
        )
        
        content = await file.read()
        blob_client.upload_blob(content, overwrite=True)
        
        return {
            "message": f"File {file.filename} uploaded successfully",
            "filename": file.filename
        }
    
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return {"error": str(e)}