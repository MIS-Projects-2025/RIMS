import React, { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Separator } from "@/Components/ui/separator";
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Ban,
    Send,
    Loader2,
} from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage, router } from "@inertiajs/react";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import ActionRemarksModal from "@/Components/request/ActionRemarksModal";
import IssueDrawer from "@/Components/request/IssueDrawer";

const RequestDetailView = () => {
    const { request, actions } = usePage().props;
    console.log(request);

    // Modal & drawer state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    const handleBack = () => {
        const appName = window.location.pathname.split("/")[1];
        router.visit(`/${appName}/request/table`);
    };

    const handleIssueItem = (item) => {
        setSelectedItem(item);
        setIsDrawerOpen(true);
    };

    const itemColumns = [
        { key: "id", label: "ID" },
        { key: "category", label: "Category" },
        { key: "type_of_request", label: "Type of Request" },
        { key: "request_mode", label: "Request Mode" },
        { key: "issued_to_name", label: "Issued To" },
        { key: "location_name", label: "Location" },
        { key: "quantity", label: "Quantity" },
        { key: "purpose_of_request", label: "Purpose" },
        { key: "item_status", label: "Item Status" },
        { key: "actions", label: "Actions" },
    ];

    const getStatusBadgeClass = (color) => {
        const colorClasses = {
            gold: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
            green: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
            blue: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
            red: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
            lime: "bg-lime-100 text-lime-800 border-lime-200 hover:bg-lime-100",
            orange: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
            default:
                "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100",
        };
        return colorClasses[color] || colorClasses.default;
    };

    const getModeBadgeClass = (mode) => {
        return mode === "bulk"
            ? "bg-blue-100 text-blue-800 border-blue-200"
            : "bg-green-100 text-green-800 border-green-200";
    };

    const availableActionConfig = {
        APPROVE: {
            label: "Approve",
            icon: CheckCircle,
            variant: "default",
            className: "bg-green-600 hover:bg-green-700",
        },
        DISAPPROVE: {
            label: "Disapprove",
            icon: XCircle,
            variant: "destructive",
        },
        ONGOING: {
            label: "Ongoing",
            icon: Loader2,
            variant: "outline",
            className: "text-orange-600 border-orange-200 hover:bg-orange-50",
        },
        DONE: {
            label: "Done",
            icon: CheckCircle,
            variant: "default",
            className: "bg-blue-600 hover:bg-blue-700",
        },
        ACKNOWLEDGE: {
            label: "Acknowledge",
            icon: CheckCircle,
            variant: "default",
            className: "bg-purple-600 hover:bg-purple-700",
        },
        CANCEL: {
            label: "Cancel",
            icon: Ban,
            variant: "destructive",
        },
    };

    const handleActionClick = (key) => {
        if (["APPROVE", "DISAPPROVE"].includes(key)) {
            setSelectedAction(key);
            setIsModalOpen(true);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedAction(null);
    };

    const handleDrawerClose = () => {
        setIsDrawerOpen(false);
        setSelectedItem(null);
    };

    // Filter actions - remove ISSUE and VIEW from top-level actions
    const displayActions =
        actions?.filter((a) => {
            const key = a.toUpperCase();
            return key !== "VIEW" && key !== "ISSUE";
        }) || [];

    return (
        <AuthenticatedLayout>
            <div className="p-6 space-y-6">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="flex items-center gap-2 -ml-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Requests
                </Button>

                {/* Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Request Details
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            View and manage request information
                        </p>
                    </div>
                    {displayActions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {displayActions.map((a) => {
                                const key = a.toUpperCase();
                                const cfg = availableActionConfig[key];
                                if (!cfg) return null;
                                const Icon = cfg.icon;
                                return (
                                    <Button
                                        key={key}
                                        variant={cfg.variant || "outline"}
                                        className={cfg.className}
                                        onClick={() => handleActionClick(key)}
                                    >
                                        <Icon className="h-4 w-4 mr-2" />
                                        {cfg.label}
                                    </Button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Request Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Request Information</CardTitle>
                        <CardDescription>
                            Details of the request and requester
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Request Number
                                </p>
                                <p className="text-sm font-semibold">
                                    {request.request_number}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Status
                                </p>
                                <Badge
                                    className={cn(
                                        "font-medium",
                                        getStatusBadgeClass(
                                            request.status_color,
                                        ),
                                    )}
                                >
                                    {request.status_label}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Requestor Name
                                </p>
                                <p className="text-sm">
                                    {request.requestor_name}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Department
                                </p>
                                <p className="text-sm">
                                    {request.requestor_department}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Product Line
                                </p>
                                <p className="text-sm">
                                    {request.requestor_prodline}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Station
                                </p>
                                <p className="text-sm">
                                    {request.requestor_station}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Created Date
                                </p>
                                <p className="text-sm">
                                    {dayjs(request.created_at).format(
                                        "MMM D, YYYY h:mm A",
                                    )}
                                </p>
                            </div>
                            {request.remarks && (
                                <div className="space-y-1 md:col-span-2 lg:col-span-3">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Remarks
                                    </p>
                                    <p className="text-sm bg-muted p-3 rounded-md">
                                        {request.remarks}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Request Items Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Request Items ({request.items?.length || 0})
                        </CardTitle>
                        <CardDescription>
                            Items included in this request
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {itemColumns.map((column) => (
                                            <TableHead key={column.key}>
                                                {column.label}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {request.items?.length > 0 ? (
                                        request.items.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell>
                                                    {record.id}
                                                </TableCell>
                                                <TableCell>
                                                    {record.category}
                                                </TableCell>
                                                <TableCell>
                                                    {record.type_of_request}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={getModeBadgeClass(
                                                            record.request_mode,
                                                        )}
                                                    >
                                                        {record.request_mode?.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {record.issued_to_name}
                                                </TableCell>
                                                <TableCell>
                                                    {record.location_name}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {record.quantity}
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate">
                                                    {record.purpose_of_request}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={getStatusBadgeClass(
                                                            record.item_status_color,
                                                        )}
                                                    >
                                                        {
                                                            record.item_status_label
                                                        }
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {actions?.includes(
                                                        "ISSUE",
                                                    ) &&
                                                    request.status === 3 &&
                                                    record.item_status == 1 ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                handleIssueItem(
                                                                    record,
                                                                )
                                                            }
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Send className="h-3 w-3" />
                                                            Issue
                                                        </Button>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={itemColumns.length}
                                                className="text-center py-8 text-muted-foreground"
                                            >
                                                No items found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Modals */}
                <ActionRemarksModal
                    open={isModalOpen}
                    onClose={handleModalClose}
                    action={selectedAction}
                />

                <IssueDrawer
                    open={isDrawerOpen}
                    onClose={handleDrawerClose}
                    request={request}
                    item={selectedItem}
                    onSuccess={() => window.location.reload()}
                />
            </div>
        </AuthenticatedLayout>
    );
};

export default RequestDetailView;
