'use client';

import { SignUp } from '@clerk/nextjs';
import { useEffect } from 'react';

function patchOTPInputs() {
  document
    .querySelectorAll<HTMLInputElement>(
      '.cl-otpCodeFieldInput, [data-otp-input-v2], input[inputmode="numeric"][maxlength="1"]'
    )
    .forEach(el => {
      if (el.getAttribute('autocomplete') !== 'one-time-code') {
        el.setAttribute('autocomplete', 'one-time-code');
      }
    });
}

export default function SignUpPage() {
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      patchOTPInputs();
      if (Date.now() - start >= 10_000) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignUp />
    </div>
  );
}
