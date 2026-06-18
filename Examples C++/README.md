# Mrclrlq Auth — Exemplo C++

Cliente de autenticação em C++ pra integrar com a API do painel
(Mrclrlq Auth System) em qualquer projeto Windows.

## Arquivos

- **`MrclrlqAuth.hpp`** — Header único, sem dependências externas.
  Contém:
  - `mrcrlq::AuthClient` — classe principal (login + heartbeat)
  - `mrcrlq::hwid::generate()` — HWID estável (volume serial + CPU + MAC, hash SHA256)
  - HTTP via WinHTTP, JSON parser leve embutido
- **`AuthExample.cpp`** — Console standalone que pede a key, valida e
  fica fazendo heartbeat até a sessão ser invalidada.

## Endpoints usados

| Método | Path                    | Descrição                                |
| ------ | ----------------------- | ---------------------------------------- |
| POST   | `/api/auth/validate`    | Login: recebe `{ key, hwid }`, devolve `session_token` |
| POST   | `/api/auth/heartbeat`   | Mantém sessão viva, detecta ban runtime  |

## Compilar

```bat
cl /EHsc /std:c++17 AuthExample.cpp
```

Linker já está configurado via `#pragma comment` (winhttp.lib, iphlpapi.lib, bcrypt.lib).

## Uso mínimo no seu projeto

```cpp
#include "MrclrlqAuth.hpp"

mrcrlq::AuthClient auth("auth.mrcrlq.com", 443, true /* https */);

auto r = auth.Login(L"KEY-XXXXX-XXXXX-XXXXX-XXXXX");
if (!r.success) {
    // r.error / r.message tem os detalhes
    return 1;
}

// Sessão ativa. Inicia thread de heartbeat (cada 60s).
auth.StartHeartbeat([](const mrcrlq::HeartbeatResult& hb) {
    if (!hb.success) {
        // Key foi banida/pausada/expirada durante a sessão.
        // Desativa features e/ou ExitProcess(0).
        ExitProcess(0);
    }
});

// ... resto do programa (overlay, cheat, etc) ...

auth.StopHeartbeat();
```

## Configuração do servidor

| Ambiente   | host                   | port | https |
| ---------- | ---------------------- | ---- | ----- |
| Local dev  | `192.168.1.16`         | 3000 | false |
| Produção   | `auth.mrcrlq.com`      | 443  | true  |

## Notas

- O HWID é gerado a partir do hardware do cliente. Ele é o mesmo entre execuções, mas muda se o usuário trocar de PC ou formatar.
- O `session_token` é HMAC-SHA256 stateless. O servidor não precisa armazenar nada.
- O token tem TTL de 5 minutos; o heartbeat rotaciona ele a cada 60s.
- Defina `AUTH_SECRET` no `.env.local` do servidor em produção.
