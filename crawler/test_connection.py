"""
Test database connection
"""
import psycopg2
from config import DB_CONFIG

def test_connection():
    """Test PostgreSQL connection"""
    try:
        print(f"Connecting to {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Test query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print("[OK] Connected successfully!")
        print(f"PostgreSQL version: {version}")

        # Check for pgvector extension
        cursor.execute("SELECT * FROM pg_extension WHERE extname = 'vector';")
        if cursor.fetchone():
            print("[OK] pgvector extension is installed")
        else:
            print("[WARN] pgvector extension is NOT installed")

        cursor.close()
        conn.close()
        return True

    except Exception as e:
        print(f"[FAIL] Connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()
