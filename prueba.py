import psycopg2

def test_connection():
    try:
        # Configuración de la conexión
        connection = psycopg2.connect(
            host="localhost",
            port=5432,
            database="tu_base_de_datos",
            user="tu_usuario",
            password="tu_contraseña"
        )

        cursor = connection.cursor()
        print("✅ Conexión exitosa a PostgreSQL")

        # Consulta de prueba
        cursor.execute("SELECT NOW();")
        result = cursor.fetchone()
        print("📄 Resultado de consulta:", result)

    except Exception as e:
        print("❌ Error al conectar o consultar:", e)

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()
            print("🔌 Conexión cerrada.")

test_connection()
