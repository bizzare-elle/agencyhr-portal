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
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";

const passwordSchema = z
    .object({
        password: z
            .string()
            .min(6, "Password must be at least 6 characters long"),
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
        defaultValues: { password: "", confirmPassword: "" },
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const resetMutation = useMutation({
        mutationFn: async (data: ResetValues) => {
            const { password } = data;
            const response = await api.post(
                `/api/v2/auth/reset/${employeeId}`,
                {
                    password,
                },
            );
            return response.data;
        },
        onSuccess: () => {
            toast.success("Password Reset Successfully!");
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
