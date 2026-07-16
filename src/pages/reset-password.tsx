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
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAuthStore } from "@/hooks/use-auth";
import bgImg from "@/assets/images/bg-3.avif";
import { Spinner } from "@/components/ui/spinner";
import { motion } from "framer-motion";

const schema = z
    .object({
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain at least one uppercase letter")
            .regex(/[0-9]/, "Must contain at least one number"),
        confirm: z.string().min(1, "Please confirm your password"),
    })
    .refine((d) => d.password === d.confirm, {
        message: "Passwords do not match",
        path: ["confirm"],
    });

type FormValues = z.infer<typeof schema>;

const rules = [
    "At least 8 characters",
    "One uppercase letter",
    "One number",
];

export default function ResetPasswordPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const loadUser = useAuthStore((s) => s.loadUser);
    const token = useAuthStore((s) => s.token);

    const [showPw, setShowPw] = useState(false);
    const [showCf, setShowCf] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { password: "", confirm: "" },
    });

    const resetMutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const res = await api.post(`/api/v2/auth/reset_password/${id}`, {
                password: data.password,
            });
            return res.data;
        },
    });

    const onSubmit = (values: FormValues) => {
        resetMutation.mutate(values, {
            onSuccess: async () => {
                toast.success("Password updated! Redirecting…");
                if (token) {
                    const user = await loadUser(token);
                    if (user?.id) {
                        if (user.is_admin === 1) {
                            navigate(`/admin/${user.id}`);
                        } else if (user.role === "agency_coordinator") {
                            navigate(`/dashboard/${user.agency_id}`);
                        } else {
                            navigate(`/employees/${user.id}`);
                        }
                        return;
                    }
                }
                navigate("/login");
            },
            onError: (err: any) => {
                toast.error(
                    err?.response?.data?.message || "Failed to reset password",
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
            <div className="absolute inset-0 bg-black/75" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Branding */}
                <div className="mb-8 text-center">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500 shadow-lg shadow-yellow-500/30">
                        <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Set a new password
                    </h1>
                    <p className="mt-1 text-sm text-white/50">
                        Your account requires a one-time password update before you can continue.
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
                    {/* Requirements */}
                    <div className="mb-6 flex flex-wrap gap-2">
                        {rules.map((r) => (
                            <span
                                key={r}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-[11px] text-white/40"
                            >
                                {r}
                            </span>
                        ))}
                    </div>

                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-5"
                        >
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium text-white/70">
                                            New password
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showPw ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    autoComplete="new-password"
                                                    {...field}
                                                    disabled={resetMutation.isPending}
                                                    className="border-white/10 bg-white/10 pr-10 text-white placeholder:text-white/30 focus-visible:border-yellow-500/50 focus-visible:ring-yellow-500/20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPw(!showPw)}
                                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 transition hover:text-white/80"
                                                >
                                                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-red-300" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirm"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium text-white/70">
                                            Confirm new password
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showCf ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    autoComplete="new-password"
                                                    {...field}
                                                    disabled={resetMutation.isPending}
                                                    className="border-white/10 bg-white/10 pr-10 text-white placeholder:text-white/30 focus-visible:border-yellow-500/50 focus-visible:ring-yellow-500/20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCf(!showCf)}
                                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 transition hover:text-white/80"
                                                >
                                                    {showCf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                </div>
            </motion.div>
        </div>
    );
}
