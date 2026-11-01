// Name: DANV WOW Economy
// ID: danvWowEconomy
// Description: Tích hợp hệ thống tiền tệ năng lượng WOW của DANVworkshop vào game
// By: StudioDANV <https://turbows.pages.dev/users/StudioDANV>
// License: MIT

(function (Scratch) {
  "use strict";

  const WOW_ICON_URL = "https://raw.githubusercontent.com/danvPR/workshop/main/Assets/WOW%20Badge.png";

  const TRUSTED_PARENT_ORIGINS = [
    "https://turbows.pages.dev",
    "https://danvpr.github.io",
    "http://localhost:3000",
    "http://127.0.0.1:5500"
  ];

  const COOLDOWN_MS = 5000;
  const REQUEST_TIMEOUT_MS = 10000;

  let userBalance = 0;
  let isLoggedIn = false;
  let currentUsername = "Guest"; // Mặc định là "Guest" thay vì rỗng hoặc "Khách"
  let lastTxStatus = "NONE";
  let lastTxId = "";

  let lastSyncTime = 0;
  let lastRequestTime = 0;

  let hasRequestedPlayerName = false;
  let handshakeTimeoutTimer = null;
  let syncBalanceTimeoutTimer = null;
  let isSyncingBalance = false;

  const pendingPaymentResolvers = new Map();

  // Hàm đồng bộ và ghi đè khối username màu xanh mặc định của Turbowarp
  function updateTurboWarpUsername(name) {
    const usernameToSet = name || "Guest";
    try {
      if (Scratch.vm) {
        // Gửi qua kênh postIOData chính thống của Scratch/Turbowarp VM
        if (typeof Scratch.vm.postIOData === "function") {
          Scratch.vm.postIOData("userData", { username: usernameToSet });
        }
        // Ghi đè trực tiếp vào ioDevices để tương thích cả chế độ Compiler và Interpreter
        if (Scratch.vm.runtime && Scratch.vm.runtime.ioDevices && Scratch.vm.runtime.ioDevices.userData) {
          const userData = Scratch.vm.runtime.ioDevices.userData;
          userData._username = usernameToSet;
          userData.getUsername = function () {
            return currentUsername || "Guest";
          };
        }
      }
    } catch (e) {
      console.warn("DANV WOW Economy: Lỗi khi cập nhật username Turbowarp", e);
    }
  }

  // Khởi tạo ngay lập tức username mặc định thành "Guest" cho Turbowarp khi tiện ích được tải
  updateTurboWarpUsername(currentUsername);

  function isEmbedded() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  function requestPlayerNameOnce() {
    if (hasRequestedPlayerName) return;
    hasRequestedPlayerName = true;

    if (!isEmbedded()) return;

    if (handshakeTimeoutTimer) clearTimeout(handshakeTimeoutTimer);
    handshakeTimeoutTimer = setTimeout(() => {
      handshakeTimeoutTimer = null;
    }, REQUEST_TIMEOUT_MS);

    window.parent.postMessage({ type: "DANV_WOW_HANDSHAKE" }, "*");
  }

  lastSyncTime = Date.now();
  requestPlayerNameOnce();

  window.addEventListener("message", (event) => {
    const isAllowedOrigin = TRUSTED_PARENT_ORIGINS.includes(event.origin);
    if (!isAllowedOrigin) return;

    const data = event.data;
    if (!data || typeof data !== "object" || !data.type) return;

    if (data.type === "DANV_WOW_INIT") {
      if (handshakeTimeoutTimer) {
        clearTimeout(handshakeTimeoutTimer);
        handshakeTimeoutTimer = null;
      }
      if (syncBalanceTimeoutTimer) {
        clearTimeout(syncBalanceTimeoutTimer);
        syncBalanceTimeoutTimer = null;
        isSyncingBalance = false;
      }

      isLoggedIn = !!data.isLoggedIn;
      if (data.username && String(data.username).trim()) {
        currentUsername = String(data.username).trim();
      } else {
        currentUsername = "Guest";
      }
      userBalance = parseInt(data.balance, 10) || 0;

      // Cập nhật ngay tên người chơi DANV vào khối username xanh của Turbowarp
      updateTurboWarpUsername(currentUsername);
    }

    if (data.type === "DANV_WOW_PAY_RESPONSE") {
      const resolverObj = pendingPaymentResolvers.get(data.requestId);
      if (resolverObj) {
        clearTimeout(resolverObj.timer);

        lastTxStatus = data.status || "FAILED";

        if (data.status === "SUCCESS") {
          userBalance = parseInt(data.newBalance, 10) || 0;
          lastTxId = String(data.txId || "");
          resolverObj.resolve(true);
        } else {
          lastTxId = "";
          resolverObj.resolve(false);
        }

        pendingPaymentResolvers.delete(data.requestId);
      }
    }
  });

  if (Scratch.translate && Scratch.translate.setup) {
    Scratch.translate.setup({
      vi: {
        "danv.policy": "Chính sách về WOW",
        "danv.homepage": "Trang chủ DANVworkshop",
        "danv.checkLoggedIn": "đã kết nối tài khoản DANV?",
        "danv.getUsername": "tên người chơi DANV",
        "danv.getBalance": "số dư WOW hiện tại",
        "danv.requestPayment": "yêu cầu thanh toán [AMOUNT] WOW lý do: [REASON] và chờ",
        "danv.defaultReason": "Mua vật phẩm",
        "danv.isLastTxSuccess": "giao dịch gần nhất thành công?",
        "danv.getLastTxStatus": "trạng thái giao dịch gần nhất",
        "danv.getLastTxId": "mã giao dịch (TX ID) gần nhất",
        "danv.syncBalanceNow": "đồng bộ lại số dư ví với hệ thống",
        "danv.guest": "Guest" // Đã đổi từ "Khách" sang "Guest"
      }
    });
  }

  function msg(id, vi, en) {
    const lang = (
      (Scratch.translate && Scratch.translate.language) ||
      navigator.language ||
      ""
    ).toLowerCase();

    return lang.startsWith("vi") ? vi : en;
  }

  class DANVWowEconomyExtension {
    getInfo() {
      return {
        id: "danvWowEconomy",
        name: "WOW Economy",
        color1: "#f59e0b",
        color2: "#d97706",
        color3: "#b45309",
        blockIconURI: WOW_ICON_URL,
        menuIconURI: WOW_ICON_URL,
        blocks: [
          {
            blockType: Scratch.BlockType.BUTTON,
            text: msg("danv.policy", "Chính sách về WOW", "WOW Policy"),
            func: "openPrivacyPolicy"
          },
          {
            blockType: Scratch.BlockType.BUTTON,
            text: msg("danv.homepage", "Trang chủ DANVworkshop", "DANVworkshop Homepage"),
            func: "openHomePage"
          },
          "---",
          {
            opcode: "checkLoggedIn",
            blockType: Scratch.BlockType.BOOLEAN,
            text: msg("danv.checkLoggedIn", "đã kết nối tài khoản DANV?", "connected to DANV account?")
          },
          {
            opcode: "getUsername",
            blockType: Scratch.BlockType.REPORTER,
            text: msg("danv.getUsername", "tên người chơi DANV", "DANV player name")
          },
          {
            opcode: "getBalance",
            blockType: Scratch.BlockType.REPORTER,
            text: msg("danv.getBalance", "số dư WOW hiện tại", "current WOW balance")
          },
          "---",
          {
            opcode: "requestPaymentAndWait",
            blockType: Scratch.BlockType.COMMAND,
            text: msg("danv.requestPayment", "yêu cầu thanh toán [AMOUNT] WOW lý do: [REASON] và chờ", "request payment of [AMOUNT] WOW for: [REASON] and wait"),
            arguments: {
              AMOUNT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              },
              REASON: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: msg("danv.defaultReason", "Mua vật phẩm", "In-game item")
              }
            }
          },
          {
            opcode: "isLastTxSuccess",
            blockType: Scratch.BlockType.BOOLEAN,
            text: msg("danv.isLastTxSuccess", "giao dịch gần nhất thành công?", "last transaction successful?")
          },
          {
            opcode: "getLastTxStatus",
            blockType: Scratch.BlockType.REPORTER,
            text: msg("danv.getLastTxStatus", "trạng thái giao dịch gần nhất", "last transaction status")
          },
          {
            opcode: "getLastTxId",
            blockType: Scratch.BlockType.REPORTER,
            text: msg("danv.getLastTxId", "mã giao dịch (TX ID) gần nhất", "last transaction ID")
          },
          "---",
          {
            opcode: "syncBalanceNow",
            blockType: Scratch.BlockType.COMMAND,
            text: msg("danv.syncBalanceNow", "đồng bộ lại số dư ví với hệ thống", "sync wallet balance with system")
          }
        ]
      };
    }

    checkLoggedIn() {
      return isLoggedIn;
    }

    getUsername() {
      return currentUsername || "Guest";
    }

    getBalance() {
      return userBalance;
    }

    isLastTxSuccess() {
      return lastTxStatus === "SUCCESS";
    }

    getLastTxStatus() {
      return lastTxStatus;
    }

    getLastTxId() {
      return lastTxId;
    }

    syncBalanceNow() {
      if (!isEmbedded()) return;
      if (isSyncingBalance) return;

      const now = Date.now();
      if (now - lastSyncTime < COOLDOWN_MS) {
        return;
      }
      lastSyncTime = now;
      isSyncingBalance = true;

      if (syncBalanceTimeoutTimer) clearTimeout(syncBalanceTimeoutTimer);
      syncBalanceTimeoutTimer = setTimeout(() => {
        syncBalanceTimeoutTimer = null;
        isSyncingBalance = false;
      }, REQUEST_TIMEOUT_MS);

      window.parent.postMessage({ type: "DANV_WOW_HANDSHAKE" }, "*");
    }

    requestPaymentAndWait(args) {
      let rawAmount = Number(args.AMOUNT);
      if (!Number.isFinite(rawAmount) || rawAmount < 1) {
        rawAmount = 1;
      }
      const amount = Math.floor(rawAmount);

      const defaultReasonText = msg("danv.defaultReason", "Mua vật phẩm", "In-game item");
      const reason = String(args.REASON ?? defaultReasonText).trim().slice(0, 100) || defaultReasonText;

      if (!isEmbedded()) {
        lastTxStatus = "NOT_EMBEDDED";
        lastTxId = "";
        return Promise.resolve(false);
      }

      const now = Date.now();
      if (now - lastRequestTime < COOLDOWN_MS) {
        lastTxStatus = "RATE_LIMITED";
        return Promise.resolve(false);
      }
      lastRequestTime = now;

      for (const resolver of pendingPaymentResolvers.values()) {
        clearTimeout(resolver.timer);
        resolver.resolve(false);
      }
      pendingPaymentResolvers.clear();

      lastTxStatus = "PENDING";
      lastTxId = "";

      return new Promise((resolve) => {
        const requestId = "REQ_" + (typeof crypto.randomUUID === "function"
          ? crypto.randomUUID().slice(0, 10)
          : Math.random().toString(36).substring(2, 10));

        const timeoutTimer = setTimeout(() => {
          if (pendingPaymentResolvers.has(requestId)) {
            lastTxStatus = "TIMEOUT";
            lastTxId = "";
            pendingPaymentResolvers.delete(requestId);
            resolve(false);
          }
        }, 90000);

        pendingPaymentResolvers.set(requestId, {
          resolve: resolve,
          timer: timeoutTimer
        });

        window.parent.postMessage({
          type: "DANV_WOW_PAY_REQUEST",
          requestId: requestId,
          amount: amount,
          reason: reason
        }, "*");
      });
    }

    openPrivacyPolicy() {
      const url = "https://studiodanv.blogspot.com/2026/09/WOW.html";
      if (typeof Scratch.openWindow === "function") {
        Scratch.openWindow(url);
      } else {
        window.open(url, "_blank");
      }
    }

    openHomePage() {
      const url = "https://turbows.pages.dev/";
      if (typeof Scratch.openWindow === "function") {
        Scratch.openWindow(url);
      } else {
        window.open(url, "_blank");
      }
    }
  }

  // Lắng nghe sự kiện của VM để duy trì username Turbowarp liên tục
  if (Scratch.vm) {
    if (Scratch.vm.runtime) {
      // Khi nhấn cờ xanh hoặc bắt đầu chạy dự án, luôn đảm bảo username màu xanh trùng khớp
      Scratch.vm.runtime.on("PROJECT_START", () => {
        updateTurboWarpUsername(currentUsername);
      });

      Scratch.vm.runtime.on("PROJECT_STOP_ALL", () => {
        if (handshakeTimeoutTimer) {
          clearTimeout(handshakeTimeoutTimer);
          handshakeTimeoutTimer = null;
        }
        if (syncBalanceTimeoutTimer) {
          clearTimeout(syncBalanceTimeoutTimer);
          syncBalanceTimeoutTimer = null;
          isSyncingBalance = false;
        }

        for (const resolver of pendingPaymentResolvers.values()) {
          clearTimeout(resolver.timer);
          resolver.resolve(false);
        }
        pendingPaymentResolvers.clear();
        lastTxStatus = "NONE";
        lastTxId = "";
      });
    }

    // Khi nạp dự án mới
    if (typeof Scratch.vm.on === "function") {
      Scratch.vm.on("PROJECT_LOADED", () => {
        updateTurboWarpUsername(currentUsername);
      });
    }
  }

  Scratch.extensions.register(new DANVWowEconomyExtension());
})(Scratch);