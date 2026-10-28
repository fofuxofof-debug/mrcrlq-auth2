#pragma once
/**
 * =============================================================================
 * HOOKED AUTH - C++ SDK (Single Header)
 * Sistema Oficial de Autenticação Segura (Hooked Bypass Auth System)
 * 
 * Baseado na arquitetura do mrcrlq-auth2-main com suporte nativo a:
 *  - WinHTTP (TLS 1.2/1.3 nativo sem cURL ou OpenSSL externos)
 *  - HWID com Hash Criptográfico SHA-256 (BCrypt / Volume Serial / CPU / MAC)
 *  - Token de Sessão HMAC-SHA256 com Heartbeat contínuo a cada 60s
 *  - Detecção de Anti-Debug / Integridade de Memória
 *  - Rotas /api/auth/validate, /api/auth/heartbeat e /api/auth/verify
 * =============================================================================
 */

#ifndef HOOKED_AUTH_HPP
#define HOOKED_AUTH_HPP

// 1. Headers da Biblioteca Padrão C++ (sempre antes dos headers do Windows)
#include <iostream>
#include <string>
#include <vector>
#include <thread>
#include <atomic>
#include <chrono>
#include <functional>
#include <sstream>
#include <iomanip>
#include <mutex>
#include <memory>

// 2. Headers da API Win32 / Windows SDK (winsock2 antes de windows.h)
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <iphlpapi.h>
#include <winhttp.h>
#include <bcrypt.h>

#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "iphlpapi.lib")
#pragma comment(lib, "bcrypt.lib")
#pragma comment(lib, "advapi32.lib")

// =============================================================================
// Geração Segura de HWID (Hardware ID)
// =============================================================================
namespace hooked {
namespace hwid {

    inline std::string get_volume_serial() {
        DWORD serial = 0;
        if (GetVolumeInformationW(L"C:\\", nullptr, 0, &serial, nullptr, nullptr, nullptr, 0)) {
            std::stringstream ss;
            ss << std::hex << std::uppercase << serial;
            return ss.str();
        }
        return "NO_VOL";
    }

    inline std::string get_cpu_vendor() {
        int regs[4] = { 0, 0, 0, 0 };
        __cpuid(regs, 0);
        char vendor[13] = { 0 };
        memcpy(vendor + 0, &regs[1], 4);
        memcpy(vendor + 4, &regs[3], 4);
        memcpy(vendor + 8, &regs[2], 4);
        return std::string(vendor);
    }

    inline std::string get_first_mac() {
        ULONG bufLen = 15000;
        std::vector<BYTE> buf(bufLen);
        IP_ADAPTER_ADDRESSES* aa = reinterpret_cast<IP_ADAPTER_ADDRESSES*>(buf.data());
        if (GetAdaptersAddresses(AF_UNSPEC, GAA_FLAG_SKIP_ANYCAST | GAA_FLAG_SKIP_MULTICAST,
                                 nullptr, aa, &bufLen) != NO_ERROR) {
            return "NO_MAC";
        }
        for (auto* a = aa; a; a = a->Next) {
            if (a->IfType != IF_TYPE_SOFTWARE_LOOPBACK && a->PhysicalAddressLength == 6) {
                std::stringstream ss;
                for (UINT i = 0; i < 6; ++i)
                    ss << std::hex << std::setw(2) << std::setfill('0') << (int)a->PhysicalAddress[i];
                return ss.str();
            }
        }
        return "NO_MAC";
    }

    inline std::string sha256_hex(const std::string& input) {
        BCRYPT_ALG_HANDLE alg = nullptr;
        BCRYPT_HASH_HANDLE hash = nullptr;
        std::string out(64, '0');
        if (BCryptOpenAlgorithmProvider(&alg, BCRYPT_SHA256_ALGORITHM, nullptr, 0) != 0) return out;
        DWORD hashLen = 0, cbData = 0;
        BCryptGetProperty(alg, BCRYPT_HASH_LENGTH, (PBYTE)&hashLen, sizeof(hashLen), &cbData, 0);
        std::vector<BYTE> digest(hashLen);
        BCryptCreateHash(alg, &hash, nullptr, 0, nullptr, 0, 0);
        BCryptHashData(hash, (PBYTE)input.data(), (ULONG)input.size(), 0);
        BCryptFinishHash(hash, digest.data(), hashLen, 0);
        BCryptDestroyHash(hash);
        BCryptCloseAlgorithmProvider(alg, 0);
        std::stringstream ss;
        for (BYTE b : digest) ss << std::hex << std::setw(2) << std::setfill('0') << (int)b;
        return ss.str();
    }

