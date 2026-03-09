# CRPflow Control Center (Standalone App)

Diese App läuft **eigenständig** und benötigt **kein Flowise-Runtime-Setup**.

## Schnellstart (Mac / Linux) ohne Docker

```bash
cd operationshub-frontend
npm run start
```

Danach im Browser öffnen: http://localhost:4173

> Hinweis: Du kannst diesen Ordner alleine auf deinen Rechner kopieren (z. B. Desktop) und dort starten.

## Docker-Start

```bash
cd operationshub-frontend
docker compose up -d --build
```

Danach öffnen: http://localhost:4173

Stoppen:

```bash
docker compose down
```

## Wenn du den Ordner direkt aus diesem Repo startest

```bash
cd packages/operationshub-frontend
npm run start
```

Oder mit Docker:

```bash
cd packages/operationshub-frontend
docker compose up -d --build
```
