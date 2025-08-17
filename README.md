# Nomad FPS Logs API (NestJS + TypeScript)

API que processa **múltiplos logs** de partidas de FPS, **persiste** em SQLite (TypeORM) e expõe **rankings** e **estatísticas** — incluindo **bônus**: arma preferida do vencedor, maior **streak**, **awards** (NoDeathAward, SpeedKillerAward), **ranking global** e **friendly fire** (penalidade -1).

> Docs interativas: `http://localhost:3000/docs`

## Rodando localmente

```bash
npm i
npm run start:dev
# ou
npm run build && npm start
```

Banco: SQLite com arquivo `database.sqlite` criado automaticamente.

## Endpoints principais

- `POST /logs/upload` *(multipart/form-data)* — campo **file** (texto) contendo os logs. O parser suporta:
  - `New match <id> has started`
  - `<killer> killed <victim> using <weapon>`
  - `<WORLD> killed <victim> by <CAUSE>`
  - `Match <id> has ended`

- `POST /logs/matches/:externalId/teams` — define times para uma partida (ex.: `{ "Roman": "A", "Marcus": "A", "Nick": "B" }`). Se **killer** e **victim** estiverem no mesmo time, a morte registra `isFriendlyFire = true`, e o **score** do atirador sofre **-1**.

- `GET /matches` — lista de partidas ingeridas.
- `GET /matches/:externalId/ranking` — ranking da partida com:
  - `frags` (desconsidera <WORLD>), `deaths`, `score` (=frags - friendly fire), `streak`, `favoriteWeapon` do vencedor, e **awards**:
    - `NoDeathAward` — se o **vencedor** terminou com `deaths = 0`.
    - `SpeedKillerAward` — >= **5 frags em 60s** (janela deslizante).
- `GET /players/ranking` — ranking **global** consolidado por jogador.

## Decisões de design

- **DDD-light**: entidades `Match`, `Player`, `Kill`, `Weapon`, `TeamAssignment`.
- **TDD**: suíte Jest com testes de integração do parser/ingestor (pasta `test/`).
- **SOLID/Use cases**: serviços especializados (`LogsService`, `MatchesService`, `PlayersService`), controllers finos.
- **Swagger** verificação rápida de contratos e execução da api.

## Amostras de log
Veja `samples/sample.log` para o exemplo do enunciado.

Criado usando NestJS 10 + TypeORM 0.3 + SQLite.