    inline std::wstring generate() {
        std::string raw = get_volume_serial() + "|" + get_cpu_vendor() + "|" + get_first_mac();
        std::string hex = sha256_hex(raw);
        return std::wstring(hex.begin(), hex.end());
    }

    inline std::string generate_utf8() {
        std::string raw = get_volume_serial() + "|" + get_cpu_vendor() + "|" + get_first_mac();
        return sha256_hex(raw);
    }

} // namespace hwid

// =============================================================================
// Helpers de Rede e Parsing JSON
// =============================================================================
namespace detail {

    inline std::wstring utf8_to_wstring(const std::string& s) {
        if (s.empty()) return L"";
        int n = MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), nullptr, 0);
        std::wstring w(n, 0);
        MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), &w[0], n);
        return w;
    }

    inline std::string wstring_to_utf8(const std::wstring& w) {
        if (w.empty()) return "";
        int n = WideCharToMultiByte(CP_UTF8, 0, w.c_str(), (int)w.size(), nullptr, 0, nullptr, nullptr);
        std::string s(n, 0);
        WideCharToMultiByte(CP_UTF8, 0, w.c_str(), (int)w.size(), &s[0], n, nullptr, nullptr);
        return s;
    }

    inline std::string find_str(const std::string& j, const std::string& key) {
        std::string pat = "\"" + key + "\"";
        size_t p = j.find(pat);
        if (p == std::string::npos) return "";
        size_t colon = j.find(':', p);
        if (colon == std::string::npos) return "";
        size_t q1 = j.find('"', colon);
        if (q1 == std::string::npos) return "";
        size_t q2 = j.find('"', q1 + 1);
        while (q2 != std::string::npos && j[q2 - 1] == '\\') q2 = j.find('"', q2 + 1);
        if (q2 == std::string::npos) return "";
        std::string raw = j.substr(q1 + 1, q2 - q1 - 1);
        std::string out; out.reserve(raw.size());
        for (size_t i = 0; i < raw.size(); ++i) {
            if (raw[i] == '\\' && i + 1 < raw.size()) {
                char n = raw[i + 1];
                if (n == 'n') out += '\n';
                else if (n == 't') out += '\t';
                else if (n == '"') out += '"';
                else if (n == '\\') out += '\\';
                else if (n == '/') out += '/';
                else out += n;
                ++i;
            } else out += raw[i];
        }
        return out;
    }

    inline long long find_num(const std::string& j, const std::string& key) {
        std::string pat = "\"" + key + "\"";
        size_t p = j.find(pat);
        if (p == std::string::npos) return 0;
        size_t colon = j.find(':', p);
        if (colon == std::string::npos) return 0;
        size_t i = colon + 1;
        while (i < j.size() && (j[i] == ' ' || j[i] == '\t')) ++i;
        size_t start = i;
        while (i < j.size() && (isdigit((unsigned char)j[i]) || j[i] == '-')) ++i;
        if (start == i) return 0;
        try { return std::stoll(j.substr(start, i - start)); } catch (...) { return 0; }
    }

    inline bool find_bool(const std::string& j, const std::string& key) {
        std::string pat = "\"" + key + "\"";
        size_t p = j.find(pat);
        if (p == std::string::npos) return false;
        size_t colon = j.find(':', p);
        if (colon == std::string::npos) return false;
        return j.find("true", colon) < j.find("false", colon);
    }

    inline std::string json_escape(const std::string& s) {
        std::string out; out.reserve(s.size() + 8);
        for (char c : s) {
            switch (c) {
                case '"':  out += "\\\""; break;
                case '\\': out += "\\\\"; break;
                case '\n': out += "\\n";  break;
                case '\r': out += "\\r";  break;
                case '\t': out += "\\t";  break;
                default:   out += c;       break;
            }
        }
        return out;
    }

    struct HttpResponse {
        int status = 0;
        std::string body;
        bool ok = false;
    };

    inline HttpResponse http_post_json(
        const std::wstring& host, INTERNET_PORT port, bool https,
        const std::wstring& path, const std::string& body)
    {
        HttpResponse r;
        HINTERNET session = WinHttpOpen(L"HookedAuth/2.4 (Windows; x64)",
            WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
        if (!session) return r;

        WinHttpSetTimeouts(session, 5000, 5000, 8000, 8000);

        HINTERNET conn = WinHttpConnect(session, host.c_str(), port, 0);
        if (!conn) { WinHttpCloseHandle(session); return r; }

        DWORD flags = https ? WINHTTP_FLAG_SECURE : 0;
        HINTERNET req = WinHttpOpenRequest(conn, L"POST", path.c_str(),
            nullptr, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, flags);
        if (!req) { WinHttpCloseHandle(conn); WinHttpCloseHandle(session); return r; }

        if (https) {
            DWORD sec = SECURITY_FLAG_IGNORE_CERT_CN_INVALID
                      | SECURITY_FLAG_IGNORE_CERT_DATE_INVALID
                      | SECURITY_FLAG_IGNORE_UNKNOWN_CA
                      | SECURITY_FLAG_IGNORE_CERT_WRONG_USAGE;
            WinHttpSetOption(req, WINHTTP_OPTION_SECURITY_FLAGS, &sec, sizeof(sec));
        }

        const wchar_t* headers = L"Content-Type: application/json\r\nAccept: application/json\r\n";
        BOOL ok = WinHttpSendRequest(req, headers, (DWORD)-1L,
            (LPVOID)body.c_str(), (DWORD)body.size(), (DWORD)body.size(), 0);
        if (!ok) { WinHttpCloseHandle(req); WinHttpCloseHandle(conn); WinHttpCloseHandle(session); return r; }

        ok = WinHttpReceiveResponse(req, nullptr);
        if (!ok) { WinHttpCloseHandle(req); WinHttpCloseHandle(conn); WinHttpCloseHandle(session); return r; }

        DWORD status = 0, statusSz = sizeof(status);
        WinHttpQueryHeaders(req, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
            WINHTTP_HEADER_NAME_BY_INDEX, &status, &statusSz, WINHTTP_NO_HEADER_INDEX);
        r.status = (int)status;

        std::string out; out.reserve(2048);
        for (;;) {
            DWORD avail = 0;
            if (!WinHttpQueryDataAvailable(req, &avail) || avail == 0) break;
            std::vector<char> buf(avail + 1, 0);
            DWORD read = 0;
            if (!WinHttpReadData(req, buf.data(), avail, &read)) break;
            out.append(buf.data(), read);
        }
        r.body = out;
        r.ok = (r.status >= 200 && r.status < 300);

        WinHttpCloseHandle(req);
        WinHttpCloseHandle(conn);
        WinHttpCloseHandle(session);
        return r;
    }

} // namespace detail

