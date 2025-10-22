import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAuthStore } from "@/hooks/use-auth";
import bgImg from "../assets/images/bg-3.avif";
import { Spinner } from "@/components/ui/spinner";

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

                    console.log(user);
                    if (user.role == "agency_coordinator") {
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
            className="flex min-h-screen items-center justify-center p-4 sm:p-6 md:p-8"
            style={back}
        >
            <Card className="bg-background/40 w-full max-w-sm rounded-2xl shadow-xl backdrop-blur-md sm:max-w-md sm:px-8 sm:py-10">
                <CardHeader className="space-y-2 text-center">
                    <CardTitle className="text-2xl font-bold sm:text-3xl">
                        Welcome Back
                    </CardTitle>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                        Sign in to manage your operations team and agency tasks.
                    </p>
                </CardHeader>

                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-5 sm:space-y-6"
                        >
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm sm:text-base">
                                            Email
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="you@example.com"
                                                type="email"
                                                {...field}
                                                disabled={
                                                    loginMutation.isPending
                                                }
                                                className="text-sm sm:text-base"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm sm:text-base">
                                            Password
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="********"
                                                type="password"
                                                {...field}
                                                disabled={
                                                    loginMutation.isPending
                                                }
                                                className="text-sm sm:text-base"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="mt-4 w-full text-sm sm:text-base"
                                disabled={loginMutation.isPending}
                            >
                                {loginMutation.isPending ? (
                                    <>
                                        <Spinner className="h-4 w-4" />
                                        <span>Logging in</span>
                                    </>
                                ) : (
                                    "Login"
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
