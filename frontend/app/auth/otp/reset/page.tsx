"use client";

import OTPFormReset from "./OtpReset";
import { useEffect, useState } from "react";

export default function OTPPage() {
  const [email, setEmail] = useState("");
  const type = "reset";  

  useEffect(() => {
    // Get email from cookie
    const cookies = document.cookie.split(";");
    const userEmailCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("userEmail=")
    );
    if (userEmailCookie) {
      const emailValue = userEmailCookie.split("=")[1];
      setEmail(decodeURIComponent(emailValue));
    }
  }, []);

  // Log for debugging
  useEffect(() => {
    console.log("Current email:", email);
  }, [email]);

  return <OTPFormReset email={email} />;
}