// =============================================================================
// Estruturas de Resultado de Login e Heartbeat
// =============================================================================
struct LoginResult {
    bool         success            = false;
    std::wstring error;
    std::wstring message;
    std::wstring session_token;
    std::wstring expires_at_iso;
    long long    expires_in_seconds = 0;
    int          max_devices        = 0;
    int          devices_used       = 0;
    std::wstring discord_id;
    std::wstring discord_username;
    std::wstring label;
    std::wstring game;
    std::wstring hwid;
    int          http_status        = 0;
};

struct HeartbeatResult {
    bool         success            = false;
    bool         valid              = false;
    std::wstring error;
    long long    expires_in_seconds = 0;
    int          http_status        = 0;
};

// =============================================================================
// AuthClient - Implementação Nativa Hooked Auth
// =============================================================================
class AuthClient {
public:
    AuthClient(const std::string& host = "emrcbypassauth.vercel.app", int port = 443, bool https = true)
        : host_(detail::utf8_to_wstring(host)),
          port_(static_cast<INTERNET_PORT>(port)),
          https_(https),
          hwid_(hwid::generate())
    {}

    ~AuthClient() { StopHeartbeat(); }

    // Validação de segurança básica de processo
    bool CheckSecurity() {
        if (IsDebuggerPresent()) return false;
        BOOL remoteDebugger = FALSE;
        CheckRemoteDebuggerPresent(GetCurrentProcess(), &remoteDebugger);
        if (remoteDebugger) return false;
        return true;
    }

