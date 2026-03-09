# CRPflow Frontend (Standalone)

Eigenständiges Frontend für den Operations Hub, getrennt von der Flowise-App.

## Start mit Docker (empfohlen)

```bash
cd packages/operationshub-frontend
docker compose up -d --build
```

Dann im Browser öffnen: http://localhost:4173

Stoppen:

```bash
docker compose down
```

## Start ohne Docker

```bash
cd packages/operationshub-frontend
python3 -m http.server 4173
```

Dann im Browser öffnen: http://localhost:4173
