import { useGoogleLogin } from "@react-oauth/google";
import { postJson } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export function useGoogleAuth(onAuthenticated?: () => void) {

    const router = useRouter();

    const login = useGoogleLogin({
        flow: "implicit",
        scope: "openid email profile",
        onSuccess: async (tokenResponse) => {
            try {
                // Send credential (ID token) to backend
                const payload = await postJson<{
                    id: string;
                    username: string;
                    email: string;
                    token: string;
                }>("/api/auth/google", {
                    access_token: tokenResponse.access_token,
                });

                // Directly setAuth now — no flattening required
                setAuth(payload);
                onAuthenticated?.();

                router.push("/analyze");

            } catch (err) {
                console.error("Google login failed", err);
            }
        },
    });

    return { login };
}