FROM jbarlow83/ocrmypdf:17.8.1

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends pngquant tesseract-ocr-vie \
    && rm -rf /var/lib/apt/lists/*
RUN python -m pip install --no-cache-dir PyMuPDF==1.28.2
USER app
