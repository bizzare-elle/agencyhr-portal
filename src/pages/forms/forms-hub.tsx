import { useNavigate, useParams, Link } from "react-router-dom";
import { ParentComponent } from "@/components/parent-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    GitBranch,
    UserCog,
    LogOut,
    Users,
    TrendingUp,
    Building2,
    DollarSign,
    FileText,
    ClipboardList,
} from "lucide-react";

const eicfTypes = [
    {
        label: "Promotion",
        description: "Propose a promotion with updated position or pay.",
        icon: TrendingUp,
        type: "promotion",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20 hover:border-yellow-500/40",
    },
    {
        label: "Position Title Change / Lateral Transfer",
        description: "Request a change in position title or a lateral transfer.",
        icon: UserCog,
        type: "position_change",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20 hover:border-blue-500/40",
    },
    {
        label: "Transfer to Other Department",
        description: "Request a transfer to a different department or division.",
        icon: Building2,
        type: "department_transfer",
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20 hover:border-purple-500/40",
    },
    {
        label: "Transfer to Other Brand / Branch",
        description: "Request a transfer to a different brand or branch location.",
        icon: GitBranch,
        type: "branch_transfer",
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/20 hover:border-cyan-500/40",
    },
    {
        label: "Pay Change",
        description: "Request a change in compensation or pay rate.",
        icon: DollarSign,
        type: "pay_change",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20 hover:border-emerald-500/40",
    },
    {
        label: "Change in Personal Information",
        description: "Request a correction or update to personal information.",
        icon: FileText,
        type: "personal_info",
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20 hover:border-orange-500/40",
    },
    {
        label: "Resignation",
        description: "File a resignation notice on behalf of an employee.",
        icon: LogOut,
        type: "resignation",
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/20 hover:border-red-500/40",
    },
];

export default function FormsHub() {
    const navigate = useNavigate();
    const { id } = useParams();

    return (
        <ParentComponent>
            <Card className="w-full shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Forms</CardTitle>
                    <CardDescription>
                        File employee information changes or manpower requests.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-8">
                    {/* Submissions link */}
                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <ClipboardList className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">View Submitted Forms</p>
                                <p className="text-xs text-muted-foreground">Track all filed EICF submissions.</p>
                            </div>
                        </div>
                        <Link to={`/forms/submissions/${id}`}>
                            <Button size="sm" variant="outline" className="gap-1.5">
                                View
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </div>

                    {/* EICF Section */}
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <span className="rounded-md bg-yellow-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-yellow-400">
                                EICF
                            </span>
                            <h2 className="text-sm font-semibold">
                                Employee Information Change Form
                            </h2>
                        </div>
                        <p className="mb-5 text-sm text-muted-foreground">
                            File a request for employment information changes on behalf of your team.
                        </p>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {eicfTypes.map((item) => (
                                <button
                                    key={item.type}
                                    onClick={() => navigate(`/forms/eicf/${id}?type=${item.type}`)}
                                    className={`group flex flex-col gap-3 rounded-xl border ${item.border} bg-card p-4 text-left transition hover:bg-accent`}
                                >
                                    <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${item.bg}`}>
                                        <item.icon className={`h-4 w-4 ${item.color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold leading-tight text-foreground">
                                            {item.label}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground leading-snug">
                                            {item.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition group-hover:text-foreground">
                                        File request
                                        <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t" />

                    {/* MRF Section */}
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <span className="rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-green-400">
                                MRF
                            </span>
                            <h2 className="text-sm font-semibold">
                                Manpower Request Form
                            </h2>
                        </div>
                        <p className="mb-5 text-sm text-muted-foreground">
                            Request to fill a vacant or new position in your branch.
                        </p>

                        <button
                            onClick={() => navigate(`/forms/mrf/${id}`)}
                            className="group flex w-full flex-col gap-3 rounded-xl border border-green-500/20 bg-card p-4 text-left transition hover:bg-accent hover:border-green-500/40 sm:max-w-xs"
                        >
                            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                                <Users className="h-4 w-4 text-green-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-foreground">
                                    Request for Replacement / New Hire
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground leading-snug">
                                    File a manpower request for a replacement or newly created position.
                                </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition group-hover:text-foreground">
                                File request
                                <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                            </div>
                        </button>
                    </div>
                </CardContent>
            </Card>
        </ParentComponent>
    );
}
