"use client";

import Script from 'next/script';

export function ZadarmaWidget() {
  const apiKey = process.env.NEXT_PUBLIC_ZADARMA_API_KEY || '';
  const sipLogin = process.env.NEXT_PUBLIC_ZADARMA_SIP_LOGIN || '';

  return (
    <>
      <Script
        src="https://my.zadarma.com/webphoneWebRTCWidget/v9/js/loader-phone-lib.js?sub_v=1"
        strategy="afterInteractive"
      />
      <Script
        src="https://my.zadarma.com/webphoneWebRTCWidget/v9/js/loader-phone-fn.js?sub_v=1"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof (window as any).zadarmaWidgetFn === 'function') {
            (window as any).zadarmaWidgetFn(
              apiKey,
              sipLogin,
              'square',   // square | rounded
              'en',       // ru, en, es, fr, de, pl, ua
              true,       // show widget
              { right: '10px', bottom: '5px' }
            );
          }
        }}
      />
    </>
  );
}
