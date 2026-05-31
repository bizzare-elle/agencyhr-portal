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
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAuthStore } from "@/hooks/use-auth";
import bgImg from "@/assets/images/bg-3.avif";
import { Spinner } from "@/components/ui/spinner";
import { motion } from "framer-motion";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const navigate = useNavigate();
    const setToken = useAuthStore((s) => s.setToken);
    const loadUser = useAuthStore((s) => s.loadUser);

    const [showPassword, setShowPassword] = useState(false);

    const loginMutation = useMutation({
        mutationFn: async (data: LoginValues) => {
            const response = await api.post("/api/v2/auth/login", data);
            return response.data;
        },
    });

    const onSubmit = (values: LoginValues) => {
        loginMutation.mutate(values, {
            onSuccess: async (response) => {
                const token = response?.data?.token;
                if (!token) return;

                setToken(token);
                const user = await loadUser(token);

                if (user?.id) {
                    toast.success("Login successful!");
                    if (user.role === "agency_coordinator") {
                        navigate(`/dashboard/${user.agency_id}`);
                    } else {
                        navigate(`/employees/${user.id}`);
                    }
                } else {
                    toast.error("Failed to load user info.");
                }
            },
            onError: (err: any) => {
                toast.error(err?.response?.data?.message || "Login failed");
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
                        <LogIn className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Agency HR
                    </h1>
                    <p className="mt-1 text-sm text-white/50">
                        Sign in to your account
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-5"
                        >
                            <FormField
                                control={form.control}
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
                                                disabled={loginMutation.isPending}
                                                className="border-white/10 bg-white/10 text-white placeholder:text-white/30 focus-visible:border-yellow-500/50 focus-visible:ring-yellow-500/20"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-300" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
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
                                                    type={showPassword ? "text" : "password"}
                                                    autoComplete="current-password"
                                                    {...field}
                                                    disabled={loginMutation.isPending}
                                                    className="border-white/10 bg-white/10 pr-10 text-white placeholder:text-white/30 focus-visible:border-yellow-500/50 focus-visible:ring-yellow-500/20"
                                                />
                                                <button
                                                    type="button"
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 transition hover:text-white/80"
                                                >
                                                    {showPassword
                                                        ? <EyeOff className="h-4 w-4" />
                                                        : <Eye className="h-4 w-4" />
                                                    }
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
                            Forgot your email?
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
                </div>
            </motion.div>
        </div>
    );
}
