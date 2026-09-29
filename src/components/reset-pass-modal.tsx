import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useAuthStore } from "@/hooks/use-auth";

// Mirrors the backend's actual rules (Auth::reset_password()) -- min 6 with
// no composition check let the client accept passwords the server would
// always reject with a 422, since the server enforces its own rules
// regardless of what the client validates.
const passwordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, "Your current password is required"),
        password: z
            .string()
            .min(12, "Minimum 12 characters required")
            .regex(/[A-Z]/, "Must include an uppercase letter")
            .regex(/[a-z]/, "Must include a lowercase letter")
            .regex(/[0-9]/, "Must include a number")
            .regex(/[\W_]/, "Must include a special character (e.g. @, #, !)"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type ResetValues = z.infer<typeof passwordSchema>;

interface ResetPasswordModalProps {
    open: boolean;
    onClose: () => void;
    employeeId: string | number;
}

export default function ResetPasswordModal({
    open,
    onClose,
    employeeId,
}: ResetPasswordModalProps) {
    const form = useForm<ResetValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            password: "",
            confirmPassword: "",
        },
    });

    const [showCurrent, setShowCurrent] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const setToken = useAuthStore((s) => s.setToken);
    const loadUser = useAuthStore((s) => s.loadUser);

    const resetMutation = useMutation({
        mutationFn: async (data: ResetValues) => {
            const response = await api.post<
                ApiResponse<{ token?: string }>
            >(`/api/v2/auth/reset/${employeeId}`, {
                password: data.password,
                current_password: data.currentPassword,
            });
            return response.data;
        },
        onSuccess: async (response) => {
            // The endpoint revokes every existing token for this account as
            // part of the reset (including the one used to make this very
            // request) and mints a fresh one in the same response -- without
            // adopting it here, the next API call made with the old token
            // would fail with "Session has been revoked."
            const freshToken = response?.data?.token;
            if (freshToken) {
                setToken(freshToken);
                await loadUser(freshToken);
            }
            toast.success("Password reset successfully!");
            form.reset();
            onClose();
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || "Password Reset Failed.",
            );
        },
    });

    const onSubmit = (values: ResetValues) => {
        resetMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="max-w-md rounded-xl px-10 py-5"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="py-3">
                    <DialogTitle className="text-xl font-semibold">
                        Reset Password
                    </DialogTitle>
                    <DialogDescription>
                        Reset your agencyhr portal password.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-5"
                    >
                        <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <div className="relative">
                                        <FormControl>
                                            <Input
                                                type={
                                                    showCurrent
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="********"
                                                autoComplete="current-password"
                                                {...field}
                                                disabled={
                                                    resetMutation.isPending
                                                }
                                            />
                                        </FormControl>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowCurrent(!showCurrent)
                                            }
                                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                                        >
                                            {showCurrent ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <div className="relative">
                                        <FormControl>
                                            <Input
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="********"
                                                {...field}
                                                disabled={
                                                    resetMutation.isPending
                                                }
                                            />
                                        </FormControl>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Confirm Password Field */}
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <div className="relative">
                                        <FormControl>
                                            <Input
                                                type={
                                                    showConfirm
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="********"
                                                {...field}
                                                disabled={
                                                    resetMutation.isPending
                                                }
                                            />
                                        </FormControl>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirm(!showConfirm)
                                            }
                                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                                        >
                                            {showConfirm ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-3 pt-3">
                            <Button
                                type="submit"
                                disabled={resetMutation.isPending}
                            >
                                {resetMutation.isPending ? (
                                    <>
                                        <Spinner className="mr-2 h-4 w-4" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update"
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
