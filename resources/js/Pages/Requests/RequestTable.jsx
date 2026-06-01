import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage, router } from "@inertiajs/react";
import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Eye, Loader2, Search } from "lucide-react";
import StatCard from "@/Components/StatCard";
import useRequestTable from "@/Hooks/useRequestTable";
import { cn } from "@/lib/utils";
import TablePagination from "@/Components/TablePagination";

const RequestTable = () => {
    const {
        requests,
        pagination,
        statusCounts,
        filters: initialFilters,
    } = usePage().props;

    const {
        loading,
        searchValue,
        statusFilter,
        handleStatusChange,
        handleSearch,
        handlePageChange,
        handlePerPageChange,
    } = useRequestTable({ initialFilters, pagination });

    const handleViewRequest = (record) => {
        const appName = window.location.pathname.split("/")[1];
        const encodedId = btoa(record.id);
        const encodedActions = btoa(JSON.stringify(record.actions));

        router.visit(`/${appName}/requests/show/${encodedId}`, {
            data: { actions: encodedActions },
            preserveState: true,
        });
    };

    const columns = [
        { key: "id", label: "ID" },
        { key: "request_number", label: "Request Number" },
        { key: "requestor_name", label: "Requestor Name" },
        { key: "requestor_department", label: "Request Department" },
        { key: "status", label: "Status" },
        { key: "actions", label: "Actions" },
    ];

    const getStatusBadgeClass = (color) => {
        const colorClasses = {
            gold: "bg-yellow-100 text-yellow-800 border-yellow-200",
            green: "bg-green-100 text-green-800 border-green-200",
            blue: "bg-blue-100 text-blue-800 border-blue-200",
            red: "bg-red-100 text-red-800 border-red-200",
            lime: "bg-lime-100 text-lime-800 border-lime-200",
            default: "bg-gray-100 text-gray-800 border-gray-200",
        };
        return colorClasses[color] || colorClasses.default;
    };

    return (
        <AuthenticatedLayout>
            <div className="p-6">
                <StatCard
                    stats={statusCounts}
                    activeStatus={statusFilter}
                    onStatusChange={handleStatusChange}
                />

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center mb-4">
                            <div className="relative w-72">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Search requests..."
                                    value={searchValue}
                                    onChange={(e) =>
                                        handleSearch(e.target.value)
                                    }
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {columns.map((column) => (
                                            <TableHead key={column.key}>
                                                {column.label}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length}
                                                className="text-center py-8"
                                            >
                                                <div className="flex justify-center items-center">
                                                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                                                    <span className="ml-2">
                                                        Loading...
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : requests?.length > 0 ? (
                                        requests.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell>
                                                    {record.id}
                                                </TableCell>
                                                <TableCell>
                                                    {record.request_number}
                                                </TableCell>
                                                <TableCell>
                                                    {record.requestor_name}
                                                </TableCell>
                                                <TableCell>
                                                    {
                                                        record.requestor_department
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                            getStatusBadgeClass(
                                                                record.status_color,
                                                            ),
                                                        )}
                                                    >
                                                        {record.status_label}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleViewRequest(
                                                                record,
                                                            )
                                                        }
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length}
                                                className="text-center py-8 text-gray-500"
                                            >
                                                No requests found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="border-t px-4 flex-shrink-0">
                            <TablePagination
                                pagination={pagination}
                                onChange={(page) => handlePageChange(page)}
                                onChangePerPage={(size) =>
                                    handlePerPageChange(size)
                                }
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
};

export default RequestTable;
