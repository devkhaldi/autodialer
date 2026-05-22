"use client";

import Script from 'next/script';

export function ZadarmaWidget() {
  const apiKey = process.env.NEXT_PUBLIC_ZADARMA_API_KEY || '';
  const sipLogin = process.env.NEXT_PUBLIC_ZADARMA_SIP_LOGIN || '';

  const handleLibLoaded = () => {
    // Only inject the fn script AFTER lib is fully loaded
    const fnScript = document.createElement('script');
    fnScript.src = 'https://my.zadarma.com/webphoneWebRTCWidget/v9/js/loader-phone-fn.js?sub_v=1';
    fnScript.onload = () => {
      if (typeof (window as any).zadarmaWidgetFn === 'function') {
        (window as any).zadarmaWidgetFn(
          apiKey,
          sipLogin,
          'square',
          'en',
          true,
          { right: '10px', bottom: '5px' }
        );
      }
    };
    document.body.appendChild(fnScript);
  };

  return (
    <Script
      src="https://my.zadarma.com/webphoneWebRTCWidget/v9/js/loader-phone-lib.js?sub_v=1"
      strategy="afterInteractive"
      onLoad={handleLibLoaded}
    />
  );
}
