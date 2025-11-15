"use client";

import OTPForm from "./OtpCode";
import { useEffect, useState } from "react";

export default function OTPPage() {
  const [email, setEmail] = useState("");

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

  return <OTPForm email={email}/>;
}
