# Academic Service API

Servicio Flask con arquitectura por capas (Waitress, SQLite) y autenticación por Bearer token.

**Estructura principal**
- `app/models`: entidades y mapeos ORM
- `app/repositories`: persistencia
- `app/services`: reglas de negocio
- `app/controllers`: rutas REST
- `app/middleware`: interceptor de autorizaciones
- `app/utils`: utilidades (security, serializers, db init)
- `run.py`: entrada con Waitress

**Interceptor de auth**
El archivo `app/middleware/auth_interceptor.py` valida el header `Authorization: Bearer <token>`.
Endpoints excluidos del interceptor:
- `POST /api/auth/login`
- `POST /api/auth/register-admin`
- `POST /api/users/public/register-student`
- `POST /api/users/public/register-teacher`
- `GET /health`

**Instalación y ejecución**

Windows (PowerShell):
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

Unix / macOS:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

Usuario por defecto (seed):
- email: `admin@example.com`
- password: `Admin123*`

**Colección Postman**

Incluye una colección lista para usar en `academic_service/postman/academic_service_grouped_by_entity.postman_collection.json`.

Pasos rápidos para usarla:
1. Abrir Postman → Import → seleccionar el archivo `academic_service/postman/academic_service_grouped_by_entity.postman_collection.json`.
2. En la colección, editar la variable `base_url` (por defecto `http://127.0.0.1:5000`) si tu servidor corre en otra URL.
3. Ejecutar la request `Auth → Login` con el usuario seed para obtener `access_token`.
4. Copiar el token al entorno/variable `access_token` o usar Postman pre-request script para setear `Authorization: Bearer {{access_token}}`.

Ejemplo rápido con `curl` para login y uso posterior:

```bash
# Obtener token
curl -s -X POST http://127.0.0.1:5000/api/auth/login \
	-H "Content-Type: application/json" \
	-d '{"email":"admin@example.com","password":"Admin123*"}'

# Ejemplo: usar token (reemplaza <TOKEN> por el valor obtenido)
curl -X GET http://127.0.0.1:5000/api/users/ \
	-H "Authorization: Bearer <TOKEN>"
```

La colección ya contiene variables útiles (`base_url`, `access_token`, `user_id`, etc.) para automatizar pruebas.

**Resumen de endpoints**
Las rutas están organizadas por dominios `auth`, `users`, `academic`, `evaluation`. La colección Postman agrupa peticiones por entidad (careers, subjects, rubrics, etc.).

Si quieres, puedo:
- Añadir ejemplos de requests concretos al README.
- Ejecutar los comandos `git rm --cached` para desindexar `.venv` si ya está en el repo.

---
Referencias: colección Postman: `academic_service/postman/academic_service_grouped_by_entity.postman_collection.json`.
