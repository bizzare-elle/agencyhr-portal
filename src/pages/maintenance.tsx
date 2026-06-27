import bgImg from "@/assets/images/bg-3.avif";
import { motion } from "framer-motion";

export default function Maintenance() {
    return (
        <div
            className="relative flex min-h-screen flex-col items-center justify-center p-6"
            style={{
                backgroundImage: `url(${bgImg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className="absolute inset-0 bg-black/75" />

            <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-xl"
            >
                {/* Branding */}
                <div className="mb-10 text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 shadow-xl shadow-amber-500/30">
                        <svg
                            className="h-8 w-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        System Maintenance
                    </h1>
                    <p className="mt-2 text-base text-white/50">
                        Atlas Agency HR Portal
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
                    {/* Header stripe */}
                    <div className="flex items-center gap-3 border-b border-white/10 px-8 py-4">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_3px_rgba(251,191,36,0.45)]" />
                        <p className="text-xs font-semibold tracking-widest text-amber-400/80 uppercase">
                            📣 Announcement — Scheduled Downtime
                        </p>
                    </div>

                    {/* Body */}
                    <div className="space-y-5 px-8 py-8 text-base text-white/70">
                        <p className="leading-relaxed">
                            Please be advised that the{" "}
                            <span className="font-semibold text-white">
                                Atlas System and Agency Portal
                            </span>{" "}
                            will be{" "}
                            <span className="font-semibold text-rose-400">
                                unavailable
                            </span>{" "}
                            due to scheduled system maintenance from{" "}
                            <span className="font-semibold text-amber-400">
                                10:00 PM
                            </span>{" "}
                            to{" "}
                            <span className="font-semibold text-amber-400">
                                6:00 AM
                            </span>
                            .
                        </p>

                        {/* Reminder block */}
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-4">
                            <div className="mb-2 flex items-center gap-2">
                                <svg
                                    className="h-4 w-4 shrink-0 text-amber-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                    />
                                </svg>
                                <span className="text-xs font-semibold tracking-widest text-amber-400/80 uppercase">
                                    Reminder
                                </span>
                            </div>
                            <p className="leading-relaxed">
                                To avoid any disruption, please ensure that all{" "}
                                <span className="font-semibold text-white">
                                    transactions
                                </span>{" "}
                                scheduled within this time frame are completed{" "}
                                <span className="font-semibold text-amber-400">
                                    before 10:00 PM
                                </span>
                                .
                            </p>
                        </div>

                        <p className="leading-relaxed">
                            Thank you for your understanding and cooperation.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-2.5 border-t border-white/10 px-8 py-5">
                        <svg
                            className="h-4 w-4 shrink-0 text-white/30"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                            />
                        </svg>
                        <p className="text-sm text-white/30">
                            For inquiries, contact the{" "}
                            <span className="text-white/50">
                                IT Systems Team
                            </span>{" "}
                            via <span className="text-white/50">Viber</span> or{" "}
                            <span className="text-white/50">WhatsApp</span>
                        </p>
                    </div>
                </div>

                {/* Bottom label */}
                <p className="mt-6 text-center text-xs text-white/20">
                    © Wildflour Hospitality Group
                </p>
            </motion.div>
        </div>
    );
}
