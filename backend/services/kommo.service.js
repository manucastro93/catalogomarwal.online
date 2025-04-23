import axios from 'axios';

const KOMMO_API_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImMxZTAyOTAyNmVkYTcxYzRhNjU4ZDcyYmVhNmM2YzBjNmZhOWJmNTA5OTdjOTIwNGU4ZGU5MjBmODE3ODI2NDY4MjI3ZTgwMjc5NTA0ZmMxIn0.eyJhdWQiOiI3ZWYwNWY1Yy1kNjgyLTQ3MDItYmYwOS00NWUzMjBhOWEwZTAiLCJqdGkiOiJjMWUwMjkwMjZlZGE3MWM0YTY1OGQ3MmJlYTZjNmMwYzZmYTliZjUwOTk3YzkyMDRlOGRlOTIwZjgxNzgyNjQ2ODIyN2U4MDI3OTUwNGZjMSIsImlhdCI6MTc0NTQzODIzMiwibmJmIjoxNzQ1NDM4MjMyLCJleHAiOjE3ODI4NjQwMDAsInN1YiI6IjEwMzY5MTA3IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMxOTY3NTYzLCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiMTI0NjBkYjctYzUyNy00M2NlLTk5NGUtZjgyOGM1ZjE0YTc1IiwiYXBpX2RvbWFpbiI6ImFwaS1nLmtvbW1vLmNvbSJ9.kpjqz2vIXsAAk2YOCu5WqzNts2993vtORTjFrBgpR1YsE_XTEYRtx20TB5VfXBTuLXtOsIz4PZPrQ7gugi-Etuk6NSGJywEZ_tcaIduLb6H5wDbV1VSN9__3PCQzEXMD4fBEYCZs6GX98d8xnaN5kMbJj2NeRu9vCtBEcedhPMQ_u9aecP49WV9gHas7Mb3fwGlkNXHi-AxdQx9MWd5wDyG_hR-mpLsoX-qazLW8-C0mal7uXJV5tXxo6XSDzP-CKUmvxr6xB6PGgOujtZXyHWjLvJMF94pebdtSzg73O95W-yMxVUUigMjgW9cG42gqeFrQmapOa3gG5lIQ9-2tGQ';
const KOMMO_BASE_URL = 'https://api-g.kommo.com';

/**
 * Crea un lead básico en Kommo desde un pedido confirmado
 * @param {{ nombre: string, telefono: string, total: number }} cliente
 */
export async function crearLeadKommo(cliente) {
    console.log('📝 Creando lead en Kommo...');
    console.log('Cliente:', cliente);
    console.log("clienete telefono", cliente.telefono);
  try {
    const payload = {
      name: `Pedido confirmado - ${cliente.nombre}`,
      _embedded: {
        contacts: [
          {
            name: cliente.nombre,
            custom_fields_values: [
              {
                field_name: 'Телефон', // Fallback si no tenés el field_id
                values: [{ value: cliente.telefono }]
              }
            ]
          }
        ]
      },
      tags: ['Confirmado desde Web'],
      price: cliente.total
    };

    const res = await axios.post(`${KOMMO_BASE_URL}/api/v4/leads`, payload, {
      headers: {
        Authorization: `Bearer ${KOMMO_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Lead creado en Kommo:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ Error al crear lead en Kommo:', error.response?.data || error.message);
    throw error;
  }
}
