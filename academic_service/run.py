import logging
from app import create_app
from waitress import serve

app = create_app()

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
    logging.info('Starting academic-service on http://0.0.0.0:5000 — health: /health')
    serve(app, host='0.0.0.0', port=5000)
