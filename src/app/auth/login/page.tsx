import { Suspense } from "react";
import LoginPage from "./loginpage";
 // Assuming your component is in this file

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}
