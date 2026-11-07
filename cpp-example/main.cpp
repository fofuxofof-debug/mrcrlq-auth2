/**
 * =========================================================================================
 * HOOKED AUTH - Exemplo Completo em C++ (SDK)
 * Integração Oficial de Autenticação Segura com Proteção HWID e Heartbeat
 * =========================================================================================
 */

#include "HookedAuth.hpp"
#include <iostream>
#include <string>

int main() {
    // Configura o console para UTF-8 nativo
    SetConsoleOutputCP(CP_UTF8);
    SetConsoleCP(CP_UTF8);
    SetConsoleTitleA("Hooked Auth - Cliente Oficial C++");

    std::cout << "========================================================\n";
    std::cout << "       HOOKED AUTH - SISTEMA DE AUTENTICAÇÃO C++       \n";
    std::cout << "========================================================\n\n";

    // 1. Inicializa o cliente HookedAuth apontando para o servidor de produção
    HookedAuth::Client auth("https://emrcbypassauth.vercel.app");

    // 2. Coleta e exibe o Hardware ID (HWID SHA-256) gerado diretamente do hardware
    std::string hwid = auth.getHardwareId();
    std::cout << "[*] Servidor: https://emrcbypassauth.vercel.app\n";
    std::cout << "[*] HWID Detectado: " << hwid << "\n\n";

    // 3. Solicita a Chave de Licença
    std::cout << "[?] Digite sua Key (Discord ID): ";
    std::string licenseKey;
    std::getline(std::cin, licenseKey);

    if (licenseKey.empty()) {
        std::cout << "[i] Nenhuma key digitada. Utilizando licença de teste (22cao)...\n";
        licenseKey = "1517054236041416800";
    }

    // 4. Seleção de Jogo
    std::cout << "\n[?] Selecione o Jogo:\n";
    std::cout << "    [1] Free Fire (Padrão)\n";
    std::cout << "    [2] Valorant\n";
    std::cout << "    [3] FiveM\n";
    std::cout << "    Escolha (1-3) [Padrão: 1]: ";
    std::string choice;
    std::getline(std::cin, choice);

    std::string game = "Free Fire";
    if (choice == "2") game = "Valorant";
    else if (choice == "3") game = "FiveM";

    std::cout << "\n[*] Conectando com servidor Hooked Auth (/api/auth/validate)...\n";
    std::cout << "[*] Verificando integridade e vinculando HWID...\n";

    // 5. Autentica no servidor
    HookedAuth::LicenseData result = auth.authenticate(licenseKey, game);

    std::cout << "\n========================================================\n";
    if (result.valid) {
        std::cout << " [✓] AUTORIZADO COM SUCESSO!\n";
        std::cout << "========================================================\n";
        std::cout << " > Cliente:       " << result.clientName << "\n";
        if (!result.discordUsername.empty()) {
            std::cout << " > Discord:       @" << result.discordUsername << "\n";
        }
        std::cout << " > Jogo:          " << result.game << "\n";
        std::cout << " > Validade:      " << result.expiry << "\n";
        if (result.expiresInSeconds > 0) {
            std::cout << " > Restante:      " << result.expiresInSeconds << " segundos (~" 
                      << (result.expiresInSeconds / 86400) << " dias)\n";
        }
        std::cout << " > HWID Ativo:    " << result.hwid << "\n";
        std::cout << " > Dispositivos:  1 / 1 (Hardware Vinculado ao Painel)\n";
        std::cout << " > Sessão:        " << result.sessionToken.substr(0, std::min<size_t>(20, result.sessionToken.size())) << "...\n";
        std::cout << "========================================================\n\n";

        // Inicia Heartbeat em segundo plano
        std::cout << "[+] Sessão ativa iniciada. Thread de Heartbeat monitorando a cada 60s.\n";
        auth.startHeartbeat([](bool valid, long long remaining) {
            if (valid) {
                std::cout << "\n[Heartbeat OK] Sessao validada no servidor. Restante: " << remaining << "s\n";
            } else {
                std::cout << "\n[!] ALERTA: Sessao revogada ou expirada pelo administrador!\n";
                ExitProcess(0);
            }
        });

        std::cout << "[+] Sucesso! Seu HWID agora consta vinculado no site!\n";
        std::cout << "\nPressione ENTER para encerrar a sessao...";
        std::cin.get();
        auth.stopHeartbeat();
    } else {
        std::cout << " [X] FALHA NA AUTENTICACAO!\n";
        std::cout << "========================================================\n";
        std::cout << " > Motivo: " << result.message << "\n";
        std::cout << "========================================================\n\n";
        std::cout << "Pressione ENTER para sair...";
        std::cin.get();
    }

    return 0;
}
