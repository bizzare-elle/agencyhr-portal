import { useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAuthStore } from "@/hooks/use-auth";
import bgImg from "@/assets/images/bg-3.avif";
import { Spinner } from "@/components/ui/spinner";
import { motion, AnimatePresence } from "framer-motion";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

const resetSchema = z
    .object({
        newPassword: z
            .string()
            .min(12, "Minimum 12 characters required")
            .regex(/[A-Z]/, "Must include an uppercase letter")
            .regex(/[a-z]/, "Must include a lowercase letter")
            .regex(/[0-9]/, "Must include a number")
            .regex(/[\W_]/, "Must include a special character (e.g. @, #, !)"),
        confirm: z.string().min(1, "Please confirm your password"),
    })
    .refine((d) => d.newPassword === d.confirm, {
        message: "Passwords do not match",
        path: ["confirm"],
    });

// Off unless a build lists the hostnames its reCAPTCHA key is registered for
// (VITE_CAPTCHA_HOSTS=host1,host2). Google shows "Invalid domain for site key"
// on any other host, and with Sign In disabled until the box is ticked that
// would lock everyone out.
const CAPTCHA_HOSTS = (import.meta.env.VITE_CAPTCHA_HOSTS ?? "")
    .split(",")
    .map((host: string) => host.trim())
    .filter(Boolean);
const RECAPTCHA_SITE_KEY = CAPTCHA_HOSTS.includes(window.location.hostname)
    ? "6LeK5BosAAAAABnHD1U3hU9P183J-cGG7KRZHRus"
    : undefined;

type LoginValues = z.infer<typeof loginSchema>;
type ResetValues = z.infer<typeof resetSchema>;

