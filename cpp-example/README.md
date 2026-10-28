# Hooked Auth - Exemplo de Integração em C++

Este diretório contém o SDK oficial em C++ para autenticar jogos (Free Fire, Valorant, FiveM) com a sua plataforma **Hooked Auth**.

---

## 📁 Estrutura dos Arquivos

- `HookedAuth.hpp`: SDK em arquivo único (*single header*), sem dependências externas (usa WinINet nativo do Windows).
- `main.cpp`: Exemplo executável completo de console (loader / injetor).
- `build.bat`: Script de compilação automática para Visual Studio (MSVC), MinGW (`g++`) ou Clang.

---

## 🚀 Como Integrar no seu Projeto C++

### 1. Incluir o Header
Basta copiar o arquivo `HookedAuth.hpp` para a pasta do seu projeto e incluí-lo:

```cpp
#include "HookedAuth.hpp"
```

### 2. Autenticar uma Chave (Discord ID)

```cpp
#include "HookedAuth.hpp"

int main() {
    // Inicializa o cliente com a URL da sua plataforma na Vercel
    HookedAuth::Client auth("https://emrcbypassauth.vercel.app");

    // Coleta o HWID único da máquina do cliente
    std::string hwid = auth.getHardwareId();

    // Valida a licença e o jogo desejado
    std::string key = "849201948201948201"; // Discord ID do cliente
    HookedAuth::LicenseData res = auth.authenticate(key, "Free Fire");

    if (res.valid) {
        std::cout << "Sucesso! Cliente: " << res.clientName << std::endl;
        std::cout << "Plano: " << res.plano << " | Tempo: " << res.tempo << std::endl;

        // SEU CÓDIGO DO CHEAT / INJETOR AQUI
    } else {
        std::cout << "Acesso Negado: " << res.message << std::endl;
    }

    return 0;
}
```

---

## ⚙️ Compilação

### Opção A: Pelo script automático
Dê dois cliques em `build.bat`.

### Opção B: Visual Studio (MSVC)
No **Developer Command Prompt for VS**:
```cmd
cl /EHsc /std:c++17 /O2 main.cpp wininet.lib advapi32.lib
```

### Opção C: MinGW (g++)
```bash
g++ -std=c++17 -O2 main.cpp -o HookedClient.exe -lwininet -ladvapi32
```

---

## 🔒 Proteções Embutidas no SDK C++
- **HWID Fingerprinting:** Combina `MachineGuid` do Registro do Windows + Número de Série do Volume físico + CPU ID.
- **Detecção Anti-Debug:** Bloqueia a execução se detectado `IsDebuggerPresent()` ou `CheckRemoteDebuggerPresent()`.
- **Zero Dependências Externas:** Não necessita de DLLs adicionais (como `libcurl.dll` ou `openssl.dll`).
