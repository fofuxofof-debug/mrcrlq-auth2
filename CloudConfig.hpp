#pragma once
/**
 * =========================================================================================
 * HOOKED AUTH - Cloud Config SDK (C++)
 * Sistema Universal de Salvamento, Carregamento e Aplicacao Automatica de Configuracoes
 * Compativel com qualquer base C++ (ImGui, Internal, External, etc.)
 * =========================================================================================
 */

#include <windows.h>
#include <winhttp.h>
#include <string>
#include <sstream>
#include <functional>
#include <thread>
#include <atomic>
#include <vector>

#pragma comment(lib, "winhttp.lib")

namespace HookedCloud {

    class Client {
    private:
        std::wstring m_serverHost;
        std::string m_licenseKey;
        std::string m_game;
        std::string m_lastActiveConfig;
        std::atomic<bool> m_monitoring{ false };
        std::thread m_workerThread;

        std::string httpPost(const std::wstring& path, const std::string& jsonPayload) {
            HINTERNET hSession = WinHttpOpen(L"HookedCloudConfig/2.4", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
            if (!hSession) return "";

            HINTERNET hConnect = WinHttpConnect(hSession, m_serverHost.c_str(), INTERNET_DEFAULT_HTTPS_PORT, 0);
            if (!hConnect) { WinHttpCloseHandle(hSession); return ""; }

            HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"POST", path.c_str(), NULL, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, WINHTTP_FLAG_SECURE);
            if (!hRequest) { WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return ""; }

            std::wstring headers = L"Content-Type: application/json\r\n";
            std::string response;

            if (WinHttpSendRequest(hRequest, headers.c_str(), (DWORD)headers.length(), (LPVOID)jsonPayload.c_str(), (DWORD)jsonPayload.length(), (DWORD)jsonPayload.length(), 0)) {
                if (WinHttpReceiveResponse(hRequest, NULL)) {
                    DWORD bytesAvailable = 0;
                    while (WinHttpQueryDataAvailable(hRequest, &bytesAvailable) && bytesAvailable > 0) {
                        std::vector<char> buffer(bytesAvailable + 1);
                        DWORD bytesRead = 0;
                        if (WinHttpReadData(hRequest, buffer.data(), bytesAvailable, &bytesRead)) {
                            response.append(buffer.data(), bytesRead);
                        }
                    }
                }
            }

            WinHttpCloseHandle(hRequest);
            WinHttpCloseHandle(hConnect);
            WinHttpCloseHandle(hSession);
            return response;
        }

        static std::string escapeJson(const std::string& in) {
            std::string out;
            for (char c : in) {
                if (c == '"') out += "\\\"";
                else if (c == '\\') out += "\\\\";
                else if (c == '\n') out += "\\n";
                else if (c == '\r') out += "\\r";
                else out += c;
            }
            return out;
        }

        static std::string extractField(const std::string& json, const std::string& field) {
            std::string search = "\"" + field + "\"";
            size_t pos = json.find(search);
            if (pos == std::string::npos) return "";

            pos = json.find(':', pos);
            if (pos == std::string::npos) return "";

            pos = json.find_first_not_of(" \t\r\n", pos + 1);
            if (pos == std::string::npos) return "";

            if (json[pos] == '"') {
                size_t end = json.find('"', pos + 1);
                if (end != std::string::npos) return json.substr(pos + 1, end - pos - 1);
            } else {
                size_t end = json.find_first_of(",}\r\n", pos);
                if (end != std::string::npos) return json.substr(pos, end - pos);
            }
            return "";
        }

    public:
        Client(const std::string& licenseKey, const std::string& game = "Free Fire", const std::wstring& host = L"mrcrlq-auth2.vercel.app")
            : m_licenseKey(licenseKey), m_game(game), m_serverHost(host) {}

        ~Client() {
            stopAutoSync();
        }

        // Salva uma configuracao (JSON, INI ou string com as sensis/opcoes) na nuvem
        bool saveConfig(const std::string& configName, const std::string& configData) {
            std::ostringstream ss;
            ss << "{\"key\":\"" << escapeJson(m_licenseKey) << "\","
               << "\"action\":\"save\","
               << "\"name\":\"" << escapeJson(configName) << "\","
               << "\"game\":\"" << escapeJson(m_game) << "\","
               << "\"config\":\"" << escapeJson(configData) << "\"}";

            std::string res = httpPost(L"/api/config", ss.str());
            return res.find("\"success\":true") != std::string::npos;
        }

        // Carrega a configuracao ativa ou uma especifica pelo nome
        std::string loadConfig(const std::string& configName = "") {
            std::ostringstream ss;
            ss << "{\"key\":\"" << escapeJson(m_licenseKey) << "\","
               << "\"action\":\"load\"";
            if (!configName.empty()) {
                ss << ",\"name\":\"" << escapeJson(configName) << "\"";
            }
            ss << "}";

            std::string res = httpPost(L"/api/config", ss.str());
            if (res.find("\"success\":true") == std::string::npos) {
                return "";
            }

            return extractField(res, "config");
        }

        // Ativa uma config no servidor (faz ela ser a config padrao)
        bool selectConfig(const std::string& configName) {
            std::ostringstream ss;
            ss << "{\"key\":\"" << escapeJson(m_licenseKey) << "\","
               << "\"action\":\"select\","
               << "\"name\":\"" << escapeJson(configName) << "\"}";

            std::string res = httpPost(L"/api/config", ss.str());
            return res.find("\"success\":true") != std::string::npos;
        }

        // Sincronizacao em tempo real: verifica a cada X segundos se a config mudou e chama o callback para aplicar
        void startAutoSync(int intervalSeconds, std::function<void(const std::string& newConfig)> onConfigUpdated) {
            if (m_monitoring) return;
            m_monitoring = true;

            m_workerThread = std::thread([this, intervalSeconds, onConfigUpdated]() {
                while (m_monitoring) {
                    std::string currentCfg = loadConfig();
                    if (!currentCfg.empty() && currentCfg != m_lastActiveConfig) {
                        m_lastActiveConfig = currentCfg;
                        if (onConfigUpdated) {
                            onConfigUpdated(currentCfg);
                        }
                    }
                    std::this_thread::sleep_for(std::chrono::seconds(intervalSeconds));
                }
            });
            m_workerThread.detach();
        }

        void stopAutoSync() {
            m_monitoring = false;
        }
    };

}
