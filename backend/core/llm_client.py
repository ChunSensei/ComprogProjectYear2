import requests
import os
from typing import List
from langchain.schema import Document
from dotenv import load_dotenv

load_dotenv()

class LLMClient:
    def __init__(self):
        self.model = "typhoon-v2.1-12b-instruct"
        self.temperature = 0.2
        self.api_key = os.getenv("TYPHOON_API_KEY")
        self.api_url = "https://api.opentyphoon.ai/v1/chat/completions"
        
    async def generate_answer(self, query: str, context_docs: List[Document]) -> str:
        """Generate answer using Typhoon LLM with context documents"""
        try:
            # Build context from documents
            context = ""
            for i, doc in enumerate(context_docs):
                source = doc.metadata.get("source", "N/A")
                page = doc.metadata.get("page", "N/A")
                context += f"--- อ้างอิง #{i+1} (ไฟล์: {source}, หน้า: {page}) ---\n{doc.page_content}\n\n"

            # Create system prompt in Thai
            system_prompt = """คุณคือผู้ช่วย AI ที่ชาญฉลาดและเป็นมิตร คุณจะตอบคำถามโดยใช้ข้อมูลจากเอกสารที่ให้มาเท่านั้น 
กรุณาตอบเป็นภาษาไทยที่สุภาพและเข้าใจง่าย หากไม่พบข้อมูลที่เกี่ยวข้องในเอกสาร ให้บอกว่าไม่พบข้อมูลดังกล่าว
อย่าแต่งเรื่องหรือใช้ข้อมูลจากภายนอกเอกสารที่ให้มา"""

            # Create user prompt
            user_prompt = f"""**เอกสารอ้างอิง:**
{context}

**คำถาม:**
{query}

**คำตอบ:**"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]

            # Call Typhoon API
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": self.temperature,
                "max_tokens": 1024
            }

            response = requests.post(
                self.api_url,
                headers=headers,
                json=payload
            )
            
            response.raise_for_status()
            result = response.json()
            
            return result["choices"][0]["message"]["content"]
            
        except Exception as e:
            print(f"Error calling Typhoon LLM: {e}")
            return f"ขออภัยครับ เกิดข้อผิดพลาดในการเรียกใช้ AI: {str(e)}"
