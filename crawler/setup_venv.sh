#!/bin/bash
# Setup virtual environment for WikiStock Crawler

echo "=== WikiStock Crawler - Setup Virtual Environment ==="
echo ""

# Create virtual environment (Python 3.12 — 3.14 lacks stable numpy/psycopg2 wheels on Windows)
echo "Creating virtual environment..."
py -3.12 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/Scripts/activate

# Upgrade pip
echo "Upgrading pip..."
python -m pip install --upgrade pip

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "✓ Setup completed successfully!"
echo ""
echo "To activate the virtual environment in the future, run:"
echo "  source venv/Scripts/activate"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and configure your database"
echo "  2. Run: python setup_db.py"
