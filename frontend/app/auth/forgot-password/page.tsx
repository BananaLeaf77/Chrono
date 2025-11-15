"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import ForgetPass from "./ForgotPass";


export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const verified = searchParams.get("verified");
  const email = searchParams.get("email");

  useEffect(() => {
    if (verified && !email) {
      router.replace("/auth/forgot-password");
    }
  }, [verified, email, router]);

  return  <ForgetPass />;
}
