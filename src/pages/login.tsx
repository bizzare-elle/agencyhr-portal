import { useState } from "react";
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

                setToken(token);
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
            },
        });
    };

    const onReset = (values: ResetValues) => {
        resetMutation.mutate(values, {
            onSuccess: async () => {
                const token = useAuthStore.getState().token;
                if (token) {
                    const user = await loadUser(token);
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

    return (
        <div
            className="relative flex min-h-screen items-center justify-center p-4"
            style={{
                backgroundImage: `url(${bgImg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className="absolute inset-0 bg-black/70" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Branding */}
                <div className="mb-8 text-center">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500 shadow-lg shadow-yellow-500/30">
                        {pendingReset ? (
                            <ShieldCheck className="h-6 w-6 text-white" />
                        ) : (
                            <LogIn className="h-6 w-6 text-white" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Agency HR
                    </h1>
                    <p className="mt-1 text-sm text-white/50">
                        {pendingReset
                            ? "Set a new password to continue"
                            : "Sign in to your account"}
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
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
                                                    <FormLabel className="text-sm font-medium text-white/70">
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
                                                            className="border-white/10 bg-white/10 text-white placeholder:text-white/30 focus-visible:border-yellow-500/50 focus-visible:ring-yellow-500/20"
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-red-300" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={loginForm.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium text-white/70">
                                                        Password
                                                    </FormLabel>
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
                                                                className="border-white/10 bg-white/10 pr-10 text-white placeholder:text-white/30 focus-visible:border-yellow-500/50 focus-visible:ring-yellow-500/20"
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
                                                                className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 transition hover:text-white/80"
                                                            >
                                                                {showPassword ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-red-300" />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={loginMutation.isPending}
                                            className="mt-2 w-full bg-yellow-500 font-semibold text-white hover:bg-yellow-600 disabled:opacity-60"
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

                                <div className="mt-6 flex flex-col items-center gap-3 border-t border-white/10 pt-6">
                                    <a
                                        href="https://backoffice.wildflour.com.ph/forgot_email_agency"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-white/50 transition hover:text-yellow-400"
                                    >
                                        Forgot password?
                                    </a>
                                    <a
                                        href="https://support.agencyhr.ph"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-white/50 transition hover:text-white/80"
                                    >
                                        Need help? Submit a support ticket
                                    </a>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="reset"
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 12 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="mb-5 rounded-xl border border-yellow-500/20 bg-yellow-500/8 px-4 py-3">
                                    <p className="text-sm font-semibold text-yellow-400">
                                        System-prompted password reset
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-white/50">
                                        Your account has been issued a temporary password. For your security, the system requires you to set a new personal password before you can continue. This is a one-time requirement.
                                    </p>
                                </div>
                                <div className="mb-5 grid grid-cols-2 gap-1.5">
                                    {[
                                        "12+ characters",
                                        "Uppercase letter",
                                        "Lowercase letter",
                                        "Number",
                                        "Special character",
                                        "Not a recent password",
                                    ].map((r) => (
                                        <div key={r} className="flex items-center gap-1.5">
                                            <span className="h-1 w-1 flex-shrink-0 rounded-full bg-white/20" />
                                            <span className="text-[11px] text-white/40">{r}</span>
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
                                                    <FormLabel className="text-sm font-medium text-white/70">
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
                                                                className="border-white/10 bg-white/10 pr-10 text-white placeholder:text-white/30 focus-visible:border-yellow-500/50 focus-visible:ring-yellow-500/20"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setShowNew(
                                                                        !showNew,
                                                                    )
                                                                }
                                                                className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 transition hover:text-white/80"
                                                            >
                                                                {showNew ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-red-300" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={resetForm.control}
                                            name="confirm"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium text-white/70">
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
                                                                className="border-white/10 bg-white/10 pr-10 text-white placeholder:text-white/30 focus-visible:border-yellow-500/50 focus-visible:ring-yellow-500/20"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setShowConfirm(
                                                                        !showConfirm,
                                                                    )
                                                                }
                                                                className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 transition hover:text-white/80"
                                                            >
                                                                {showConfirm ? (
                                                                    <EyeOff className="h-4 w-4" />
                                                                ) : (
                                                                    <Eye className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-red-300" />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={resetMutation.isPending}
                                            className="mt-2 w-full bg-yellow-500 font-semibold text-white hover:bg-yellow-600 disabled:opacity-60"
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
                </div>
            </motion.div>
        </div>
    );
}
