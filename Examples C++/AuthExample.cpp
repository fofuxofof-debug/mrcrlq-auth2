// =============================================================================
// AuthExample.cpp — exemplo standalone de uso do HavocAuth.hpp
// 
// Como compilar (cl.exe):
//   cl /EHsc /std:c++17 AuthExample.cpp
//
// Ou MSBuild como parte do projeto. Já linka WinHTTP, IPHlpApi e Bcrypt
// via #pragma comment dentro do header.
// =============================================================================

#include "HavocAuth.hpp"
#include <iostream>
#include <iomanip>

// Configuração do servidor
// Para teste local:
//   host = "192.168.1.16", port = 3000, https = false
// Para produção:
//   host = "auth.havoc.com", port = 443, https = true
constexpr auto kHost  = "192.168.1.16";
constexpr int  kPort  = 3000;
constexpr bool kHttps = false;

int wmain() {
    SetConsoleOutputCP(CP_UTF8);

    std::wcout << L"================================================\n"
               << L"   Havoc Auth Client — Example\n"
               << L"================================================\n\n";

    havoc::AuthClient auth(kHost, kPort, kHttps);

    std::wcout << L"HWID: " << auth.GetHwid() << L"\n\n";

    // ----- Pede a key -----
    std::wcout << L"Digite sua key: ";
    std::wstring key;
    std::getline(std::wcin, key);

    std::wcout << L"\nValidando...\n";
    auto r = auth.Login(key);

    if (!r.success) {
        std::wcout << L"\n[X] LOGIN FALHOU\n"
                   << L"  Erro:    " << r.error   << L"\n"
                   << L"  Detalhe: " << r.message << L"\n"
                   << L"  HTTP:    " << r.http_status << L"\n";
        std::wcout << L"\nPressione Enter para sair...";
        std::wcin.get();
        return 1;
    }

    // ----- Sucesso -----
    std::wcout << L"\n[OK] LOGIN OK\n"
               << L"  Label:        " << r.label                  << L"\n"
               << L"  Discord ID:   " << r.discord_id             << L"\n"
               << L"  Expira em:    " << r.expires_at_iso         << L"\n"
               << L"  Tempo restante: " << r.expires_in_seconds   << L"s ("
               << (r.expires_in_seconds / 86400) << L" dias)\n"
               << L"  Dispositivos: " << r.devices_used << L"/" << r.max_devices << L"\n"
               << L"  Token (primeiros 24): "
               << r.session_token.substr(0, std::min<size_t>(24, r.session_token.size()))
               << L"...\n\n";

    // ----- Inicia heartbeat -----
    std::wcout << L"Heartbeat iniciado (cada 60s). Ctrl+C pra sair.\n\n";

    auth.StartHeartbeat([](const havoc::HeartbeatResult& hb) {
        SYSTEMTIME st; GetLocalTime(&st);
        std::wcout << L"["
                   << std::setw(2) << std::setfill(L'0') << st.wHour   << L":"
                   << std::setw(2) << std::setfill(L'0') << st.wMinute << L":"
                   << std::setw(2) << std::setfill(L'0') << st.wSecond << L"] ";

        if (hb.success && hb.valid) {
            std::wcout << L"[OK] Sessão ativa  | restante: "
                       << hb.expires_in_seconds << L"s\n";
        } else {
            std::wcout << L"[!] Sessão perdida: " << hb.error
                       << L" (HTTP " << hb.http_status << L")\n";
            std::wcout << L"\n*** Encerrando: a key foi banida/expirada/pausada ***\n";
            // Em um cheat real:
            //   - desativar todas as features
            //   - chamar ExitProcess(0)
            ExitProcess(0);
        }
    });

    // ----- Loop principal do seu programa aqui -----
    // Em um cheat: aqui rodam o aimbot, ESP, overlay, etc.
    // No exemplo, só fica esperando input do user.
    std::wcout << L"Pressione Enter pra sair...\n";
    std::wcin.get();

    auth.StopHeartbeat();
    return 0;
}
