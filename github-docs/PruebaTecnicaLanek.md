# Prueba Técnica Lanek

## Objetivo

Desarrollar un sistema **Full-Stack desacoplado** para la gestión de datos de consumo. El objetivo es simular la arquitectura de una **Plataforma SaaS Multi-Cliente**.

## Stack Tecnológico Requerido

### Frontend
- **Next.js**
- **TypeScript**
- **React Hook Form**
- **Zod**
- **Axios**

### Backend
- **Python**
- **Flask**
- **SQLAlchemy**
- **Pydantic**
- **PyJWT**

### Base de datos
- **PostgreSQL**

### Containerización
- **Docker**
- **Docker Compose**

## Desafío

Implemente una aplicación que permita:

1. **Login** de usuarios
2. **Registrar y editar** nuevos datos de consumo
3. **Consultar** una lista de sus propios registros, garantizando que no pueda acceder a datos de otros usuarios
4. **Agregar gráficas** que permitan medir distintos KPI de valor

## Requisitos Funcionales y de Seguridad

### Backend: API REST de Consumos

- Debe ser una única aplicación **Flask** que maneje la lógica de negocio y la conexión a **PostgreSQL**
- **Implementar validación estricta** de la estructura de datos entrante
- **Autenticación**: Requiere verificar un token JWT válido enviado en el header `Authorization`
- **Aislamiento**: La consulta a la base de datos debe decodificar del JWT para filtrar y retornar exclusivamente los datos del cliente

### Frontend: Interfaz de Gestión

- Debe ser una aplicación **Next.js** con tipado estricto de **TypeScript**
- **Desarrollo**: Crear una interfaz con un formulario y un listado simple
- **Validación**: Validación del esquema antes de enviar datos al Backend

## Estructura del Repositorio y Entregable

El entregable debe ser un repositorio **GitHub** organizado en dos carpetas principales, además de los archivos de configuración de Docker:

```
/nombre-del-repositorio/
├── backend/
├── frontend/
├── docker-compose.yml
└── README.md
```

**Requisito adicional**: Se debe entregar mínimo **diagrama relacional** de la base de datos.

## Guía de Instalación y Ejecución (README.md)

Esta guía debe permitir la puesta en marcha de todo el sistema y debe incluir:

1. **Pre-requisitos**
2. **Configuración de la Base de Datos**
3. **Instrucciones para Ejecución del Backend (Flask)**
4. **Instrucciones para Ejecución del Frontend (Next.js)**
5. **Archivo docker-compose** en caso de que aplique