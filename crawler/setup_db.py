"""
Setup database schema for WikiStock
Loads standard schema.sql from project root into PostgreSQL
"""
import psycopg2
import os
from config import DB_CONFIG

def apply_schema():
    """Apply standard schema.sql to database"""
    # Use the standard schema.sql from project root (not crawler/schema.sql)
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    schema_file = os.path.join(project_root, 'schema.sql')

    with open(schema_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    print(f"Connecting to {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}...")
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    cursor = conn.cursor()

    try:
        print("Applying schema.sql...")
        cursor.execute(sql_content)
        print("Schema applied successfully!")

        # Verify tables
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)

        tables = cursor.fetchall()
        print(f"\nCreated {len(tables)} tables:")
        for table in tables:
            print(f"  - {table[0]}")

    except Exception as e:
        print(f"Error applying schema: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

def main():
    """Main setup function"""
    try:
        print("=== WikiStock Database Setup ===\n")
        apply_schema()
        print("\n[OK] Database setup completed successfully!")
    except Exception as e:
        print(f"\n[FAIL] Setup failed: {e}")
        return 1
    return 0

if __name__ == "__main__":
    exit(main())
