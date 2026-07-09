from fastapi import FastAPI

app = FastAPI(title='WikiStock AI Service')

@app.get('/health')
def read_health():
    return {'status': 'ok'}
