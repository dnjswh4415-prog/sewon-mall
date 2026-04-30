"use client";

import { useEffect } from "react";

const POPUP_STORAGE_KEY = "sewon_main_popup_hidden_until";

export default function MainPopupWindow() {
  useEffect(() => {
    const hiddenUntil = localStorage.getItem(POPUP_STORAGE_KEY);

    if (hiddenUntil && Date.now() < Number(hiddenUntil)) {
      return;
    }

    const popupWidth = 520;
    const popupHeight = 430;

    const left = window.screenX + (window.outerWidth - popupWidth) / 2;
    const top = window.screenY + (window.outerHeight - popupHeight) / 2;

    const popup = window.open(
      "/popup/main",
      "sewonMainPopup",
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=no,scrollbars=no`
    );

    if (!popup) {
      console.warn("팝업이 차단되었습니다.");
    }
  }, []);

  return null;
}