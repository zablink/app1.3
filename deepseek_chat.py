import os
import sys
from openai import OpenAI

# 1. อ่าน Prompt จาก Standard Input (รับได้หลายบรรทัด)
# sys.stdin.read() จะรอรับ input จนกว่าจะกด Ctrl+D
print("Enter your prompt (Press Ctrl+D when finished):")
prompt = sys.stdin.read()

if not prompt:
    print("Error: No prompt provided.")
    sys.exit(1)

# 2. ตั้งค่า API Endpoint และ Key (เหมือนเดิม)
client = OpenAI(
    api_key=os.environ.get("sk-8405c876fd654606af8b00e1da6a2b0c"),
    base_url=os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
)

# 3. ส่งคำขอ (เหมือนเดิม)
response = client.chat.completions.create(
    model="deepseek-coder",
    messages=[
        {"role": "user", "content": prompt}
    ],
    stream=True
)

# 4. พิมพ์คำตอบ (เหมือนเดิม)
print("\n--- DeepSeek-Coder Answer ---\n")
for chunk in response:
    content = chunk.choices[0].delta.content
    if content:
        print(content, end="", flush=True)
print("\n")