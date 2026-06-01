import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/Components/ui/alert-dialog";
import { toast } from "sonner";
import { Delete, Plus, Check, X, Search } from "lucide-react";
import RequestTypeDrawer from "@/Components/requestType/RequestTypeDrawer";
import TablePagination from "@/Components/TablePagination";
import axios from "axios";

export default function RequestType() {
    const {
        requestTypes,
        pagination,
        filters: initialFilters = {},
    } = usePage().props;

    const [drawerVisible, setDrawerVisible] = useState(false);
    const [drawerMode, setDrawerMode] = useState("create");
    const [editingRequestType, setEditingRequestType] = useState(null);
    const [searchValue, setSearchValue] = useState(initialFilters.search || "");
    const [statusFilter, setStatusFilter] = useState(
        initialFilters.status || "all",
    );

    // Delete confirmation state
    const [deleteDialog, setDeleteDialog] = useState({
        isOpen: false,
        id: null,
    });

    // Encode filters to base64
    const encodeFilters = (filters) => {
        return btoa(JSON.stringify(filters));
    };

    // Handle search with debounce
    const handleSearch = (value) => {
        setSearchValue(value);

        const filters = {
            ...(value ? { search: value } : {}),
            ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        };

        const encodedFilters =
            Object.keys(filters).length > 0 ? encodeFilters(filters) : null;

        router.get(
            route("requestType.form"),
            {
                filters: encodedFilters,
                page: 1,
                per_page: pagination?.per_page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    // Handle status filter change
    const handleStatusChange = (status) => {
        setStatusFilter(status);

        const filters = {
            ...(searchValue ? { search: searchValue } : {}),
            ...(status !== "all" ? { status } : {}),
        };

        const encodedFilters =
            Object.keys(filters).length > 0 ? encodeFilters(filters) : null;

        router.get(
            route("requestType.form"),
            {
                filters: encodedFilters,
                page: 1,
                per_page: pagination?.per_page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    // Pagination handlers
    const handlePageChange = (page) => {
        const filters = {
            ...(searchValue ? { search: searchValue } : {}),
            ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        };

        const encodedFilters =
            Object.keys(filters).length > 0 ? encodeFilters(filters) : null;

        router.get(
            route("requestType.form"),
            {
                page,
                per_page: pagination?.per_page,
                filters: encodedFilters,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handlePerPageChange = (size) => {
        const filters = {
            ...(searchValue ? { search: searchValue } : {}),
            ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        };

        const encodedFilters =
            Object.keys(filters).length > 0 ? encodeFilters(filters) : null;

        router.get(
            route("requestType.form"),
            {
                per_page: size,
                page: 1,
                filters: encodedFilters,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const openCreateDrawer = () => {
        setDrawerMode("create");
        setEditingRequestType(null);
        setDrawerVisible(true);
    };

    const handleRowClick = (record) => {
        setDrawerMode("edit");
        setEditingRequestType(record);
        setDrawerVisible(true);
    };

    const closeDrawer = () => setDrawerVisible(false);

    const handleSubmit = async (data) => {
        try {
            const { id, ...formData } = data;
            let response;

            if (id) {
                response = await axios.put(
                    route("request-types.update", id),
                    formData,
                );
            } else {
                response = await axios.post(
                    route("request-types.store"),
                    formData,
                );
            }

            if (response.data.success) {
                toast.success(
                    id
                        ? "Request type updated successfully!"
                        : `Request type created successfully!`,
                );
                closeDrawer();
                router.reload({
                    only: ["requestTypes", "pagination"],
                    preserveState: true,
                    preserveScroll: false,
                });
            } else {
                toast.error(response.data.message || "Operation failed");
            }
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message ||
                    "Failed to process request. Please try again.",
            );
        }
    };

    const openDeleteDialog = (id, e) => {
        e.stopPropagation();
        setDeleteDialog({ isOpen: true, id });
    };

    const handleDelete = async () => {
        try {
            const response = await axios.delete(
                route("request-types.destroy", deleteDialog.id),
            );

            if (response.data.success) {
                toast.success("Request type deleted successfully!");
                setDeleteDialog({ isOpen: false, id: null });
                router.reload({
                    only: ["requestTypes", "pagination"],
                    preserveState: true,
                    preserveScroll: false,
                });
            } else {
                toast.error(response.data.message || "Delete operation failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete request type. Please try again.");
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manage Request Types" />
            <div className="container mx-auto py-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Request Types</CardTitle>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={openCreateDrawer}
                            className="flex items-center gap-1"
                        >
                            <Plus size={16} />
                            Create
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {/* Search and Filter Bar */}
                        <div className="flex gap-4 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Search by category, name, or description..."
                                    value={searchValue}
                                    onChange={(e) =>
                                        handleSearch(e.target.value)
                                    }
                                    className="pl-8"
                                />
                            </div>
                            <select
                                className="border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                value={statusFilter}
                                onChange={(e) =>
                                    handleStatusChange(e.target.value)
                                }
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requestTypes?.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-center py-8 text-gray-500"
                                        >
                                            No request types available
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    requestTypes?.map((record) => (
                                        <TableRow
                                            key={record.id}
                                            className="cursor-pointer hover:bg-muted"
                                            onClick={() =>
                                                handleRowClick(record)
                                            }
                                        >
                                            <TableCell>{record.id}</TableCell>
                                            <TableCell>
                                                {record.request_category}
                                            </TableCell>
                                            <TableCell>
                                                {record.request_name}
                                            </TableCell>
                                            <TableCell>
                                                {record.request_description}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        record.is_active
                                                            ? "success"
                                                            : "destructive"
                                                    }
                                                    className="flex items-center gap-1 w-fit"
                                                >
                                                    {record.is_active ? (
                                                        <Check size={14} />
                                                    ) : (
                                                        <X size={14} />
                                                    )}
                                                    {record.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={(e) =>
                                                        openDeleteDialog(
                                                            record.id,
                                                            e,
                                                        )
                                                    }
                                                >
                                                    <Delete size={14} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {pagination && pagination.total > 0 && (
                            <div className="mt-4 border-t pt-4">
                                <TablePagination
                                    pagination={pagination}
                                    onChange={handlePageChange}
                                    onChangePerPage={handlePerPageChange}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Delete Confirmation Dialog */}
                <AlertDialog
                    open={deleteDialog.isOpen}
                    onOpenChange={(isOpen) =>
                        setDeleteDialog({
                            isOpen,
                            id: isOpen ? deleteDialog.id : null,
                        })
                    }
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete this request type and remove
                                it from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <RequestTypeDrawer
                    visible={drawerVisible}
                    mode={drawerMode}
                    requestType={editingRequestType}
                    onClose={closeDrawer}
                    onSubmit={handleSubmit}
                />
            </div>
        </AuthenticatedLayout>
    );
}
