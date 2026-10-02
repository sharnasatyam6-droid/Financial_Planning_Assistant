from fastapi import FastAPI

# Vercel looks for this 'app' variable
app = FastAPI()


@app.get("/")
def home():
  return {"message": "Hello from FastAPI on Vercel!"}