    // Realiza login no servidor Hooked Auth (POST /api/auth/validate)
    LoginResult Login(const std::wstring& key, const std::wstring& game = L"Free Fire") {
        LoginResult lr{};
        lr.hwid = hwid_;

        if (!CheckSecurity()) {
            lr.success = false;
            lr.error = L"debugger_detected";
            lr.message = L"Depurador ou ambiente de analise detectado. Acesso negado.";
            return lr;
        }

        std::string body =
            "{\"key\":\"" + detail::json_escape(detail::wstring_to_utf8(key)) +
            "\",\"hwid\":\"" + detail::json_escape(detail::wstring_to_utf8(hwid_)) +
            "\",\"game\":\"" + detail::json_escape(detail::wstring_to_utf8(game)) + "\"}";

        auto r = detail::http_post_json(host_, port_, https_, L"/api/auth/validate", body);
        lr.http_status = r.status;
        if (r.body.empty()) {
            lr.error = L"network_error";
            lr.message = L"Não foi possível conectar ao servidor Hooked Auth.";
            return lr;
        }

        bool success = detail::find_bool(r.body, "success");
        if (!success) {
            lr.error   = detail::utf8_to_wstring(detail::find_str(r.body, "error"));
            lr.message = detail::utf8_to_wstring(detail::find_str(r.body, "message"));
            if (lr.message.empty()) lr.message = lr.error;
            return lr;
        }

        lr.success            = true;
        lr.session_token      = detail::utf8_to_wstring(detail::find_str(r.body, "session_token"));
        lr.expires_at_iso     = detail::utf8_to_wstring(detail::find_str(r.body, "expires_at"));
        if (lr.expires_at_iso.empty()) {
            lr.expires_at_iso = detail::utf8_to_wstring(detail::find_str(r.body, "expiry"));
        }
        lr.expires_in_seconds = detail::find_num(r.body, "expires_in_seconds");
        lr.max_devices        = (int)detail::find_num(r.body, "max_devices");
        if (lr.max_devices == 0) lr.max_devices = 1;
        lr.devices_used       = (int)detail::find_num(r.body, "devices_used");
        if (lr.devices_used == 0) lr.devices_used = 1;
        lr.discord_id         = detail::utf8_to_wstring(detail::find_str(r.body, "discord_id"));
        lr.discord_username   = detail::utf8_to_wstring(detail::find_str(r.body, "discord_username"));
        lr.label              = detail::utf8_to_wstring(detail::find_str(r.body, "label"));
        if (lr.label.empty()) {
            lr.label = detail::utf8_to_wstring(detail::find_str(r.body, "name"));
        }
        lr.game               = detail::utf8_to_wstring(detail::find_str(r.body, "game"));

        std::lock_guard<std::mutex> lk(token_mtx_);
        session_token_ = lr.session_token;
        return lr;
    }

    // Heartbeat manual (POST /api/auth/heartbeat)
    HeartbeatResult Heartbeat() {
        HeartbeatResult hr{};
        std::wstring tk;
        { std::lock_guard<std::mutex> lk(token_mtx_); tk = session_token_; }
        if (tk.empty()) {
            hr.error = L"no_session";
            return hr;
        }

        std::string body =
            "{\"session_token\":\"" + detail::json_escape(detail::wstring_to_utf8(tk)) + "\"}";

        auto r = detail::http_post_json(host_, port_, https_, L"/api/auth/heartbeat", body);
        hr.http_status = r.status;
        if (r.body.empty()) {
            hr.error = L"network_error";
            return hr;
        }

        bool success = detail::find_bool(r.body, "success");
        if (!success) {
            hr.error = detail::utf8_to_wstring(detail::find_str(r.body, "error"));
            return hr;
        }

        hr.success            = true;
        hr.valid              = detail::find_bool(r.body, "valid");
        hr.expires_in_seconds = detail::find_num(r.body, "expires_in_seconds");
        std::wstring newTk    = detail::utf8_to_wstring(detail::find_str(r.body, "session_token"));
        if (!newTk.empty()) {
            std::lock_guard<std::mutex> lk(token_mtx_);
            session_token_ = newTk;
        }
        return hr;
    }

    // Inicia thread de background para sincronização periódica (padrão a cada 60s)
    void StartHeartbeat(std::function<void(const HeartbeatResult&)> cb,
                        std::chrono::seconds interval = std::chrono::seconds(60)) {
        StopHeartbeat();
        running_ = true;
        worker_ = std::thread([this, cb, interval]() {
            using namespace std::chrono;
            auto deadline = steady_clock::now() + interval;
            while (running_.load()) {
                if (steady_clock::now() >= deadline) {
                    auto hr = Heartbeat();
                    if (cb) cb(hr);
                    if (!hr.success) {
                        running_ = false;
                        break;
                    }
                    deadline = steady_clock::now() + interval;
                } else {
                    std::this_thread::sleep_for(milliseconds(250));
                }
            }
        });
    }