export default function LoginPage() {
    const loginForm = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });
    const resetForm = useForm<ResetValues>({
        resolver: zodResolver(resetSchema),
        defaultValues: { newPassword: "", confirm: "" },
    });

    const navigate = useNavigate();
    const setToken = useAuthStore((s) => s.setToken);
    const loadUser = useAuthStore((s) => s.loadUser);

    const recaptchaRef = useRef<ReCAPTCHA>(null);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Held between login success and reset completion
    const [pendingReset, setPendingReset] = useState<{ userId: string } | null>(
        null,
    );

    const loginMutation = useMutation({
        mutationFn: async (data: LoginValues) => {
            const response = await api.post("/api/v2/auth/login", data);
            return response.data;
        },
    });

    const resetMutation = useMutation({
        mutationFn: async (data: ResetValues) => {
            const res = await api.post(
                `/api/v2/auth/reset/${pendingReset!.userId}`,
                { password: data.newPassword },
            );
            return res.data;
        },
    });

    const navigateHome = (user: any) => {
        toast.success("Login successful!");
        if (user.is_admin === 1) {
            navigate(`/admin/${user.id}`);
        } else if (user.role === "agency_coordinator") {
            navigate(`/dashboard/${user.agency_id}`);
        } else {
            navigate(`/employees/${user.id}`);
        }
    };

    const onLogin = (values: LoginValues) => {
        loginMutation.mutate(values, {
            onSuccess: async (response) => {
                const token = response?.data?.token;
                if (!token) return;

                setToken(token, response?.data?.refresh_token);
                const user = await loadUser(token);

                if (!user?.id) {
                    toast.error("Failed to load user info.");
                    return;
                }

                if (response?.data?.must_reset_password === 1) {
                    setPendingReset({ userId: String(user.id) });
                    return;
                }

                navigateHome(user);
            },
            onError: (err: any) => {
                toast.error(err?.response?.data?.message || "Login failed");
                recaptchaRef.current?.reset();
                setCaptchaToken(null);
            },
        });
    };

    const onReset = (values: ResetValues) => {
        resetMutation.mutate(values, {
            onSuccess: async (response) => {
                // The server just revoked every prior token for this account
                // as part of the reset (a stale token must not survive a
                // password change) and mints a fresh one in this same
                // response -- the old token in the store is dead the instant
                // this request completes, so it must never be reused here.
                const freshToken = response?.data?.token;
                if (freshToken) {
                    setToken(freshToken, response?.data?.refresh_token);
                    const user = await loadUser(freshToken);
                    if (user?.id) {
                        navigateHome(user);
                        return;
                    }
                }
                navigate("/login");
            },
            onError: (err: any) => {
                toast.error(
                    err?.response?.data?.message || "Failed to update password",
                );
            },
        });
    };

    const inputCls =
        "h-12 rounded-lg border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-yellow-500 focus-visible:ring-yellow-500/20 md:text-base";
    const labelCls = "text-sm font-semibold text-white/80";
    const submitCls =
        "mt-1 h-12 w-full rounded-lg bg-yellow-500 text-base font-semibold text-white shadow-sm hover:bg-yellow-600 disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none disabled:opacity-100";
    const eyeCls =
        "absolute top-1/2 right-3 -translate-y-1/2 text-white/40 transition hover:text-white/80";

    return (
        <div
            className="relative flex min-h-screen bg-zinc-950"
            style={{
                backgroundImage: `url(${bgImg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            <div className="absolute inset-0 bg-black/80" />
            <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="login-card w-full max-w-[460px] rounded-2xl bg-zinc-900/90 p-6 shadow-2xl ring-1 shadow-black/40 ring-white/10 backdrop-blur-sm sm:p-10"
                >
                    <div className="mb-7 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500 shadow-lg shadow-yellow-500/20">
                            {pendingReset ? (
                                <ShieldCheck className="h-7 w-7 text-white" />
                            ) : (
                                <LogIn className="h-7 w-7 text-white" />
                            )}
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            {pendingReset
                                ? "Set a new password"
                                : "Welcome back"}
                        </h1>
                        <p className="mt-2 text-base text-white/60">
                            {pendingReset
                                ? "One more step before you continue"
                                : "Sign in to your Agency HR account"}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {!pendingReset ? (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Form {...loginForm}>
                                    <form
                                        onSubmit={loginForm.handleSubmit(
                                            onLogin,
                                        )}
                                        className="space-y-5"
                                    >
                                        <FormField
                                            control={loginForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel
                                                        className={labelCls}
                                                    >
                                                        Email address
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="you@example.com"
                                                            type="email"
                                                            autoComplete="email"
                                                            {...field}
                                                            disabled={
                                                                loginMutation.isPending
                                                            }
                                                            className={inputCls}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-red-400" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={loginForm.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between">
                                                        <FormLabel
                                                            className={labelCls}
                                                        >
                                                            Password
                                                        </FormLabel>
                                                        <a
                                                            href="https://backoffice.wildflour.com.ph/forgot_email_agency"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm font-medium text-yellow-500 transition hover:text-yellow-400"
                                                        >
                                                            Forgot password?
                                                        </a>
                                                    </div>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="••••••••"
                                                                type={
                                                                    showPassword
                                                                        ? "text"
                                                                        : "password"
                                                                }
                                                                autoComplete="current-password"
                                                                {...field}
                                                                disabled={
                                                                    loginMutation.isPending
                                                                }
                                                                className={`${inputCls} pr-10`}
                                                            />
                                                            <button
                                                                type="button"
                                                                aria-label={
                                                                    showPassword
                                                                        ? "Hide password"
                                                                        : "Show password"
                                                                }
                                                                onClick={() =>
                                                                    setShowPassword(
                                                                        !showPassword,
                                                                    )
                                                                }
                                                                className={
                                                                    eyeCls
                                                                }
                                                            >
                                                                {showPassword ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-red-400" />
                                                </FormItem>
                                            )}
                                        />
                                        {RECAPTCHA_SITE_KEY && (
                                            <div className="flex w-full justify-center overflow-hidden">
                                                <div className="origin-center max-[420px]:scale-[0.85]">
                                                    <ReCAPTCHA
                                                        ref={recaptchaRef}
                                                        sitekey={
                                                            RECAPTCHA_SITE_KEY
                                                        }
                                                        theme="dark"
                                                        onChange={
                                                            setCaptchaToken
                                                        }
                                                        onExpired={() =>
                                                            setCaptchaToken(
                                                                null,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <Button
                                            type="submit"
                                            disabled={
                                                loginMutation.isPending ||
                                                (!!RECAPTCHA_SITE_KEY &&
                                                    !captchaToken)
                                            }
                                            className={submitCls}
                                        >
                                            {loginMutation.isPending ? (
                                                <span className="flex items-center gap-2">
                                                    <Spinner className="h-4 w-4" />
                                                    Signing in...
                                                </span>
                                            ) : (
                                                "Sign In"
                                            )}
                                        </Button>
                                    </form>
                                </Form>

                                <p className="mt-8 text-center text-sm text-white/50">
                                    Need help?{" "}
                                    <a
                                        href="https://support.agencyhr.ph"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-white/80 underline-offset-4 transition hover:text-yellow-400 hover:underline"
                                    >
                                        Submit a support ticket
                                    </a>
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="reset"
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 12 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="mb-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3">
                                    <p className="text-sm font-semibold text-yellow-400">
                                        System-prompted password reset
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-white/60">
                                        Your account has been issued a temporary
                                        password. For your security, the system
                                        requires you to set a new personal
                                        password before you can continue. This
                                        is a one-time requirement.
                                    </p>
                                </div>
                                <div className="mb-6 grid grid-cols-2 gap-2">
                                    {[
                                        "12+ characters",
                                        "Uppercase letter",
                                        "Lowercase letter",
                                        "Number",
                                        "Special character",
                                        "Not a recent password",
                                    ].map((r) => (
                                        <div
                                            key={r}
                                            className="flex items-center gap-1.5"
                                        >
                                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-500" />
                                            <span className="text-xs text-white/50">
                                                {r}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <Form {...resetForm}>
                                    <form
                                        onSubmit={resetForm.handleSubmit(
                                            onReset,
                                        )}
                                        className="space-y-5"
                                    >
                                        <FormField
                                            control={resetForm.control}
                                            name="newPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel
                                                        className={labelCls}
                                                    >
                                                        New password
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="••••••••"
                                                                type={
                                                                    showNew
                                                                        ? "text"
                                                                        : "password"
                                                                }
                                                                autoComplete="new-password"
                                                                {...field}
                                                                disabled={
                                                                    resetMutation.isPending
                                                                }
                                                                className={`${inputCls} pr-10`}
                                                            />
                                                            <button
                                                                type="button"
                                                                aria-label={
                                                                    showNew
                                                                        ? "Hide password"
                                                                        : "Show password"
                                                                }
                                                                onClick={() =>
                                                                    setShowNew(
                                                                        !showNew,
                                                                    )
                                                                }
                                                                className={
                                                                    eyeCls
                                                                }
                                                            >
                                                                {showNew ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-red-400" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={resetForm.control}
                                            name="confirm"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel
                                                        className={labelCls}
                                                    >
                                                        Confirm new password
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="••••••••"
                                                                type={
                                                                    showConfirm
                                                                        ? "text"
                                                                        : "password"
                                                                }
                                                                autoComplete="new-password"
                                                                {...field}
                                                                disabled={
                                                                    resetMutation.isPending
                                                                }
                                                                className={`${inputCls} pr-10`}
                                                            />
                                                            <button
                                                                type="button"
                                                                aria-label={
                                                                    showConfirm
                                                                        ? "Hide password"
                                                                        : "Show password"
                                                                }
                                                                onClick={() =>
                                                                    setShowConfirm(
                                                                        !showConfirm,
                                                                    )
                                                                }
                                                                className={
                                                                    eyeCls
                                                                }
                                                            >
                                                                {showConfirm ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-red-400" />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={resetMutation.isPending}
                                            className={submitCls}
                                        >
                                            {resetMutation.isPending ? (
                                                <span className="flex items-center gap-2">
                                                    <Spinner className="h-4 w-4" />
                                                    Saving…
                                                </span>
                                            ) : (
                                                "Set Password & Continue"
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </main>
        </div>
    );
}
