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
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
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
                const user = await loadUser();

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

    const back = {
        backgroundImage: `url(${bgImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
    };

    return (
        <div
            className="relative flex min-h-screen items-center justify-center bg-gray-100 p-4 sm:p-6 md:p-8"
            style={back}
        >
            {/* Overlay for contrast */}
            <div className="absolute inset-0 bg-black/60" />

            <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-sm sm:max-w-md"
            >
                <Card className="rounded-xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md">
                    <CardHeader className="space-y-1 pb-2 text-center">
                        <CardTitle className="text-2xl font-semibold text-white">
                            Welcome to AgencyHR
                        </CardTitle>
                        <CardDescription className="text-sm text-white/70">
                            Sign in to manage your team and agency tasks.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
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
                                            <FormLabel className="text-white/90">
                                                Email address
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="you@example.com"
                                                    type="email"
                                                    {...field}
                                                    disabled={
                                                        loginMutation.isPending
                                                    }
                                                    className="border-white/30 bg-white/20 text-white placeholder:text-white/60 focus:border-white/50 focus:ring-2 focus:ring-white/30"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-200" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white/90">
                                                Password
                                            </FormLabel>
                                            <div className="relative">
                                                <FormControl>
                                                    <Input
                                                        placeholder="••••••••"
                                                        type={
                                                            showPassword
                                                                ? "text"
                                                                : "password"
                                                        }
                                                        {...field}
                                                        disabled={
                                                            loginMutation.isPending
                                                        }
                                                        className="border-white/30 bg-white/20 pr-10 text-white placeholder:text-white/60 focus:border-white/50 focus:ring-2 focus:ring-white/30"
                                                    />
                                                </FormControl>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            !showPassword,
                                                        )
                                                    }
                                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-black/70 transition hover:text-black"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                            <FormMessage className="text-red-200" />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="mt-2 w-full bg-white font-semibold text-gray-900 hover:bg-white/90"
                                    disabled={loginMutation.isPending}
                                >
                                    {loginMutation.isPending ? (
                                        <div className="flex items-center gap-2">
                                            <Spinner className="h-4 w-4" />
                                            <span>Logging in...</span>
                                        </div>
                                    ) : (
                                        "Log In"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                    <p className="mt-4 text-center text-sm text-white/80">
                        <a
                            href="https://support.agencyhr.ph"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-white"
                        >
                            Need support? Click here to submit a ticket
                        </a>
                    </p>
                </Card>

                <p className="mt-6 text-center text-xs text-white/70">
                    © {new Date().getFullYear()} Wildflour Hospitality Group
                </p>
            </motion.div>
        </div>
    );
}
