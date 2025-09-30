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
    CardFooter,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { jwtDecode } from "jwt-decode";

type TokenPayload = {
    data: {
        user_id: string;
        role: string;
    };
    iat: number;
    exp: number;
};

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
    const loginMutation = useMutation({
        mutationFn: async (data: LoginValues) => {
            const response = await api.post("api/v2/auth/login", data);
            return response.data;
        },
    });

    const setToken = useAuth((state) => state.setToken);

    const onSubmit = (data: LoginValues) => {
        loginMutation.mutate(data, {
            onSuccess: (response) => {
                if (response?.token) {
                    setToken(response.token);

                    const decoded = jwtDecode<TokenPayload>(response.token);
                    const userId = decoded.data.user_id;

                    navigate(`/${userId}`);
                }
            },
            onError: (error: any) => {
                toast.error(
                    error?.response?.data?.message ||
                        "An error occurred during login.",
                );
            },
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="space-y-2 text-center">
                    <CardTitle className="text-3xl font-bold">
                        Welcome Back
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                        Sign in to manage your operations team and agency tasks.
                    </p>
                </CardHeader>

                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="you@example.com"
                                                type="email"
                                                {...field}
                                                disabled={
                                                    loginMutation.isPending
                                                }
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
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="********"
                                                type="password"
                                                {...field}
                                                disabled={
                                                    loginMutation.isPending
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-center justify-between text-sm">
                                <a
                                    href="/forgot-password"
                                    className="hover:underline"
                                >
                                    Forgot password?
                                </a>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loginMutation.isPending}
                            >
                                {loginMutation.isPending
                                    ? "Logging in..."
                                    : "Login"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>

                {/* <CardFooter className="flex justify-start">
                    <p className="text-sm">
                        <a className="underline" href="">
                            Forgot Password?
                        </a>
                    </p>
                </CardFooter> */}
            </Card>
        </div>
    );
}