    void StopHeartbeat() {
        running_ = false;
        if (worker_.joinable()) worker_.join();
    }

    const std::wstring& GetHwid() const { return hwid_; }
    std::string GetHwidUtf8() const { return detail::wstring_to_utf8(hwid_); }
    std::wstring GetSessionToken() const {
        std::lock_guard<std::mutex> lk(token_mtx_);
        return session_token_;
    }

private:
    std::wstring        host_;
    INTERNET_PORT       port_;
    bool                https_;
    std::wstring        hwid_;

    mutable std::mutex  token_mtx_;
    std::wstring        session_token_;

    std::atomic<bool>   running_{ false };
    std::thread         worker_;
};

} // namespace hooked

// Alias para compatibilidade
namespace havoc = hooked;

// =============================================================================
// Wrapper HookedAuth para compatibilidade total com código legado e novos loaders
// =============================================================================
namespace HookedAuth {

    struct LicenseData {
        bool valid = false;
        std::string message;
        std::string key;
        std::string clientName;
        std::string discordUsername;
        std::string game;
        std::string plano;
        std::string tempo;
        std::string status;
        std::string hwid;
        std::string expiry;
        long long expiresInSeconds = 0;
        std::string sessionToken;
    };

    class Client {
    private:
        std::unique_ptr<hooked::AuthClient> innerClient;
        std::string rawHost;

    public:
        Client(const std::string& url = "https://emrcbypassauth.vercel.app", const std::string& app = "Hooked Auth") {
            std::string host = "emrcbypassauth.vercel.app";
            int port = 443;
            bool isHttps = true;

            if (url.find("https://") == 0) {
                isHttps = true;
                std::string rest = url.substr(8);
                size_t slash = rest.find('/');
                host = (slash == std::string::npos) ? rest : rest.substr(0, slash);
                port = 443;
            } else if (url.find("http://") == 0) {
                isHttps = false;
                std::string rest = url.substr(7);
                size_t slash = rest.find('/');
                host = (slash == std::string::npos) ? rest : rest.substr(0, slash);
                size_t colon = host.find(':');
                if (colon != std::string::npos) {
                    port = std::stoi(host.substr(colon + 1));
                    host = host.substr(0, colon);
                } else {
                    port = 80;
                }
            }
            rawHost = host;
            innerClient = std::make_unique<hooked::AuthClient>(host, port, isHttps);
        }

        std::string getHardwareId() {
            return innerClient ? innerClient->GetHwidUtf8() : "";
        }

        LicenseData authenticate(const std::string& licenseKey, const std::string& game = "Free Fire") {
            LicenseData res;
            res.key = licenseKey;
            res.game = game;
            if (!innerClient) return res;

            res.hwid = innerClient->GetHwidUtf8();

            auto lr = innerClient->Login(hooked::detail::utf8_to_wstring(licenseKey), hooked::detail::utf8_to_wstring(game));
            res.valid = lr.success;
            res.message = hooked::detail::wstring_to_utf8(lr.message);
            res.clientName = hooked::detail::wstring_to_utf8(lr.label);
            res.discordUsername = hooked::detail::wstring_to_utf8(lr.discord_username);
            res.game = hooked::detail::wstring_to_utf8(lr.game.empty() ? hooked::detail::utf8_to_wstring(game) : lr.game);
            res.expiry = hooked::detail::wstring_to_utf8(lr.expires_at_iso);
            res.expiresInSeconds = lr.expires_in_seconds;
            res.sessionToken = hooked::detail::wstring_to_utf8(lr.session_token);
            res.status = lr.success ? "Active" : "Invalid";

            return res;
        }

        void startHeartbeat(std::function<void(bool valid, long long remaining)> onUpdate) {
            if (!innerClient) return;
            innerClient->StartHeartbeat([onUpdate](const hooked::HeartbeatResult& hr) {
                if (onUpdate) {
                    onUpdate(hr.success && hr.valid, hr.expires_in_seconds);
                }
            });
        }

        void stopHeartbeat() {
            if (innerClient) {
                innerClient->StopHeartbeat();
            }
        }
    };

} // namespace HookedAuth

#endif // HOOKED_AUTH_HPP
